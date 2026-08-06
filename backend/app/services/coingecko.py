from __future__ import annotations

import httpx

from ..config import get_settings

# CoinGecko coin ids for the tickers this demo cares about (incl. tokenized gold: XAUT).
COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "FLR": "flare-networks",
    "XAU": "tether-gold",
    "GOLD": "tether-gold",
    "USDT": "tether",
    "USDC": "usd-coin",
}

_BASELINE_USD = {
    "BTC": 65000.0,
    "ETH": 3400.0,
    "FLR": 0.025,
    "XAU": 2400.0,
    "GOLD": 2400.0,
    "USDT": 1.0,
    "USDC": 1.0,
}


async def get_prices(symbols: list[str]) -> dict[str, float]:
    settings = get_settings()
    ids = [COINGECKO_IDS.get(s.upper()) for s in symbols]
    ids = sorted({i for i in ids if i})
    if not ids:
        raise ValueError("no known CoinGecko ids for requested symbols")

    headers = {}
    if settings.coingecko_api_key:
        headers["x-cg-demo-api-key"] = settings.coingecko_api_key

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": ",".join(ids), "vs_currencies": "usd"},
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()

    out: dict[str, float] = {}
    for sym in symbols:
        cg_id = COINGECKO_IDS.get(sym.upper())
        if cg_id and cg_id in data and "usd" in data[cg_id]:
            out[sym.upper()] = data[cg_id]["usd"]
    if not out:
        raise RuntimeError("CoinGecko returned no matching prices")
    return out


def simulate_prices(symbols: list[str]) -> dict[str, float]:
    return {s.upper(): _BASELINE_USD.get(s.upper(), 1.0) for s in symbols}
