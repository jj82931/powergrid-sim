# 데이터 로더: 네트워크 JSON, 프로파일 CSV
from pathlib import Path
import json, csv

BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
DATA_DIR = BASE_DIR / "data"

def list_feeders():
    d = DATA_DIR / "networks"
    return sorted([p.stem for p in d.glob("*.json")])

def load_network(feeder_id: str) -> dict:
    p = DATA_DIR / "networks" / f"{feeder_id}.json"
    return json.loads(p.read_text())

def load_profile(kind: str) -> list[float]:
    # kind: "load" 또는 "pv"
    path = DATA_DIR / "profiles" / ("load_profile.csv" if kind=="load" else "pv_profile.csv")
    vals = []
    with path.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            vals.append(float(row["value_kw"]))
    return vals