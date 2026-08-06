from __future__ import annotations

# Deterministic fallback used whenever the live OpenRouter call is unavailable or
# fails validation. Keeps the "AI recommendation" experience demoable with zero
# external dependencies — clearly labeled as simulated by the caller (`safe_call`).


def simulate_recommendation(intent: str, context: dict) -> dict:
    top_yields = context.get("topYields") or []
    best = top_yields[0] if top_yields else None

    if best:
        strategy = f"Supply {best['symbol']} into {best['project']} on {best['chain']}"
        protocol = best["project"]
        chain = best["chain"]
        apy = best.get("apy")
        cited = [best["poolId"]]
    else:
        strategy = "Hold and monitor — no qualifying opportunity found yet"
        protocol = "n/a"
        chain = "Flare"
        apy = None
        cited = []

    return {
        "recommendation": {
            "strategy": strategy,
            "chain": chain,
            "protocol": protocol,
            "estimatedApy": apy,
            "estimatedFeesPct": 0.3,
            "riskLevel": "medium",
            "steps": [
                f'Review intent: "{intent}"',
                f"Bridge/allocate the relevant asset to {chain} if needed",
                f"Deposit into {protocol}",
                "Monitor the position via Smart Opportunity Alerts",
            ],
            "explanation": (
                "This is a simulated recommendation (no live OPENROUTER_API_KEY configured, "
                "or the live call failed) generated from the highest-APY qualifying pool in "
                "the current DeFiLlama snapshot for your intent."
            ),
            "citedOpportunities": cited,
        }
    }


def simulate_alert_explanation(position: dict, opportunity: dict) -> str:
    delta = (opportunity.get("apy") or 0) - position["currentApy"]
    return (
        f"(Simulated explanation) Moving your {position['symbol']} from "
        f"{position['currentProtocol']} to {opportunity['project']} on {opportunity['chain']} "
        f"would raise your yield by roughly {delta:.1f} percentage points, based on the "
        "current DeFiLlama TVL/APY snapshot. Always weigh the bridging cost and the new "
        "protocol's audit history against the extra yield."
    )
