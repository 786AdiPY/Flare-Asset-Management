"""
/api/fassets — returns live FTestXRP FAssets parameters from Coston2 AssetManager
plus the current XRP/USD price from FTSOv2 for UI display.
"""

from __future__ import annotations

from fastapi import APIRouter

from ..models.schemas import FAssetsInfo
from ..services import fassets
from ..services.simulation import safe_call

router = APIRouter()


@router.get("/fassets/ftestxrp", response_model=FAssetsInfo)
async def get_ftestxrp_info() -> FAssetsInfo:
    """
    Returns live FTestXRP Asset Manager parameters from Coston2:
    - Lot size in XRP (minimum minting amount)
    - Collateral reservation fee BIPS
    - fAsset ERC-20 token address
    - Asset Manager contract address
    Falls back to safe simulated values on RPC failure.
    """
    result = await safe_call(
        lambda: fassets.get_ftestxrp_params(),
        lambda: fassets.simulate_ftestxrp_params(),
        label="fassets.ftestxrp",
    )
    data = result.data
    data["simulated"] = result.simulated
    data["simulationReason"] = result.reason
    return FAssetsInfo(**data)
