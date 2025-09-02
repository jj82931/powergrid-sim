# backend/app/sim.py
# 최소한의 전력조류 계산 + KPI 산출
# 학생 수준 코드. 간단한 가정과 프로파일 기반.

from typing import List, Dict, Any
import pandapower as pp
from .data import load_network, load_profile
from pandapower.auxiliary import LoadflowNotConverged

LIMIT_LOW = 0.94
LIMIT_HIGH = 1.06
LOAD_BASE_KW = 150.0   # 프로파일 값을 kW로 바꾸는 전체 스케일
PV_BASE_KW = 150.0     # PV도 같은 스케일 사용


def build_pp_net(net_json: Dict[str, Any]) -> pp.pandapowerNet:
    """
    네트워크 JSON으로부터 pandapower 네트워크를 생성한다.
    - 버스는 bus_0, bus_1, ... 순서로 생성
    - bus_0을 슬랙으로 가정
    - 라인은 JSON의 r_ohm, x_ohm을 사용
    - length_km 키가 있으면 해당 값을 사용하고 없으면 0.05 km
    """
    # 500 kVA 트랜스 정격을 MVA로 환산해 sn_mva 지정
    sn_mva = float(net_json.get("transformer_kva", 500)) / 1000.0
    if sn_mva <= 0:
        sn_mva = 0.5

    net = pp.create_empty_network(sn_mva=sn_mva)

    # 버스 생성
    base_kv = float(net_json.get("base_kv", 0.4))
    for b in net_json["buses"]:
        pp.create_bus(net, vn_kv=base_kv, name=b["id"])

    # 슬랙
    pp.create_ext_grid(net, bus=0, vm_pu=1.0)

    # 라인 생성
    for ln in net_json["lines"]:
        f = int(str(ln["from"]).split("_")[1])
        t = int(str(ln["to"]).split("_")[1])
        length_km = float(ln.get("length_km", 0.05))
        pp.create_line_from_parameters(
            net,
            from_bus=f,
            to_bus=t,
            length_km=length_km,
            r_ohm_per_km=float(ln["r_ohm"]),
            x_ohm_per_km=float(ln["x_ohm"]),
            c_nf_per_km=0.0,
            max_i_ka=0.4,
        )

    return net


def simulate(feeder_id: str, pv_adopt: float, bat_adopt: float, hour: int) -> Dict[str, Any]:
    nj = load_network(feeder_id)
    net = build_pp_net(nj)
    load_prof = load_profile("load")
    pv_prof = load_profile("pv")
    
    base_kw = float(load_prof[hour]) * LOAD_BASE_KW
    pv_kw   = float(pv_prof[hour])  * PV_BASE_KW * float(pv_adopt)
    n_loads = max(1, len(nj["buses"]) - 1)
    scale = float(nj.get("load_scale", 1.0))
    per_kw = max(0.0, (base_kw - pv_kw)) * scale / n_loads

    for i in range(1, n_loads + 1):
        pp.create_load(net, bus=i, p_mw=per_kw / 1000.0)

    # 1차: BFSW 시도
    converged = True
    try:
        pp.runpp(
            net, algorithm="bfsw", calculate_voltage_angles=False,
            max_iteration=80, tolerance_mva=1e-8, init="flat", numba=False
        )
    except LoadflowNotConverged:
        converged = False

    if converged:
        vm_min_raw = float(net.res_bus.vm_pu.min())
        vm_max_raw = float(net.res_bus.vm_pu.max())
    else:
        # 간이 LinDistFlow 폴백
        S_base = float(net.sn_mva)  # MVA
        V_base = float(nj.get("base_kv", 0.4))  # kV
        Z_base = (V_base * V_base) / max(1e-9, S_base)
        per_bus_pu = (per_kw / 1000.0) / max(1e-9, S_base)

        from collections import defaultdict, deque
        children = defaultdict(list)
        Rpu = {}
        for ln in nj["lines"]:
            f = int(str(ln["from"]).split("_")[1]); t = int(str(ln["to"]).split("_")[1])
            r_ohm = float(ln["r_ohm"])
            length = float(ln.get("length_km", 0.05))
            Rpu[(f, t)] = (r_ohm * length) / max(1e-9, Z_base)
            children[f].append(t)

        n = len(nj["buses"])
        subtree = [0] * n
        for i in range(n - 1, -1, -1):
            base = 0 if i == 0 else 1
            total = base + sum(subtree[ch] for ch in children.get(i, []))
            subtree[i] = total

        V = [1.0] * n
        q = deque([0])
        while q:
            u = q.popleft()
            for v in children.get(u, []):
                V[v] = V[u] - Rpu[(u, v)] * (subtree[v] * per_bus_pu)
                q.append(v)

        vm_min_raw = max(0.0, min(V))
        vm_max_raw = max(V)

    # 공통 KPI 계산 및 반환
    vm_min = round(vm_min_raw, 3)
    v_viol = int(vm_min_raw < LIMIT_LOW or vm_max_raw > LIMIT_HIGH)

    if hasattr(net, "res_load") and len(getattr(net, "res_load", [])):
        total_kw = float(net.res_load.p_mw.sum()) * 1000.0
    else:
        total_kw = float(net.load.p_mw.sum()) * 1000.0

    tx_kva = float(nj.get("transformer_kva", 500.0)) or 500.0
    tx_loading = total_kw / tx_kva

    return {
        "feeder_id": feeder_id,
        "hour": int(hour),
        "transformer_loading": round(tx_loading, 3),
        "min_voltage_pu": vm_min,
        "min_voltage_pu_raw": vm_min_raw,
        "max_voltage_pu_raw": vm_max_raw,
        "voltage_violation": v_viol,
    }

def pv_sweep(feeder_id: str, hours: List[int]) -> Dict[str, Any]:
    """
    PV 보급률을 0.0~1.0에서 스텝으로 스윕하고, 선택한 시간대들의 위반 합계를 계산.
    hosting_capacity는 violations == 0을 만족하는 최대 pv 보급률.
    """
    points: List[Dict[str, float]] = []
    pv_steps = [i / 20 for i in range(0, 21)]  # 0.00, 0.05, ..., 1.00

    for p in pv_steps:
        viol = 0
        for h in hours:
            r = simulate(feeder_id, p, 0.0, int(h))
            viol += int(r["voltage_violation"])
        points.append({"pv": p, "violations": float(viol)})

    host_candidates = [pt["pv"] for pt in points if pt["violations"] == 0.0]
    hosting_capacity = max(host_candidates) if host_candidates else 0.0

    return {"feeder_id": feeder_id, "hours": hours, "points": points, "hosting_capacity": hosting_capacity}
