from app.rules import advice

def test_advice_text():
    msg = advice(1.1, 0.95, 0)
    assert isinstance(msg, str) and len(msg) > 5