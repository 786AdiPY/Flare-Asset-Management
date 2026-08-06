from __future__ import annotations

import logging

from ..config import get_settings

logger = logging.getLogger("ai_asset_router.supabase")

# In-memory fallback so the API works end to end without a real Supabase
# project configured — matches the rest of the app's "always demoable" design.
_memory_portfolios: dict[str, list[dict]] = {}


def _get_client():
    settings = get_settings()
    if not (settings.supabase_url and settings.supabase_key):
        return None
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_key)


async def save_portfolio(wallet_address: str, holdings: list[dict]) -> dict:
    client = _get_client()
    if client is not None:
        try:
            client.table("portfolios").upsert(
                {"wallet_address": wallet_address, "holdings": holdings}
            ).execute()
            return {"walletAddress": wallet_address, "holdings": holdings, "store": "supabase"}
        except Exception as exc:  # noqa: BLE001
            logger.warning("Supabase upsert failed, using in-memory store: %s", exc)

    _memory_portfolios[wallet_address] = holdings
    return {"walletAddress": wallet_address, "holdings": holdings, "store": "in-memory"}


async def get_portfolio(wallet_address: str) -> dict:
    client = _get_client()
    if client is not None:
        try:
            resp = (
                client.table("portfolios")
                .select("*")
                .eq("wallet_address", wallet_address)
                .limit(1)
                .execute()
            )
            rows = resp.data or []
            if rows:
                return {
                    "walletAddress": wallet_address,
                    "holdings": rows[0]["holdings"],
                    "store": "supabase",
                }
        except Exception as exc:  # noqa: BLE001
            logger.warning("Supabase select failed, using in-memory store: %s", exc)

    return {
        "walletAddress": wallet_address,
        "holdings": _memory_portfolios.get(wallet_address, []),
        "store": "in-memory",
    }
