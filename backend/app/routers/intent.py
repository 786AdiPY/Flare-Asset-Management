from __future__ import annotations

from fastapi import APIRouter

from ..models.schemas import IntentRequest, IntentResponse
from ..services import defillama, flare_ftso, openrouter, rule_engine
from ..services.simulation import safe_call

router = APIRouter()

_PRICE_SYMBOLS = ["FLR/USD", "BTC/USD", "ETH/USD"]
_KNOWN_KEYWORDS = [
    "GOLD",
    "XAU",
    "SILVER",
    "USD",
    "USDT",
    "USDC",
    "FLR",
    "BTC",
    "ETH",
    "REAL ESTATE",
    "BOND",
    "TREASURY",
]


def _extract_keywords(intent: str) -> list[str]:
    text = intent.upper()
    found = [k for k in _KNOWN_KEYWORDS if k in text]
    return found or ["USD"]


@router.post("/intent", response_model=IntentResponse)
async def post_intent(req: IntentRequest) -> IntentResponse:
    keywords = [h.symbol for h in req.portfolio] or _extract_keywords(req.intent)

    yields_result = await safe_call(
        lambda: defillama.get_relevant_yield_opportunities(keywords),
        lambda: defillama.simulate_yield_opportunities(keywords),
        label="defillama.yields",
    )

    price_results = []
    any_price_simulated = False
    for sym in _PRICE_SYMBOLS:
        r = await safe_call(
            lambda sym=sym: flare_ftso.get_feed(sym),
            lambda sym=sym: flare_ftso.simulate_feed(sym),
            label=f"ftso.{sym}",
        )
        any_price_simulated = any_price_simulated or r.simulated
        price_results.append({**r.data, "simulated": r.simulated, "simulationReason": r.reason})

    context = {"topYields": yields_result.data, "prices": price_results}

    rec_result = await safe_call(
        lambda: openrouter.call_openrouter(req.intent, context),
        lambda: rule_engine.simulate_recommendation(req.intent, context),
        label="openrouter.recommendation",
    )

    overall_simulated = rec_result.simulated or yields_result.simulated or any_price_simulated
    reason = rec_result.reason or yields_result.reason

    return IntentResponse(
        recommendation=rec_result.data["recommendation"],
        context={"prices": price_results, "topYields": yields_result.data},
        simulated=overall_simulated,
        simulationReason=reason,
    )
