from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_feeders_endpoint():
    r = client.get("/feeders")
    assert r.status_code == 200
    js = r.json()
    assert "feeders" in js
    assert isinstance(js["feeders"], list)
