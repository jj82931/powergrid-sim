from app.models.network_gen import make_feeder

def test_make_feeder_basic():
    f = make_feeder(0, 30)
    assert f["transformer_kva"] == 500
    assert len(f["buses"]) == 30
    assert len(f["lines"]) >= 29