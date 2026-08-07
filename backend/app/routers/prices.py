from __future__ import annotations

import asyncio

from fastapi import APIRouter, Query

from ..services import coingecko, flare_ftso
from ..services.simulation import safe_call

router = APIRouter()


async def _fetch_feed(sym: str) -> dict:
    r = await safe_call(
        lambda: flare_ftso.get_feed(sym),
        lambda: flare_ftso.simulate_feed(sym),
        label=f"ftso.{sym}",
    )
    return {**r.data, "simulated": r.simulated, "simulationReason": r.reason}


@router.get("/prices")
async def get_prices(symbols: str = Query(default="FLR/USD,BTC/USD,ETH/USD")) -> dict:
    feed_symbols = [s.strip() for s in symbols.split(",") if s.strip()]
    results = await asyncio.gather(*(_fetch_feed(sym) for sym in feed_symbols))
    return {"feeds": list(results)}


@router.get("/prices/all")
async def get_all_prices() -> dict:
    """Every FTSOv2 feed this app knows about, for the Feeds page."""
    results = await asyncio.gather(*(_fetch_feed(sym) for sym in flare_ftso.FEED_IDS))
    return {"feeds": list(results)}


@router.get("/prices/spot")
async def get_spot_prices(symbols: str = Query(default="XAU,BTC,ETH")) -> dict:
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    r = await safe_call(
        lambda: coingecko.get_prices(syms),
        lambda: coingecko.simulate_prices(syms),
        label="coingecko.spot",
    )
    return {"prices": r.data, "simulated": r.simulated, "simulationReason": r.reason}
