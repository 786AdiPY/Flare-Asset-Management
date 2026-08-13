from .goal_engine import parse_goal_profile, score_and_rank_recommendations

_XRP_KEYWORDS = {"XRP", "FXRP", "FASSET", "FTESTXRP"}


def simulate_recommendation(intent: str, context: dict) -> dict:
    top_yields = (context.get("topYields") or [])[:3]
    upper_intent = intent.upper()
    is_xrp_intent = any(k in upper_intent for k in _XRP_KEYWORDS)
    goal_profile = parse_goal_profile(intent)

    recommendations: list[dict] = []

    if top_yields:
        for i, opp in enumerate(top_yields):
            rank = i + 1
            apy = opp.get("apy")
            symbol = opp.get("symbol", "USDC").split("-")[0]
            # Risk defaults based on protocol audit/type (TVL is used separately as a liquidity signal)
            proj = (opp.get("project") or "").lower()
            risk_level = "low" if "aave" in proj or "sparkdex" in proj else "medium"

            recommendations.append(
                {
                    "rank": rank,
                    "strategy": f"Supply {opp['symbol']} into {opp['project']} on {opp['chain']}",
                    "chain": opp["chain"],
                    "protocol": opp["project"],
                    "estimatedApy": apy,
                    "estimatedFeesPct": 0.3,
                    "riskLevel": risk_level,
                    "steps": [
                        f'Review intent: "{intent}"',
                        f"Bridge/swap {symbol} to {opp['chain']} via LI.FI",
                        f"Deposit into {opp['project']}",
                        "Monitor the position via Smart Opportunity Alerts",
                    ],
                    "explanation": (
                        "This is a simulated recommendation (no live OPENROUTER_API_KEY configured, "
                        "or the live call failed) evaluated deterministically against your Goal Profile."
                    ),
                    "citedOpportunities": [opp["poolId"]],
                    "comparisonNote": None,
                    "badgeTag": None,
                    "fromToken": symbol,
                    "toToken": symbol,
                    "fromChain": "Flare",
                    "toChain": opp["chain"] if opp["chain"] != "Flare" else "Flare",
                    "suggestedAmount": "100",
                }
            )

    # Candidate pathway for XRP / FXRP when intent involves XRP
    if is_xrp_intent:
        xrp_strategy = {
            "rank": 1,
            "strategy": "Mint FTestXRP (FAssets) → Explore Flare DeFi yield",
            "chain": "Flare",
            "protocol": "Flare FAssets",
            "estimatedApy": None,
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
            "badgeTag": None,
            "fromToken": "XRP",
            "toToken": "FTestXRP",
            "fromChain": "XRPL",
            "toChain": "Flare (Coston2)",
            "suggestedAmount": None,
        }
        recommendations.append(xrp_strategy)

    if not recommendations:
        return {
            "goalProfile": goal_profile,
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
                    "badgeTag": "Best Match",
                    "evidence": ["✓ Verified intent constraints"],
                    "fromToken": None,
                    "toToken": None,
                    "fromChain": None,
                    "toChain": None,
                    "suggestedAmount": None,
                }
            ]
        }

    # Run deterministic scoring, evidence checkmarks generation, and Best Match assignment
    ranked = score_and_rank_recommendations(recommendations, goal_profile, context)
    return {"goalProfile": goal_profile, "recommendations": ranked[:3]}


def simulate_alert_explanation(position: dict, opportunity: dict) -> str:
    delta = (opportunity.get("apy") or 0) - position["currentApy"]
    return (
        f"(Simulated explanation) Moving your {position['symbol']} from "
        f"{position['currentProtocol']} to {opportunity['project']} on {opportunity['chain']} "
        f"would raise your yield by roughly {delta:.1f} percentage points, based on the "
        "current DeFiLlama TVL/APY snapshot. Always weigh the bridging cost and the new "
        "protocol's audit history against the extra yield."
    )
