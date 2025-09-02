from fastapi.testclient import TestClient
from app.main import app
from app.cache import cache_get

client = TestClient(app)

def test_simulate_sets_cache_key():
    fid = client.get("/feeders").json()["feeders"][0]
    body = {"feeder_id": fid, "pv_adoption": 0.0, "battery_adoption": 0.0, "hour": 12}
    client.post("/simulate", json=body)
    key = f"sim:{fid}:0.0:0.0:12"
    assert cache_get(key) is not None
