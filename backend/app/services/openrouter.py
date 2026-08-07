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

Respond with STRICT JSON only, no prose outside the JSON, matching this shape:
{
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
      "comparisonNote": null
    }
  ]
}

Return 2-3 recommendations ranked best-first (rank 1, 2, 3). For every recommendation
EXCEPT rank 1, set "comparisonNote" to a one-sentence explanation of specifically why
it ranked below the top pick (e.g. lower APY, higher risk, less liquidity) — rank 1
must have comparisonNote: null. Base every recommendation only on protocols/opportunities
present in the provided market context; do not invent one."""


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
    raw_recs = parsed["recommendations"]
    if not raw_recs:
        raise ValueError("OpenRouter returned zero recommendations")
    # Validate against the response schema here (inside the "live" call) so any
    # malformed LLM output raises and gets caught by `safe_call`, which then
    # falls back to the deterministic rule-engine recommendations.
    validated = [Recommendation.model_validate(r) for r in raw_recs[:3]]
    return {"recommendations": [r.model_dump() for r in validated]}


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
