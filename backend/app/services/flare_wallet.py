from __future__ import annotations

import hashlib

import anyio
from web3 import Web3

from ..config import get_settings


def _get_native_balance_sync(address: str) -> float:
    settings = get_settings()
    w3 = Web3(Web3.HTTPProvider(settings.flare_rpc_url, request_kwargs={"timeout": 10}))
    checksum = Web3.to_checksum_address(address)
    wei = w3.eth.get_balance(checksum)
    return float(Web3.from_wei(wei, "ether"))


async def get_native_balance(address: str) -> dict:
    """Real on-chain native FLR balance for the connected wallet, read via
    eth_getBalance against FLARE_RPC_URL. ERC-20 token balances and other
    chains aren't covered here — that needs a token list + multicall (or a
    balances API) per chain, which this scaffold doesn't wire up yet."""
    balance = await anyio.to_thread.run_sync(_get_native_balance_sync, address)
    return {"address": address, "chain": "Flare", "symbol": "FLR", "balance": balance}


def simulate_native_balance(address: str) -> dict:
    # Deterministic per-address so repeated calls/demos look consistent.
    seed = int(hashlib.sha256(address.encode()).hexdigest()[:8], 16)
    balance = 100 + (seed % 900_00) / 100  # 100 - 9099.99
    return {"address": address, "chain": "Flare", "symbol": "FLR", "balance": round(balance, 2)}
