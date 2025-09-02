# 단순 합성 LV 네트워크 생성기 (feeder_11 = outlier)
from __future__ import annotations
import json, random
from pathlib import Path

RSEED = 42

def make_feeder(idx: int, n_nodes: int = 30) -> dict:
    random.seed(RSEED + idx)
    buses = [{"id": f"bus_{i}", "x": i % 10, "y": i // 10} for i in range(n_nodes)]
    lines = []

    if idx == 11:
        buses = [{"id": f"bus_{i}", "x": i, "y": 0} for i in range(n_nodes)]
        lines = []
        for i in range(1, n_nodes):
            lines.append({
                "from": f"bus_{i-1}",
                "to": f"bus_{i}",
                "r_ohm": 0.30,
                "x_ohm": 0.10,
                "length_km": 0.10
            })
        return {
            "feeder_id": f"feeder_{idx:02d}",
            "transformer_kva": 500,
            "buses": buses,
            "lines": lines,
            "base_kv": 0.4,
            "load_scale": 20.0  # ← 10에서 20 정도로
        }
    else:
        for i in range(1, n_nodes):
            parent = max(0, i - random.randint(1, 3))
            lines.append({"from": f"bus_{parent}", "to": f"bus_{i}", "r_ohm": 0.2, "x_ohm": 0.08})
        return {
            "feeder_id": f"feeder_{idx:02d}",
            "transformer_kva": 500,
            "buses": buses,
            "lines": lines,
            "base_kv": 0.4,
        }

def write_feeders(out_dir: Path, count: int = 12) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for i in range(count):
        data = make_feeder(i)
        (out_dir / f"{data['feeder_id']}.json").write_text(json.dumps(data, indent=2))

if __name__ == "__main__":
    write_feeders(Path("data/networks"))
