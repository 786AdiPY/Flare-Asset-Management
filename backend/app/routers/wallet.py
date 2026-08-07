from __future__ import annotations

from fastapi import APIRouter

from ..models.schemas import WalletBalanceResponse
from ..services import flare_wallet
from ..services.simulation import safe_call

router = APIRouter()


@router.get("/wallet/{address}/balance", response_model=WalletBalanceResponse)
async def get_wallet_balance(address: str) -> WalletBalanceResponse:
    r = await safe_call(
        lambda: flare_wallet.get_native_balance(address),
        lambda: flare_wallet.simulate_native_balance(address),
        label=f"wallet.balance.{address}",
    )
    return WalletBalanceResponse(**r.data, simulated=r.simulated, simulationReason=r.reason)
