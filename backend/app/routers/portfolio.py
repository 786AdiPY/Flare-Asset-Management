from __future__ import annotations

from fastapi import APIRouter

from ..models.schemas import PortfolioRequest, PortfolioResponse
from ..services import supabase_client

router = APIRouter()


@router.post("/portfolio", response_model=PortfolioResponse)
async def post_portfolio(req: PortfolioRequest) -> PortfolioResponse:
    result = await supabase_client.save_portfolio(
        req.walletAddress, [h.model_dump() for h in req.holdings]
    )
    return PortfolioResponse(**result)


@router.get("/portfolio/{wallet_address}", response_model=PortfolioResponse)
async def get_portfolio(wallet_address: str) -> PortfolioResponse:
    result = await supabase_client.get_portfolio(wallet_address)
    return PortfolioResponse(**result)
