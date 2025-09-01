from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_simulate_contains_advice():
    # 피더 하나 집어오기
    fids = client.get("/feeders").json().get("feeders", [])
    assert fids, "no feeders available"
    payload = {"feeder_id": fids[0], "pv_adoption": 0.3, "battery_adoption": 0.0, "hour": 12}
    r = client.post("/simulate", json=payload)
    assert r.status_code == 200
    js = r.json()
    assert "advice" in js and isinstance(js["advice"], str)
