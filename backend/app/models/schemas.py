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


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class IntentRequest(BaseModel):
    intent: str
    walletAddress: Optional[str] = None
    portfolio: list[AssetHolding] = []
    # Prior turns for a "refine" follow-up (e.g. "make it lower risk"). Empty
    # for a fresh ask; the caller appends its own turns as the conversation
    # grows — the backend is stateless across requests.
    history: list[ConversationTurn] = []


class GoalProfile(BaseModel):
    asset: Optional[str] = None
    objective: Optional[Literal["yield", "liquidity", "preservation", "growth", "lowest_cost"]] = None
    targetApy: Optional[float] = None
    riskTolerance: Optional[Literal["low", "medium", "high"]] = None
    maxLockDays: Optional[int] = None
    preferredChain: Optional[str] = None
    feePreference: Optional[Literal["lowest_fees", "acceptable"]] = None


class Recommendation(BaseModel):
    rank: int = 1
    strategy: str
    chain: str
    protocol: str
    estimatedApy: Optional[float] = None
    estimatedFeesPct: Optional[float] = None
    riskLevel: Literal["low", "medium", "high"] = "medium"
    steps: list[str] = []
    explanation: str
    citedOpportunities: list[str] = []
    comparisonNote: Optional[str] = None
    badgeTag: Optional[str] = None
    fromToken: Optional[str] = None
    toToken: Optional[str] = None
    fromChain: Optional[str] = None
    toChain: Optional[str] = None
    suggestedAmount: Optional[str] = None
    verifiedData: Optional[dict] = None
    evidence: list[str] = []
    score: Optional[float] = None


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
    recommendations: list[Recommendation]
    context: IntentResponseContext
    goalProfile: Optional[GoalProfile] = None
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
    slippagePct: Optional[float] = 0.5
    approvalAddress: Optional[str] = None
    transactionRequest: Optional[dict] = None
    simulated: bool
    simulationReason: Optional[str] = None


class VerifyRequest(BaseModel):
    sourceChain: str
    txHash: str


class VerifyJob(BaseModel):
    id: str
    sourceChain: str
    txHash: str
    status: Literal["collecting", "voting", "finalized"]
    merkleProof: Optional[str] = None
    votingRoundId: Optional[int] = None
    createdAt: float
    fdcHubAddress: Optional[str] = None
    verificationContract: Optional[str] = None
    requestFeeWei: Optional[str] = None
    proofStatus: Optional[str] = None
    simulated: bool = False
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
    goalMatchNote: Optional[str] = None


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


class WalletBalanceResponse(BaseModel):
    address: str
    chain: str
    symbol: str
    balance: Optional[float] = None
    simulated: bool
    simulationReason: Optional[str] = None


class YieldHistoryPoint(BaseModel):
    date: str
    apy: Optional[float] = None
    tvlUsd: Optional[float] = None


class YieldHistoryResponse(BaseModel):
    poolId: str
    points: list[YieldHistoryPoint]
    simulated: bool
    simulationReason: Optional[str] = None


class YieldsResponse(BaseModel):
    opportunities: list[YieldOpportunity]
    simulated: bool
    simulationReason: Optional[str] = None


class FAssetsInfo(BaseModel):
    """Live Coston2 FTestXRP Asset Manager parameters."""
    assetManager: str
    fAssetToken: str
    lotSizeUBA: int
    lotSizeXRP: float
    assetDecimals: int
    mintingDecimals: int
    collateralReservationFeeBIPS: Optional[int] = None
    collateralReservationFeePct: Optional[float] = None
    network: str
    fetchedAt: int
    simulated: bool = False
    simulationReason: Optional[str] = None
