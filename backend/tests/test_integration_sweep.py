from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pv_sweep_points_and_hc():
    fid = client.get("/feeders").json()["feeders"][0]
    r = client.post("/sweep", json={"feeder_id": fid, "hours": [28, 48, 74]})
    assert r.status_code == 200
    js = r.json()
    assert "points" in js and len(js["points"]) == 21
    assert isinstance(js["hosting_capacity"], (int, float))
    assert 0.0 <= js["hosting_capacity"] <= 1.0
