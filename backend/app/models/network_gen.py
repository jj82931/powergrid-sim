# 단순 합성 LV 네트워크 생성기
from __future__ import annotations
import json, random, math
from pathlib import Path

RSEED = 42

def make_feeder(idx: int, n_nodes: int = 30) -> dict:
    random.seed(RSEED + idx)
    # 버스 좌표 대략적 그리드
    buses = [{"id": f"bus_{i}", "x": i % 10, "y": i // 10} for i in range(n_nodes)]
    # 간선: 선형 트리 + 몇 개의 가지
    lines = []
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