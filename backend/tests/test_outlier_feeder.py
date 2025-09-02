from app.sim import simulate

def test_outlier_has_lower_voltage_than_normal():
    h = 74
    a = simulate('feeder_00', 0.0, 0.0, h)
    b = simulate('feeder_11', 0.0, 0.0, h)
    # 원시값으로 직접 비교
    assert b["min_voltage_pu_raw"] < a["min_voltage_pu_raw"]
    # 차이가 너무 미세하지 않지만 추가 체크하고 싶다면
    # assert (a["min_voltage_pu_raw"] - b["min_voltage_pu_raw"]) > 1e-4