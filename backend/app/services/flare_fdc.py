from __future__ import annotations

import hashlib
import time

# The Flare Data Connector's real attestation flow is multi-phase and stateful:
#   1. Submit an attestation request tx during a ~90s collection window, including
#      a hash of the expected response (MIC).
#   2. Off-chain verifier servers validate the request against the source chain.
#   3. After the voting round finalizes, fetch the Merkle proof for the response
#      from the Data Availability Layer and submit/consume it on-chain.
# See https://dev.flare.network/fdc/overview and https://dev.flare.network/fdc/guides/fdc-by-hand
#
# That flow needs a live source-chain tx, a funded attestation-request account, and
# polling across multiple external services — out of scope for this scaffold. This
# stub always raises so callers go through `safe_call` and land on the simulated
# attestation below, keeping the "cross-chain verification" step demoable end to end.


async def request_attestation(source_chain: str, tx_hash: str) -> dict:
    raise NotImplementedError(
        "Flare FDC live attestation is not implemented in this scaffold — "
        "see comments in flare_fdc.py for the real request/proof flow."
    )


def simulate_attestation(source_chain: str, tx_hash: str) -> dict:
    digest = hashlib.sha256(f"{source_chain}:{tx_hash}".encode()).hexdigest()
    return {
        "sourceChain": source_chain,
        "txHash": tx_hash,
        "verified": True,
        "merkleProof": f"0x{digest}",
        "votingRoundId": int(time.time()) // 90,
    }
