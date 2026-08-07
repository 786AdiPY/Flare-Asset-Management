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
  simulated: boolean;
  simulationReason?: string | null;
}
