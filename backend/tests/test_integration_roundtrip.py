from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_roundtrip_simulate():
    r = client.get("/feeders")
    assert r.status_code == 200
    feeders = r.json()["feeders"]
    assert len(feeders) >= 1
    fid = feeders[0]

    body = {"feeder_id": fid, "pv_adoption": 0.0, "battery_adoption": 0.0, "hour": 12}
    r2 = client.post("/simulate", json=body)
    assert r2.status_code == 200
    js = r2.json()
    for k in ["feeder_id","hour","transformer_loading","min_voltage_pu","voltage_violation"]:
        assert k in js
