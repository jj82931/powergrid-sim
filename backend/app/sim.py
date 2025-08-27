# 최소한의 전력조류 계산
import pandapower as pp
from .data import load_network, load_profile

LIMIT_LOW = 0.94
LIMIT_HIGH = 1.06

def build_pp_net(net_json: dict) -> pp.pandapowerNet:
    net = pp.create_empty_network(sn_mva=0.5)
    # 트랜스와 버스, 라인 단순화 생성
    for b in net_json["buses"]:
        pp.create_bus(net, vn_kv=net_json["base_kv"], name=b["id"])
    # 슬랙 버스는 bus_0 가정
    pp.create_ext_grid(net, bus=0, vm_pu=1.0)
    for ln in net_json["lines"]:
        f = int(ln["from"].split("_")[1])
        t = int(ln["to"].split("_")[1])
        pp.create_line_from_parameters(net, f, t, length_km=0.05, r_ohm_per_km=ln["r_ohm"], x_ohm_per_km=ln["x_ohm"], c_nf_per_km=0.0, max_i_ka=0.4)
    return net

def simulate(feeder_id: str, pv_adopt: float, bat_adopt: float, hour: int) -> dict:
    nj = load_network(feeder_id)
    net = build_pp_net(nj)
    load_prof = load_profile("load")
    pv_prof = load_profile("pv")
    # 간단 부하 모델: 가구 수만큼 동일 부하 분배
    base_kw = load_prof[hour]
    pv_kw = pv_prof[hour] * pv_adopt
    n_loads = len(nj["buses"]) - 1
    for i in range(1, n_loads+1):
        pp.create_load(net, bus=i, p_mw=max(0.0, (base_kw - pv_kw) / n_loads) / 1000.0)
    pp.runpp(net, calculate_voltage_angles=False)
    vm_min = float(net.res_bus.vm_pu.min())
    vm_max = float(net.res_bus.vm_pu.max())
    v_viol = int(vm_min < LIMIT_LOW or vm_max > LIMIT_HIGH)
    # 변압기 부하율 근사: 총 부하 / 정격
    total_kw = float(sum(net.res_load.p_mw)) * 1000.0
    tx_loading = total_kw / 500.0
    return {
        "feeder_id": feeder_id,
        "hour": hour,
        "transformer_loading": round(tx_loading, 3),
        "min_voltage_pu": round(vm_min, 3),
        "voltage_violation": v_viol,
    }

def pv_sweep(feeder_id: str, hours: list[int]):
    points = []
    for p in [i/20 for i in range(0, 21)]:  # 0.0~1.0
        viol = 0
        for h in hours:
            r = simulate(feeder_id, p, 0.0, h)
            viol += r["voltage_violation"]
        points.append({"pv": p, "violations": viol})
    # 호스팅 용량: violations==0인 최대 p
    host = max([pt["pv"] for pt in points if pt["violations"] == 0] or [0.0])
    return {"points": points, "hosting_capacity": host}