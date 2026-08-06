from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel


class AssetHolding(BaseModel):
    symbol: str
    chain: str
    amount: float
    isTokenized: bool = False
    # Where/how this holding currently earns yield, if anywhere — used by
    # Smart Opportunity Alerts to compute the delta against better options.
    # Unset means "idle" (0% baseline), so any qualifying opportunity alerts.
    currentApy: Optional[float] = None
    currentProtocol: Optional[str] = None


class IntentRequest(BaseModel):
    intent: str
    walletAddress: Optional[str] = None
    portfolio: list[AssetHolding] = []


class Recommendation(BaseModel):
    strategy: str
    chain: str
    protocol: str
    estimatedApy: Optional[float] = None
    estimatedFeesPct: Optional[float] = None
    riskLevel: Literal["low", "medium", "high"] = "medium"
    steps: list[str] = []
    explanation: str
    citedOpportunities: list[str] = []


class YieldOpportunity(BaseModel):
    project: str
    chain: str
    symbol: str
    apy: Optional[float] = None
    apyBase: Optional[float] = None
    apyReward: Optional[float] = None
    tvlUsd: Optional[float] = None
    poolId: str


class FeedValue(BaseModel):
    symbol: str
    feedId: str
    value: Optional[float] = None
    decimals: Optional[int] = None
    timestamp: Optional[int] = None
    simulated: bool = False
    simulationReason: Optional[str] = None


class IntentResponseContext(BaseModel):
    prices: list[FeedValue]
    topYields: list[YieldOpportunity]


class IntentResponse(BaseModel):
    recommendation: Recommendation
    context: IntentResponseContext
    simulated: bool
    simulationReason: Optional[str] = None


class BridgeQuoteRequest(BaseModel):
    fromChain: str
    toChain: str
    fromToken: str
    toToken: str
    fromAmount: str
    fromAddress: str


class BridgeQuoteResponse(BaseModel):
    tool: str
    estimatedToAmount: str
    estimatedDurationSeconds: Optional[int] = None
    feeCostsUsd: Optional[float] = None
    gasCostsUsd: Optional[float] = None
    simulated: bool
    simulationReason: Optional[str] = None


class VerifyRequest(BaseModel):
    sourceChain: str
    txHash: str


class VerifyResponse(BaseModel):
    sourceChain: str
    txHash: str
    verified: bool
    merkleProof: str
    votingRoundId: int
    simulated: bool
    simulationReason: Optional[str] = None


class OpportunityAlert(BaseModel):
    id: str
    title: str
    currentApy: float
    betterApy: float
    apyDeltaPct: float
    protocol: str
    chain: str
    explanation: str
    severity: Literal["info", "notable", "high"]


class AlertsResponse(BaseModel):
    alerts: list[OpportunityAlert]
    simulated: bool
    simulationReason: Optional[str] = None


class PortfolioRequest(BaseModel):
    walletAddress: str
    holdings: list[AssetHolding]


class PortfolioResponse(BaseModel):
    walletAddress: str
    holdings: list[AssetHolding]
    store: Literal["supabase", "in-memory"] = "in-memory"
