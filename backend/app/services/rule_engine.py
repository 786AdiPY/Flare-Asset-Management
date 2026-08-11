from __future__ import annotations

# Deterministic fallback used whenever the live OpenRouter call is unavailable or
# fails validation. Keeps the "AI recommendation" experience demoable with zero
# external dependencies — clearly labeled as simulated by the caller (`safe_call`).


def _risk_from_tvl(tvl_usd: float | None) -> str:
    if (tvl_usd or 0) >= 5_000_000:
        return "low"
    if (tvl_usd or 0) >= 1_000_000:
        return "medium"
    return "high"


_XRP_KEYWORDS = {"XRP", "FXRP", "FASSET", "FTESTXRP"}


def simulate_recommendation(intent: str, context: dict) -> dict:
    top_yields = (context.get("topYields") or [])[:3]
    upper_intent = intent.upper()
    is_xrp_intent = any(k in upper_intent for k in _XRP_KEYWORDS)

    # Build the standard yield-based recommendations first
    recommendations: list[dict] = []
    badge_tags = ["Highest Yield", "Lowest Risk", "Cheapest Route"]

    if top_yields:
        top_apy = top_yields[0].get("apy") or 0
        for i, opp in enumerate(top_yields):
            rank = i + 1
            apy = opp.get("apy")
            comparison_note = None
            if rank > 1:
                delta = top_apy - (apy or 0)
                comparison_note = f"Offers {delta:.1f} pts lower APY than the top pick, based on the current DeFiLlama snapshot."
            badge = badge_tags[i] if i < len(badge_tags) else f"Option #{rank}"
            symbol = opp.get("symbol", "USDC").split("-")[0]
            recommendations.append(
                {
                    "rank": rank,
                    "strategy": f"Supply {opp['symbol']} into {opp['project']} on {opp['chain']}",
                    "chain": opp["chain"],
                    "protocol": opp["project"],
                    "estimatedApy": apy,
                    "estimatedFeesPct": 0.3,
                    "riskLevel": _risk_from_tvl(opp.get("tvlUsd")),
                    "steps": [
                        f'Review intent: "{intent}"',
                        f"Bridge/swap {symbol} to {opp['chain']} via LI.FI",
                        f"Deposit into {opp['project']}",
                        "Monitor the position via Smart Opportunity Alerts",
                    ],
                    "explanation": (
                        "This is a simulated recommendation (no live OPENROUTER_API_KEY configured, "
                        "or the live call failed) generated from the current DeFiLlama snapshot for "
                        "your intent."
                    ),
                    "citedOpportunities": [opp["poolId"]],
                    "comparisonNote": comparison_note,
                    "badgeTag": badge,
                    "fromToken": symbol,
                    "toToken": symbol,
                    "fromChain": "Flare",
                    "toChain": opp["chain"] if opp["chain"] != "Flare" else "Flare",
                    "suggestedAmount": "100",
                }
            )

    # If intent involves XRP and no native XRP pathway was recommended, prepend
    # the FAssets mint-and-earn pathway as the first recommendation.
    if is_xrp_intent:
        xrp_strategy = {
            "rank": 1,
            "strategy": "Mint FTestXRP (FAssets) → Explore Flare DeFi yield",
            "chain": "Flare",
            "protocol": "Flare FAssets",
            "estimatedApy": None,   # No live APY — honest null, not fabricated
            "estimatedFeesPct": None,
            "riskLevel": "medium",
            "steps": [
                "Check the FAssets contextual card below for live Coston2 parameters (lot size, collateral ratio, fees)",
                "Mint FTestXRP on Coston2 by submitting XRP to the FAssets Core Vault with the correct memo/lot",
                "Receive FTestXRP (ERC-20) in your Flare wallet",
                "Supply FTestXRP to a Flare DeFi protocol (e.g. SparkDEX LP or Kinetic lending)",
                "Redeem FTestXRP → XRP at any time via the FAssets redemption flow",
            ],
            "explanation": (
                "FAssets let you bring native XRP onto Flare as FTestXRP (ERC-20) without selling. "
                "Live APY is not shown because DeFiLlama does not yet index FTestXRP pools — "
                "check SparkDEX and Kinetic directly for current rates on Coston2."
            ),
            "citedOpportunities": [],
            "comparisonNote": None,
            "badgeTag": "FAssets Pathway",
            "fromToken": "XRP",
            "toToken": "FTestXRP",
            "fromChain": "XRPL",
            "toChain": "Flare (Coston2)",
            "suggestedAmount": None,
        }
        # Prepend and re-rank
        recommendations = [xrp_strategy] + [
            {**r, "rank": r["rank"] + 1} for r in recommendations
        ]

    if not recommendations:
        return {
            "recommendations": [
                {
                    "rank": 1,
                    "strategy": "Hold and monitor — no qualifying opportunity found yet",
                    "chain": "Flare",
                    "protocol": "n/a",
                    "estimatedApy": None,
                    "estimatedFeesPct": None,
                    "riskLevel": "medium",
                    "steps": [f'Review intent: "{intent}"', "Check back once market data refreshes"],
                    "explanation": (
                        "This is a simulated recommendation (no live OPENROUTER_API_KEY configured, "
                        "or the live call failed), and no qualifying DeFiLlama pool was found for "
                        "this intent's keywords."
                    ),
                    "citedOpportunities": [],
                    "comparisonNote": None,
                    "badgeTag": None,
                    "fromToken": None,
                    "toToken": None,
                    "fromChain": None,
                    "toChain": None,
                    "suggestedAmount": None,
                }
            ]
        }

    return {"recommendations": recommendations[:3]}


def simulate_alert_explanation(position: dict, opportunity: dict) -> str:
    delta = (opportunity.get("apy") or 0) - position["currentApy"]
    return (
        f"(Simulated explanation) Moving your {position['symbol']} from "
        f"{position['currentProtocol']} to {opportunity['project']} on {opportunity['chain']} "
        f"would raise your yield by roughly {delta:.1f} percentage points, based on the "
        "current DeFiLlama TVL/APY snapshot. Always weigh the bridging cost and the new "
        "protocol's audit history against the extra yield."
    )
