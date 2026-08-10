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
    tx_req = data.get("transactionRequest")

    return {
        "tool": data.get("tool", "lifi-bridge"),
        "estimatedToAmount": estimate.get("toAmount", "0"),
        "estimatedDurationSeconds": estimate.get("executionDuration", 120),
        "feeCostsUsd": sum(float(f.get("amountUSD") or 0) for f in fee_costs) or 0.25,
        "gasCostsUsd": sum(float(f.get("amountUSD") or 0) for f in gas_costs) or 0.85,
        "slippagePct": 0.5,
        "approvalAddress": estimate.get("approvalAddress"),
        "transactionRequest": tx_req if isinstance(tx_req, dict) else None,
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
        amount = 100.0
    
    # Calculate estimated output minus a small 0.3% bridge/swap fee
    est_out = round(amount * 0.997, 4) if amount > 0 else 0.0

    return {
        "tool": "simulated-lifi-router",
        "estimatedToAmount": str(est_out),
        "estimatedDurationSeconds": 90,
        "feeCostsUsd": round(amount * 0.0005, 4) if amount else 0.50,
        "gasCostsUsd": 0.45,
        "slippagePct": 0.5,
        "approvalAddress": "0x1111111254fb6c44bac0bed2854e76f90643097d",
        "transactionRequest": {
            "to": "0x1234567890123456789012345678901234567890",
            "data": "0x095ea7b30000000000000000000000001234567890123456789012345678901234567890",
            "value": "0x0",
            "gasLimit": "150000",
            "chainId": 114,
        },
    }
