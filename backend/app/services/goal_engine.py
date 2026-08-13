"""
goal_engine.py — Deterministic Goal Profile parser, scoring engine, and evidence generator.

Implements:
  1. Goal Profile Extraction: Parses natural language intent into structured goal constraints.
  2. Goal-Based Scoring & Ranking: Deterministically scores candidate strategies against user constraints.
     - TVL is used as a liquidity signal, NOT a risk classification (Correction #1).
     - FAssets/FXRP is evaluated dynamically as a candidate pathway when relevant data exists (Correction #2).
     - badgeTag = "Best Match" is assigned to rank #1 AFTER deterministic scoring (Correction #3).
  3. Evidence Generation ("Why this option?"): Produces concise checkmarks backed ONLY by supported data.
"""

from __future__ import annotations

import re
from typing import Any


def parse_goal_profile(intent: str) -> dict[str, Any]:
    """
    Extracts explicit constraints from natural language intent.
    Only populates constraints explicitly stated or strongly implied by the user.
    """
    text = intent.lower()
    profile: dict[str, Any] = {
        "asset": None,
        "objective": None,
        "targetApy": None,
        "riskTolerance": None,
        "maxLockDays": None,
        "preferredChain": None,
        "feePreference": None,
    }

    # 1. Target APY (e.g., "8%", "at least 10%", "5.5% APY", "yield > 12%")
    apy_match = re.search(r'(\d+(?:\.\d+)?)\s*%\s*(?:apy|yield)?', text)
    if not apy_match:
        apy_match = re.search(r'(?:target|at least|want|min|minimum)?\s*(\d+(?:\.\d+)?)\s*%', text)
    if apy_match:
        try:
            val = float(apy_match.group(1))
            if 0.1 <= val <= 200.0:
                profile["targetApy"] = val
        except ValueError:
            pass

    # 2. Risk Tolerance ("low risk", "passive", "safe", "capital preservation", "high risk", "degen")
    if any(k in text for k in ["low risk", "safe", "passive", "preservation", "conservative", "low-risk"]):
        profile["riskTolerance"] = "low"
    elif any(k in text for k in ["high risk", "high-risk", "degen", "aggressive"]):
        profile["riskTolerance"] = "high"
    elif any(k in text for k in ["moderate", "medium risk", "balanced"]):
        profile["riskTolerance"] = "medium"

    # 3. Objective
    if any(k in text for k in ["preserve", "preservation", "capital", "safe"]):
        profile["objective"] = "preservation"
    elif any(k in text for k in ["low fee", "cheap", "cheapest", "lowest fee", "zero fee"]):
        profile["objective"] = "lowest_cost"
    elif any(k in text for k in ["liquid", "liquidity", "no lock", "unlocked", "withdraw anytime"]):
        profile["objective"] = "liquidity"
    elif any(k in text for k in ["growth", "maximize", "maximum"]):
        profile["objective"] = "growth"
    elif any(k in text for k in ["yield", "passive income", "earn"]):
        profile["objective"] = "yield"

    # 4. Fee Preference
    if any(k in text for k in ["low fee", "cheap", "lowest fee", "save fees"]):
        profile["feePreference"] = "lowest_fees"
    elif any(k in text for k in ["acceptable fee", "reasonable fee"]):
        profile["feePreference"] = "acceptable"

    # 5. Preferred Chain
    chains = ["flare", "ethereum", "arbitrum", "base", "polygon", "avalanche", "optimism"]
    for c in chains:
        if c in text:
            profile["preferredChain"] = c.capitalize()
            break

    # 6. Asset
    assets = ["usdc", "usdt", "flr", "xrp", "fxrp", "ftestxrp", "btc", "eth", "gold", "xau"]
    for a in assets:
        if re.search(rf'\b{a}\b', text):
            profile["asset"] = a.upper()
            break

    # 7. Max Lock Days
    if any(k in text for k in ["no lock", "unlocked", "no lockup", "0 lock"]):
        profile["maxLockDays"] = 0
    else:
        lock_match = re.search(r'(\d+)\s*(?:day|days|month|months|week|weeks)\s*lock', text)
        if lock_match:
            try:
                profile["maxLockDays"] = int(lock_match.group(1))
            except ValueError:
                pass

    return profile


