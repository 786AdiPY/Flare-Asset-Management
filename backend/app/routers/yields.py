from __future__ import annotations

from fastapi import APIRouter, Query

from ..models.schemas import YieldHistoryResponse, YieldsResponse
from ..services import defillama
from ..services.simulation import safe_call

router = APIRouter()


@router.get("/yields", response_model=YieldsResponse)
async def get_yields(
    keywords: str = Query(default=""),
    chain: str | None = Query(default=None),
    limit: int = Query(default=20, le=50),
) -> YieldsResponse:
    kw = [k.strip() for k in keywords.split(",") if k.strip()]
    r = await safe_call(
        lambda: defillama.get_relevant_yield_opportunities(kw, chain=chain, limit=limit),
        lambda: defillama.simulate_yield_opportunities(kw),
        label="defillama.yields.explorer",
    )
    return YieldsResponse(opportunities=r.data, simulated=r.simulated, simulationReason=r.reason)


@router.get("/yields/{pool_id}/history", response_model=YieldHistoryResponse)
async def get_yield_history(pool_id: str, days: int = Query(default=30, le=90)) -> YieldHistoryResponse:
    r = await safe_call(
        lambda: defillama.get_pool_history(pool_id, days),
        lambda: defillama.simulate_pool_history(pool_id, days),
        label=f"defillama.history.{pool_id}",
    )
    return YieldHistoryResponse(poolId=pool_id, points=r.data, simulated=r.simulated, simulationReason=r.reason)
