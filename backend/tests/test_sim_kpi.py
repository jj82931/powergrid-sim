from app.models.network_gen import make_feeder
from app.sim import build_pp_net

def test_build_pp_net():
    net = build_pp_net(make_feeder(1))
    assert len(net.bus) >= 2