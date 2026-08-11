export interface AssetHolding {
  symbol: string;
  chain: string;
  amount: number;
  isTokenized?: boolean;
  currentApy?: number | null;
  currentProtocol?: string | null;
}

export interface PortfolioResponse {
  walletAddress: string;
  holdings: AssetHolding[];
  store: "supabase" | "in-memory";
}

export interface YieldOpportunity {
  project: string;
  chain: string;
  symbol: string;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  tvlUsd: number | null;
  poolId: string;
}

export interface FeedValue {
  symbol: string;
  feedId: string;
  value: number | null;
  decimals: number | null;
  timestamp: number | null;
  simulated: boolean;
  simulationReason?: string | null;
}

export interface RecommendationVerifiedData {
  guardrailPassed: boolean;
  sourceAudit: string[];
  verifiedApy?: number | null;
  verifiedTvlUsd?: number | null;
  verifiedRoute?: string;
  verifiedTimestamp?: number;
}

export interface Recommendation {
  rank: number;
  strategy: string;
  chain: string;
  protocol: string;
  estimatedApy: number | null;
  estimatedFeesPct: number | null;
  riskLevel: "low" | "medium" | "high";
  steps: string[];
  explanation: string;
  citedOpportunities: string[];
  comparisonNote?: string | null;
  badgeTag?: string | null;
  fromToken?: string | null;
  toToken?: string | null;
  fromChain?: string | null;
  toChain?: string | null;
  suggestedAmount?: string | null;
  verifiedData?: RecommendationVerifiedData | null;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface IntentResponse {
  recommendations: Recommendation[];
  context: {
    prices: FeedValue[];
    topYields: YieldOpportunity[];
  };
  simulated: boolean;
  simulationReason?: string | null;
}

export interface TransactionRequest {
  to: string;
  data: string;
  value: string;
  gasLimit?: string;
  chainId?: number;
}

export interface BridgeQuoteResponse {
  tool: string;
  estimatedToAmount: string;
  estimatedDurationSeconds?: number | null;
  feeCostsUsd?: number | null;
  gasCostsUsd?: number | null;
  slippagePct?: number | null;
  approvalAddress?: string | null;
  transactionRequest?: TransactionRequest | null;
  simulated: boolean;
  simulationReason?: string | null;
}

export type TxExecutionStep = "idle" | "preview" | "signing" | "broadcasting" | "confirmed" | "error";

export interface TxStatus {
  step: TxExecutionStep;
  txHash?: string | null;
  error?: string | null;
  simulated?: boolean;
  recommendation?: Recommendation | null;
  amount?: string | null;
}

export interface OpportunityAlert {
  id: string;
  title: string;
  currentApy: number;
  betterApy: number;
  apyDeltaPct: number;
  protocol: string;
  chain: string;
  explanation: string;
  severity: "info" | "notable" | "high";
}

export interface AlertsResponse {
  alerts: OpportunityAlert[];
  simulated: boolean;
  simulationReason?: string | null;
}

export interface WalletBalanceResponse {
  address: string;
  chain: string;
  symbol: string;
  balance: number | null;
  simulated: boolean;
  simulationReason?: string | null;
}

export interface YieldHistoryPoint {
  date: string;
  apy: number | null;
  tvlUsd: number | null;
}

export interface YieldHistoryResponse {
  poolId: string;
  points: YieldHistoryPoint[];
  simulated: boolean;
  simulationReason?: string | null;
}

export interface YieldsResponse {
  opportunities: YieldOpportunity[];
  simulated: boolean;
  simulationReason?: string | null;
}

export interface VerifyJob {
  id: string;
  sourceChain: string;
  txHash: string;
  status: "collecting" | "voting" | "finalized";
  merkleProof: string | null;
  votingRoundId: number | null;
  createdAt: number;
  fdcHubAddress?: string | null;
  verificationContract?: string | null;
  requestFeeWei?: string | null;
  proofStatus?: string | null;
  simulated: boolean;
  simulationReason?: string | null;
}

export interface FAssetsInfo {
  assetManager: string;
  fAssetToken: string;
  lotSizeUBA: number;
  lotSizeXRP: number;
  assetDecimals: number;
  mintingDecimals: number;
  collateralReservationFeeBIPS: number | null;
  collateralReservationFeePct: number | null;
  network: string;
  fetchedAt: number;
  simulated: boolean;
  simulationReason?: string | null;
}
