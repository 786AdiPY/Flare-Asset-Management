from __future__ import annotations

import json

import httpx

from ..config import get_settings
from ..models.schemas import Recommendation

_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

_SYSTEM_PROMPT = """You are the AI-Asset Router, an assistant that recommends on-chain \
strategies for tokenized real-world assets across multiple chains, given the user's \
natural-language financial intent and a snapshot of live market context (FTSO prices, \
DeFi yield opportunities). The user may follow up asking you to refine a prior answer \
(e.g. "make it lower risk") — treat earlier turns as context for the refinement.

1. Goal Profile Extraction:
Extract the user's explicit constraints into a "goalProfile" object:
- asset: ticker or token name if stated (e.g. "USDC", "FLR", "XRP") or null
- objective: "yield", "liquidity", "preservation", "growth", or "lowest_cost" if stated, or null
- targetApy: numeric percentage if explicitly stated (e.g. 8.0 for 8%), or null
- riskTolerance: "low", "medium", or "high" if stated, or null
- maxLockDays: integer days if lockup constraints mentioned (0 for unlocked), or null
- preferredChain: target chain name if stated (e.g. "Flare", "Ethereum"), or null
- feePreference: "lowest_fees" or "acceptable" if stated, or null
IMPORTANT: Only populate constraints explicitly stated or strongly implied by the user. Leave unspecified fields as null.

Flare Network FAssets context (use when relevant, never force it):
FAssets (e.g. FXRP, FTestXRP on Coston2 testnet) are trustless ERC-20 wrapped versions of \
non-smart-contract assets on Flare. FXRP/FTestXRP represent XRP 1:1 and are fully composable \
in Flare DeFi (lending, LPs, bridging). When a user asks what they can do with XRP on Flare, \
XRP → FAssets minting is ONE POSSIBLE pathway among others — recommend it only if it genuinely \
fits their intent. Never invent protocol yields, fees, or APY numbers.

Respond with STRICT JSON only, matching this shape:
{
  "goalProfile": {
    "asset": string|null,
    "objective": "yield"|"liquidity"|"preservation"|"growth"|"lowest_cost"|null,
    "targetApy": number|null,
    "riskTolerance": "low"|"medium"|"high"|null,
    "maxLockDays": number|null,
    "preferredChain": string|null,
    "feePreference": "lowest_fees"|"acceptable"|null
  },
  "recommendations": [
    {
      "rank": 1,
      "strategy": string,
      "chain": string,
      "protocol": string,
      "estimatedApy": number|null,
      "estimatedFeesPct": number|null,
      "riskLevel": "low"|"medium"|"high",
      "steps": string[],
      "explanation": string,
      "citedOpportunities": string[],
      "comparisonNote": null,
      "badgeTag": string|null,
      "fromToken": string|null,
      "toToken": string|null,
      "fromChain": string|null,
      "toChain": string|null,
      "suggestedAmount": string|null
    }
  ]
}

Return 2-3 candidate recommendations. Do not invent fake numerical data."""


def _headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_site_name,
        "Content-Type": "application/json",
    }


async def call_openrouter(intent: str, context: dict, history: list[dict] | None = None) -> dict:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    user_prompt = (
        f"User intent: {intent}\n\n"
        f"Market context (JSON): {json.dumps(context)[:6000]}\n\n"
        "Return only the JSON object described in the system prompt."
    )

    messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
    for turn in history or []:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": user_prompt})

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            _CHAT_URL,
            headers=_headers(),
            json={
                "model": settings.openrouter_model,
                "messages": messages,
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
            },
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    raw_recs = parsed.get("recommendations", [])
    if not raw_recs:
        raise ValueError("OpenRouter returned zero recommendations")

    # Extract goal profile or parse deterministically as fallback
    from .goal_engine import parse_goal_profile, score_and_rank_recommendations
    llm_goal = parsed.get("goalProfile") or {}
    fallback_goal = parse_goal_profile(intent)
    # Merge LLM goal with fallback (prefer explicit LLM extraction if non-null)
    goal_profile = {
        k: llm_goal.get(k) if llm_goal.get(k) is not None else fallback_goal.get(k)
        for k in fallback_goal
    }

    # Validate against Recommendation schema
    validated = [Recommendation.model_validate(r) for r in raw_recs[:3]]
    raw_dicts = [r.model_dump() for r in validated]

    # Run deterministic scoring, evidence generation, and Best Match assignment
    ranked = score_and_rank_recommendations(raw_dicts, goal_profile, context)
    return {"goalProfile": goal_profile, "recommendations": ranked}


async def explain_alert(position: dict, opportunity: dict) -> str:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    prompt = (
        f"A user holds {position['amount']} {position['symbol']} on {position['chain']} "
        f"earning {position['currentApy']}% APY via {position['currentProtocol']}. A better "
        f"opportunity was found: {opportunity['project']} on {opportunity['chain']} offering "
        f"{opportunity['apy']}% APY (TVL ${opportunity.get('tvlUsd')}). In 2-3 sentences, "
        "explain why this could be a good move and one risk to flag, in plain language for "
        "a non-expert investor."
    )

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            _CHAT_URL,
            headers=_headers(),
            json={
                "model": settings.openrouter_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.4,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    return data["choices"][0]["message"]["content"].strip()