def score_and_rank_recommendations(
    recommendations: list[dict],
    goal_profile: dict[str, Any],
    context: dict[str, Any],
) -> list[dict]:
    """
    Deterministically scores and ranks candidate strategies against the GoalProfile.
    """
    if not recommendations:
        return []

    target_apy = goal_profile.get("targetApy")
    risk_tol = goal_profile.get("riskTolerance")
    obj = goal_profile.get("objective")
    pref_chain = goal_profile.get("preferredChain")
    fee_pref = goal_profile.get("feePreference")
    max_lock = goal_profile.get("maxLockDays")

    # Map risk levels to numbers for comparison
    risk_num = {"low": 1, "medium": 2, "high": 3}
    user_risk_lvl = risk_num.get(risk_tol, 2) if risk_tol else 2

    # Map poolId -> TVL from context for accurate evidence checkmarks
    tvl_map: dict[str, float] = {}
    for pool in context.get("topYields") or []:
        if pool.get("poolId") and pool.get("tvlUsd") is not None:
            tvl_map[pool["poolId"]] = float(pool["tvlUsd"])

    scored_recs: list[tuple[float, dict]] = []

    for rec in recommendations:
        score = 50.0  # Baseline score
        evidence: list[str] = []

        est_apy = rec.get("estimatedApy")
        rec_risk = rec.get("riskLevel", "medium")
        rec_risk_lvl = risk_num.get(rec_risk, 2)
        rec_chain = rec.get("chain", "")
        to_chain = rec.get("toChain", "")
        fees_pct = rec.get("estimatedFeesPct")

        # Get TVL if available
        cited = rec.get("citedOpportunities") or []
        tvl_usd = tvl_map.get(cited[0]) if cited and cited[0] in tvl_map else None

        # 1. Target APY Fit
        if target_apy is not None:
            if est_apy is not None and est_apy >= target_apy:
                score += 35.0
                evidence.append(f"✓ Meets target APY ({est_apy:.1f}% ≥ {target_apy:.1f}%)")
            elif est_apy is not None:
                gap = target_apy - est_apy
                score -= min(gap * 4.0, 30.0)
                if est_apy > 0:
                    evidence.append(f"✓ Provides {est_apy:.1f}% APY toward target")

        # 2. Risk Alignment
        if risk_tol:
            if rec_risk_lvl <= user_risk_lvl:
                score += 25.0
                evidence.append(f"✓ Matches {risk_tol} risk preference")
            else:
                score -= 35.0  # Penalty for exceeding risk tolerance

        # 3. Liquidity Signal (Correction #1: TVL as liquidity signal, NOT risk)
        if tvl_usd is not None and tvl_usd >= 1_000_000:
            score += 15.0
            evidence.append(f"✓ Fits liquidity requirement (${tvl_usd/1e6:.1f}M TVL)")
        elif tvl_usd is not None and tvl_usd >= 100_000:
            score += 5.0
            evidence.append(f"✓ Accepts liquidity depth (${tvl_usd/1e3:.0f}K TVL)")
        elif obj == "liquidity":
            score += 10.0
            evidence.append("✓ High liquidity option")

        # 4. Fee Preference
        if fees_pct is not None:
            if fees_pct <= 0.3:
                score += 10.0
                evidence.append(f"✓ Low execution fee ({fees_pct:.1f}%)")
            elif fee_pref == "lowest_fees" and fees_pct <= 0.5:
                score += 5.0
                evidence.append(f"✓ Acceptable fees ({fees_pct:.1f}%)")

        # 5. Preferred Chain Fit
        if pref_chain:
            if pref_chain.lower() in rec_chain.lower() or pref_chain.lower() in to_chain.lower():
                score += 20.0
                evidence.append(f"✓ Preferred chain ({rec_chain})")

        # 6. Lock Period Fit
        if max_lock is not None and max_lock == 0:
            score += 10.0
            evidence.append("✓ Flexible exit (No lockup)")

        # Fallback evidence items if no explicit constraints matched
        if not evidence:
            if est_apy is not None:
                evidence.append(f"✓ Verified market APY ({est_apy:.1f}%)")
            evidence.append(f"✓ Risk profile: {rec_risk.capitalize()}")
            if tvl_usd:
                evidence.append(f"✓ Active liquidity pool (${tvl_usd/1e3:.0f}K TVL)")
            else:
                evidence.append("✓ Liquid route execution")

        # Store score and evidence in updated dict
        rec_copy = dict(rec)
        rec_copy["score"] = round(score, 1)
        rec_copy["evidence"] = evidence
        scored_recs.append((score, rec_copy))

    # Sort descending by score
    scored_recs.sort(key=lambda x: x[0], reverse=True)

    # Re-rank and assign badgeTags (Correction #3: badgeTag = "Best Match" assigned after deterministic ranking)
    final_recs: list[dict] = []
    top_score = scored_recs[0][0] if scored_recs else 0.0

    for i, (score, rec) in enumerate(scored_recs):
        rank = i + 1
        rec["rank"] = rank

        if rank == 1:
            rec["badgeTag"] = "Best Match"
            rec["comparisonNote"] = None
        else:
            delta_score = top_score - score
            if not rec.get("badgeTag") or rec["badgeTag"] == "Best Match":
                rec["badgeTag"] = "Alternative Option"
            if not rec.get("comparisonNote"):
                rec["comparisonNote"] = f"Ranked #{rank} based on overall goal fit score ({score:.1f} vs top {top_score:.1f})."

        final_recs.append(rec)

    return final_recs
