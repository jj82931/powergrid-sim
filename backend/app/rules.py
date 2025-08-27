# 규칙 기반 간단 가이드
def advice(tx_loading: float, v_min: float, viol: int) -> str:
    tips: list[str] = []
    if tx_loading > 0.9:
        tips.append("High transformer loading. Consider feeder rebalancing or PV power factor adjustment.")
    if v_min < 0.94:
        tips.append("Undervoltage detected near endpoints. Consider capacitor placement or cable upgrade.")
    if viol == 0 and tx_loading < 0.7:
        tips.append("Spare capacity available. First-stage PV expansion is feasible.")
    return " | ".join(tips) or "No issues detected."