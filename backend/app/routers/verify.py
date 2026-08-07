from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.schemas import VerifyJob, VerifyRequest
from ..services import flare_fdc

router = APIRouter()


@router.post("/verify", response_model=VerifyJob)
async def post_verify(req: VerifyRequest) -> VerifyJob:
    job = flare_fdc.create_job(req.sourceChain, req.txHash)
    return VerifyJob(**job)


@router.get("/verify/{job_id}", response_model=VerifyJob)
async def get_verify(job_id: str) -> VerifyJob:
    try:
        job = flare_fdc.get_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="attestation job not found") from exc
    return VerifyJob(**job)
