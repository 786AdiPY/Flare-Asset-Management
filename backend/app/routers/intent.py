from __future__ import annotations

import asyncio

from fastapi import APIRouter

from ..models.schemas import IntentRequest, IntentResponse
from ..services import ai_guardrails, defillama, flare_ftso, openrouter, rule_engine
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

    async def _fetch_price(sym: str):
        return await safe_call(
            lambda: flare_ftso.get_feed(sym),
            lambda: flare_ftso.simulate_feed(sym),
            label=f"ftso.{sym}",
        )

    yields_result, price_safe_results = await asyncio.gather(
        safe_call(
            lambda: defillama.get_relevant_yield_opportunities(keywords),
            lambda: defillama.simulate_yield_opportunities(keywords),
            label="defillama.yields",
        ),
        asyncio.gather(*(_fetch_price(sym) for sym in _PRICE_SYMBOLS)),
    )

    any_price_simulated = any(r.simulated for r in price_safe_results)
    price_results = [
        {**r.data, "simulated": r.simulated, "simulationReason": r.reason} for r in price_safe_results
    ]

    context = {"topYields": yields_result.data, "prices": price_results}

    history = [t.model_dump() for t in req.history]

    rec_result = await safe_call(
        lambda: openrouter.call_openrouter(req.intent, context, history),
        lambda: rule_engine.simulate_recommendation(req.intent, context),
        label="openrouter.recommendation",
    )

    raw_recs = rec_result.data["recommendations"]
    guardrailed_recs = ai_guardrails.validate_and_guardrail_recommendations(raw_recs, context)

    overall_simulated = rec_result.simulated
    reason = rec_result.reason

    return IntentResponse(
        recommendations=guardrailed_recs,
        context={"prices": price_results, "topYields": yields_result.data},
        simulated=overall_simulated,
        simulationReason=reason,
    )
