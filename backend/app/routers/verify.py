from __future__ import annotations

from fastapi import APIRouter

from ..models.schemas import VerifyRequest, VerifyResponse
from ..services import flare_fdc
from ..services.simulation import safe_call

router = APIRouter()


@router.post("/verify", response_model=VerifyResponse)
async def post_verify(req: VerifyRequest) -> VerifyResponse:
    r = await safe_call(
        lambda: flare_fdc.request_attestation(req.sourceChain, req.txHash),
        lambda: flare_fdc.simulate_attestation(req.sourceChain, req.txHash),
        label="fdc.attestation",
    )
    return VerifyResponse(**r.data, simulated=r.simulated, simulationReason=r.reason)
