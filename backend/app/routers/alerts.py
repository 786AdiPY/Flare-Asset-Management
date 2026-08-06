from __future__ import annotations

from fastapi import APIRouter, Query

from ..models.schemas import AlertsResponse
from ..services import defillama, openrouter, rule_engine
from ..services.simulation import safe_call

router = APIRouter()

# TODO: replace with a real position lookup (Supabase `portfolios` table, keyed
# by `wallet`) once a wallet has actually saved holdings via POST /api/portfolio.
_DEMO_PORTFOLIO = [
    {"symbol": "USDC", "chain": "Ethereum", "amount": 10000, "currentApy": 3.2, "currentProtocol": "Aave"},
    {"symbol": "FLR", "chain": "Flare", "amount": 50000, "currentApy": 4.5, "currentProtocol": "Kinetic"},
]


@router.get("/alerts", response_model=AlertsResponse)
async def get_alerts(wallet: str | None = Query(default=None)) -> AlertsResponse:
    portfolio = _DEMO_PORTFOLIO

    alerts: list[dict] = []
    any_simulated = False
    reason: str | None = None

    for position in portfolio:
        yields_result = await safe_call(
            lambda position=position: defillama.get_relevant_yield_opportunities(
                [position["symbol"]], min_tvl_usd=250_000, limit=3
            ),
            lambda position=position: defillama.simulate_yield_opportunities([position["symbol"]]),
            label=f"defillama.alerts.{position['symbol']}",
        )
        any_simulated = any_simulated or yields_result.simulated
        reason = reason or yields_result.reason

        best = max(yields_result.data, key=lambda o: o.get("apy") or 0, default=None)
        if not best or (best.get("apy") or 0) <= position["currentApy"] * 1.15:
            continue  # not a big enough improvement to bother the user with

        explain_result = await safe_call(
            lambda position=position, best=best: openrouter.explain_alert(position, best),
            lambda position=position, best=best: rule_engine.simulate_alert_explanation(position, best),
            label=f"openrouter.alert.{position['symbol']}",
        )
        any_simulated = any_simulated or explain_result.simulated
        reason = reason or explain_result.reason

        delta = (best["apy"] or 0) - position["currentApy"]
        alerts.append(
            {
                "id": f"{position['symbol']}-{best['poolId']}",
                "title": f"Better yield available for your {position['symbol']}",
                "currentApy": position["currentApy"],
                "betterApy": best["apy"],
                "apyDeltaPct": round(delta, 2),
                "protocol": best["project"],
                "chain": best["chain"],
                "explanation": explain_result.data,
                "severity": "high" if delta > 3 else "notable",
            }
        )

    return AlertsResponse(alerts=alerts, simulated=any_simulated, simulationReason=reason)
