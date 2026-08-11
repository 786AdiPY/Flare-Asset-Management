import type {
  AlertsResponse,
  AssetHolding,
  ConversationTurn,
  FAssetsInfo,
  IntentResponse,
  PortfolioResponse,
  VerifyJob,
  WalletBalanceResponse,
  YieldHistoryResponse,
  YieldsResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export function postIntent(payload: {
  intent: string;
  walletAddress?: string | null;
  portfolio?: AssetHolding[];
  history?: ConversationTurn[];
}): Promise<IntentResponse> {
  return apiFetch<IntentResponse>("/api/intent", {
    method: "POST",
    body: JSON.stringify({ ...payload, walletAddress: payload.walletAddress ?? undefined }),
  });
}

export function getAlerts(wallet?: string | null): Promise<AlertsResponse> {
  const qs = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  return apiFetch<AlertsResponse>(`/api/alerts${qs}`);
}

export function getPrices(
  symbols = "FLR/USD,BTC/USD,ETH/USD,XRP/USD"
): Promise<{ feeds: IntentResponse["context"]["prices"] }> {
  return apiFetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
}

export function savePortfolio(
  walletAddress: string,
  holdings: AssetHolding[]
): Promise<PortfolioResponse> {
  return apiFetch<PortfolioResponse>("/api/portfolio", {
    method: "POST",
    body: JSON.stringify({ walletAddress, holdings }),
  });
}

export function getPortfolio(walletAddress: string): Promise<PortfolioResponse> {
  return apiFetch<PortfolioResponse>(`/api/portfolio/${encodeURIComponent(walletAddress)}`);
}

export function getAllPrices(): Promise<{ feeds: IntentResponse["context"]["prices"] }> {
  return apiFetch("/api/prices/all");
}

export function getWalletBalance(address: string): Promise<WalletBalanceResponse> {
  return apiFetch<WalletBalanceResponse>(`/api/wallet/${encodeURIComponent(address)}/balance`);
}

export function getYields(opts: { keywords?: string; chain?: string; limit?: number } = {}): Promise<YieldsResponse> {
  const params = new URLSearchParams();
  if (opts.keywords) params.set("keywords", opts.keywords);
  if (opts.chain) params.set("chain", opts.chain);
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiFetch<YieldsResponse>(`/api/yields${qs ? `?${qs}` : ""}`);
}

export function getYieldHistory(poolId: string, days = 30): Promise<YieldHistoryResponse> {
  return apiFetch<YieldHistoryResponse>(`/api/yields/${encodeURIComponent(poolId)}/history?days=${days}`);
}

export function postVerify(sourceChain: string, txHash: string): Promise<VerifyJob> {
  return apiFetch<VerifyJob>("/api/verify", {
    method: "POST",
    body: JSON.stringify({ sourceChain, txHash }),
  });
}

export function getVerifyJob(jobId: string): Promise<VerifyJob> {
  return apiFetch<VerifyJob>(`/api/verify/${encodeURIComponent(jobId)}`);
}

export function postBridgeQuote(payload: {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
}): Promise<import("./types").BridgeQuoteResponse> {
  return apiFetch<import("./types").BridgeQuoteResponse>("/api/bridge-quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getFAssetsInfo(): Promise<FAssetsInfo> {
  return apiFetch<FAssetsInfo>("/api/fassets/ftestxrp");
}
