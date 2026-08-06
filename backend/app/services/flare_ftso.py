from __future__ import annotations

import time

import anyio
from web3 import Web3

from ..config import get_settings

# FlareContractRegistry — same address on Flare mainnet, Songbird, Coston, and
# Coston2. https://dev.flare.network/network/guides/flare-for-javascript-developers
REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019"

REGISTRY_ABI = [
    {
        "inputs": [{"internalType": "string", "name": "_name", "type": "string"}],
        "name": "getContractAddressByName",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    }
]

# getFeedById returns (value, decimals, timestamp); confirmed against
# https://dev.flare.network/ftso/getting-started. Marked payable because
# FTSOv2 feed reads can carry a small protocol fee depending on network
# config — calling with value=0 works when no fee is currently enforced;
# if a fee IS required this call reverts and we transparently fall back to
# simulated data via `safe_call` rather than trying to manage msg.value here.
FTSO_V2_ABI = [
    {
        "inputs": [{"internalType": "bytes21", "name": "_feedId", "type": "bytes21"}],
        "name": "getFeedById",
        "outputs": [
            {"internalType": "uint256", "name": "_value", "type": "uint256"},
            {"internalType": "int8", "name": "_decimals", "type": "int8"},
            {"internalType": "uint64", "name": "_timestamp", "type": "uint64"},
        ],
        "stateMutability": "payable",
        "type": "function",
    }
]

# Category 0x01 (Crypto) feed IDs: 1-byte category + ASCII symbol, right-padded
# with zeros to 21 bytes total, per https://dev.flare.network/ftso/getting-started
FEED_IDS = {
    "FLR/USD": "0x01464c522f55534400000000000000000000000000",
    "BTC/USD": "0x014254432f55534400000000000000000000000000",
    "ETH/USD": "0x014554482f55534400000000000000000000000000",
}

_BASELINE_VALUES = {
    "FLR/USD": 0.025,
    "BTC/USD": 65000.0,
    "ETH/USD": 3400.0,
}

_ftso_v2_address_cache: dict[str, str] = {}


def _get_web3() -> Web3:
    settings = get_settings()
    return Web3(Web3.HTTPProvider(settings.flare_rpc_url, request_kwargs={"timeout": 10}))


def _resolve_ftso_v2_address(w3: Web3) -> str:
    settings = get_settings()
    cached = _ftso_v2_address_cache.get(settings.flare_rpc_url)
    if cached:
        return cached
    registry = w3.eth.contract(address=Web3.to_checksum_address(REGISTRY_ADDRESS), abi=REGISTRY_ABI)
    address = registry.functions.getContractAddressByName("FtsoV2").call()
    _ftso_v2_address_cache[settings.flare_rpc_url] = address
    return address


def _get_feed_sync(symbol: str, feed_id: str) -> dict:
    w3 = _get_web3()
    ftso_v2_address = _resolve_ftso_v2_address(w3)
    ftso_v2 = w3.eth.contract(address=Web3.to_checksum_address(ftso_v2_address), abi=FTSO_V2_ABI)
    feed_id_bytes = Web3.to_bytes(hexstr=feed_id)
    value, decimals, timestamp = ftso_v2.functions.getFeedById(feed_id_bytes).call()
    scaled = value / (10**decimals) if decimals >= 0 else value * (10 ** abs(decimals))
    return {
        "symbol": symbol.upper(),
        "feedId": feed_id,
        "value": scaled,
        "decimals": decimals,
        "timestamp": timestamp,
    }


async def get_feed(symbol: str) -> dict:
    feed_id = FEED_IDS.get(symbol.upper())
    if not feed_id:
        raise ValueError(f"unknown feed symbol: {symbol}")
    # web3.py's HTTPProvider is synchronous; run it off the event loop.
    return await anyio.to_thread.run_sync(_get_feed_sync, symbol, feed_id)


def simulate_feed(symbol: str) -> dict:
    upper = symbol.upper()
    return {
        "symbol": upper,
        "feedId": FEED_IDS.get(upper, "unknown"),
        "value": _BASELINE_VALUES.get(upper, 1.0),
        "decimals": 5,
        "timestamp": int(time.time()),
    }
