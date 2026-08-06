from __future__ import annotations

import httpx

from ..config import get_settings

_QUOTE_URL = "https://li.quest/v1/quote"


async def get_bridge_quote(
    from_chain: str,
    to_chain: str,
    from_token: str,
    to_token: str,
    from_amount: str,
    from_address: str,
) -> dict:
    settings = get_settings()
    headers = {}
    if settings.lifi_api_key:
        headers["x-lifi-api-key"] = settings.lifi_api_key

    params = {
        "fromChain": from_chain,
        "toChain": to_chain,
        "fromToken": from_token,
        "toToken": to_token,
        "fromAmount": from_amount,
        "fromAddress": from_address,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(_QUOTE_URL, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    estimate = data.get("estimate") or {}
    fee_costs = estimate.get("feeCosts") or []
    gas_costs = estimate.get("gasCosts") or []

    return {
        "tool": data.get("tool", "unknown"),
        "estimatedToAmount": estimate.get("toAmount", "0"),
        "estimatedDurationSeconds": estimate.get("executionDuration"),
        "feeCostsUsd": sum(float(f.get("amountUSD") or 0) for f in fee_costs) or None,
        "gasCostsUsd": sum(float(f.get("amountUSD") or 0) for f in gas_costs) or None,
    }


def simulate_bridge_quote(
    from_chain: str,
    to_chain: str,
    from_token: str,
    to_token: str,
    from_amount: str,
    from_address: str,
) -> dict:
    try:
        amount = float(from_amount)
    except ValueError:
        amount = 0.0
    return {
        "tool": "simulated-bridge",
        "estimatedToAmount": str(int(amount * 0.997)) if amount else "0",
        "estimatedDurationSeconds": 180,
        "feeCostsUsd": round(amount * 0.0005, 4) if amount else 1.5,
        "gasCostsUsd": 0.8,
    }
