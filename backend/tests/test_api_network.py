from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_network_endpoint_roundtrip():
    r = client.get("/feeders")
    fids = r.json().get("feeders", [])
    assert fids, "no feeders found"
    fid = fids[0]
    r2 = client.get(f"/network/{fid}")
    js = r2.json()
    assert r2.status_code == 200
    assert "buses" in js and "lines" in js
