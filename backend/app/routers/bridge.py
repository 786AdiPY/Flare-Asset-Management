from __future__ import annotations

from fastapi import APIRouter

from ..models.schemas import BridgeQuoteRequest, BridgeQuoteResponse
from ..services import lifi
from ..services.simulation import safe_call

router = APIRouter()


@router.post("/bridge-quote", response_model=BridgeQuoteResponse)
async def post_bridge_quote(req: BridgeQuoteRequest) -> BridgeQuoteResponse:
    r = await safe_call(
        lambda: lifi.get_bridge_quote(
            req.fromChain, req.toChain, req.fromToken, req.toToken, req.fromAmount, req.fromAddress
        ),
        lambda: lifi.simulate_bridge_quote(
            req.fromChain, req.toChain, req.fromToken, req.toToken, req.fromAmount, req.fromAddress
        ),
        label="lifi.quote",
    )
    return BridgeQuoteResponse(**r.data, simulated=r.simulated, simulationReason=r.reason)
