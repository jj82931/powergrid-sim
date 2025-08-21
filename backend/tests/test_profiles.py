from app.data import load_profile

def test_profiles_length():
    load = load_profile("load")
    pv = load_profile("pv")
    assert len(load) >= 10  # 샘플은 짧아도 통과
    assert len(pv) >= 10