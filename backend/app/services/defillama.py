from __future__ import annotations

import time

import httpx

_POOLS_URL = "https://yields.llama.fi/pools"
_CACHE_TTL_SECONDS = 300
_cache: dict = {"fetched_at": 0.0, "pools": []}


async def _fetch_all_pools() -> list[dict]:
    now = time.time()
    if _cache["pools"] and now - _cache["fetched_at"] < _CACHE_TTL_SECONDS:
        return _cache["pools"]
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(_POOLS_URL)
        resp.raise_for_status()
        data = resp.json()
    pools = data.get("data", [])
    _cache["pools"] = pools
    _cache["fetched_at"] = now
    return pools


def _to_opportunity(p: dict) -> dict:
    return {
        "project": p.get("project"),
        "chain": p.get("chain"),
        "symbol": p.get("symbol"),
        "apy": p.get("apy"),
        "apyBase": p.get("apyBase"),
        "apyReward": p.get("apyReward"),
        "tvlUsd": p.get("tvlUsd"),
        "poolId": p.get("pool"),
    }


async def get_relevant_yield_opportunities(
    keywords: list[str],
    chain: str | None = None,
    min_tvl_usd: float = 100_000,
    limit: int = 8,
) -> list[dict]:
    """
    Best-effort relevance filter: matches pools whose symbol contains any of the
    given keywords (asset tickers from the user's intent/portfolio), ranked by
    APY then TVL (liquidity/safety proxy).
    """
    pools = await _fetch_all_pools()
    upper_keywords = [k.upper() for k in keywords if k]

    def matches(p: dict) -> bool:
        if (p.get("tvlUsd") or 0) < min_tvl_usd:
            return False
        # DeFiLlama includes thinly-traded / reward-farming pools with wildly
        # inflated APYs — real numbers, but not something to recommend a user
        # move funds into (and not credible in a "passive income" pitch), so
        # treat anything above a believable range as noise.
        if (p.get("apy") or 0) > 60:
            return False
        if chain and (p.get("chain") or "").lower() != chain.lower():
            return False
        if not upper_keywords:
            return True
        symbol = (p.get("symbol") or "").upper()
        return any(k in symbol for k in upper_keywords)

    matched = [p for p in pools if matches(p)]
    matched.sort(key=lambda p: ((p.get("apy") or 0), (p.get("tvlUsd") or 0)), reverse=True)
    return [_to_opportunity(p) for p in matched[:limit]]


def simulate_yield_opportunities(keywords: list[str]) -> list[dict]:
    seed = (keywords[0] if keywords else "USD").upper()
    return [
        {
            "project": "SparkDEX",
            "chain": "Flare",
            "symbol": f"{seed}-FLR",
            "apy": 8.4,
            "apyBase": 5.1,
            "apyReward": 3.3,
            "tvlUsd": 2_400_000,
            "poolId": "simulated-sparkdex-1",
        },
        {
            "project": "Kinetic",
            "chain": "Flare",
            "symbol": seed,
            "apy": 6.1,
            "apyBase": 6.1,
            "apyReward": 0,
            "tvlUsd": 5_100_000,
            "poolId": "simulated-kinetic-1",
        },
        {
            "project": "Aave",
            "chain": "Ethereum",
            "symbol": seed,
            "apy": 3.8,
            "apyBase": 3.8,
            "apyReward": 0,
            "tvlUsd": 120_000_000,
            "poolId": "simulated-aave-1",
        },
    ]
