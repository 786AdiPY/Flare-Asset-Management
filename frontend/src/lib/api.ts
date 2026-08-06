import type { AlertsResponse, AssetHolding, IntentResponse } from "./types";

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
  symbols = "FLR/USD,BTC/USD,ETH/USD"
): Promise<{ feeds: IntentResponse["context"]["prices"] }> {
  return apiFetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
}
