from __future__ import annotations

import hashlib
import time
import uuid

# The Flare Data Connector's real attestation flow is multi-phase and stateful:
#   1. Submit an attestation request tx during a ~90s collection window, including
#      a hash of the expected response (MIC).
#   2. Off-chain verifier servers validate the request against the source chain.
#   3. After the voting round finalizes, fetch the Merkle proof for the response
#      from the Data Availability Layer and submit/consume it on-chain.
# See https://dev.flare.network/fdc/overview and https://dev.flare.network/fdc/guides/fdc-by-hand
#
# Actually driving that flow needs a live source-chain tx, a funded attestation-
# request account, and polling across multiple external verifier services — out
# of scope for this scaffold. What's implemented below is a *phase-accurate*
# local simulation: it mirrors FDC's real timing (90s collection window, then a
# voting/finalization window) so the UI shows a believable pending -> verified
# progression, but no external verifier or DA Layer is ever actually contacted.
# `VerifyJob.simulated` is always True for that reason.

_COLLECTING_SECONDS = 90
_VOTING_SECONDS = 30

_jobs: dict[str, dict] = {}


def create_job(source_chain: str, tx_hash: str) -> dict:
    job_id = uuid.uuid4().hex
    job = {
        "id": job_id,
        "sourceChain": source_chain,
        "txHash": tx_hash,
        "createdAt": time.time(),
    }
    _jobs[job_id] = job
    return _compute_status(job)


def get_job(job_id: str) -> dict:
    job = _jobs.get(job_id)
    if job is None:
        raise KeyError(f"no such attestation job: {job_id}")
    return _compute_status(job)


def _compute_status(job: dict) -> dict:
    elapsed = time.time() - job["createdAt"]
    if elapsed < _COLLECTING_SECONDS:
        status = "collecting"
    elif elapsed < _COLLECTING_SECONDS + _VOTING_SECONDS:
        status = "voting"
    else:
        status = "finalized"

    result = {**job, "status": status, "merkleProof": None, "votingRoundId": None}
    if status == "finalized":
        digest = hashlib.sha256(f"{job['sourceChain']}:{job['txHash']}:{job['id']}".encode()).hexdigest()
        result["merkleProof"] = f"0x{digest}"
        result["votingRoundId"] = int(job["createdAt"]) // _COLLECTING_SECONDS
    return result
