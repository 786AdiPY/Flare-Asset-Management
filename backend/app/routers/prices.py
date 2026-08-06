from __future__ import annotations

from fastapi import APIRouter, Query

from ..services import coingecko, flare_ftso
from ..services.simulation import safe_call

router = APIRouter()


@router.get("/prices")
async def get_prices(symbols: str = Query(default="FLR/USD,BTC/USD,ETH/USD")) -> dict:
    feed_symbols = [s.strip() for s in symbols.split(",") if s.strip()]
    results = []
    for sym in feed_symbols:
        r = await safe_call(
            lambda sym=sym: flare_ftso.get_feed(sym),
            lambda sym=sym: flare_ftso.simulate_feed(sym),
            label=f"ftso.{sym}",
        )
        results.append({**r.data, "simulated": r.simulated, "simulationReason": r.reason})
    return {"feeds": results}


@router.get("/prices/spot")
async def get_spot_prices(symbols: str = Query(default="XAU,BTC,ETH")) -> dict:
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    r = await safe_call(
        lambda: coingecko.get_prices(syms),
        lambda: coingecko.simulate_prices(syms),
        label="coingecko.spot",
    )
    return {"prices": r.data, "simulated": r.simulated, "simulationReason": r.reason}
