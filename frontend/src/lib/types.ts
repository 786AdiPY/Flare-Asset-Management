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
  strategy: string;
  chain: string;
  protocol: string;
  estimatedApy: number | null;
  estimatedFeesPct: number | null;
  riskLevel: "low" | "medium" | "high";
  steps: string[];
  explanation: string;
  citedOpportunities: string[];
}

export interface IntentResponse {
  recommendation: Recommendation;
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
