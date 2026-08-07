# AI-Asset Router

AI Intent Router for Tokenized Assets. Users describe a financial goal in plain
language ("Generate passive income with my tokenized gold"); the backend gathers
live market context (Flare FTSO prices, DeFiLlama yields, LI.FI bridge routes)
and asks an LLM (via OpenRouter) to rank concrete on-chain strategies —
plus proactively surfaces better opportunities for whatever's already in the
user's wallet, with a plain-language explanation of *why* (and why not the
alternatives).

Five pages: **Home** (intent → ranked recommendations, with follow-up refine),
**Holdings & Alerts** (auto-detected + manual holdings, Smart Opportunity
Alerts), **Yields** (DeFiLlama explorer with APY history sparklines),
**Feeds** (11 live Flare FTSO price feeds), and **Verify** (a phase-accurate
Flare Data Connector attestation simulation). See **[FEATURES.md](FEATURES.md)**
for the full page-by-page breakdown of what's live vs. simulated.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python)
- **AI**: OpenRouter (LLM)
- **Blockchain**: Flare FTSOv2 (price feeds), Flare FDC (cross-chain verification, stubbed — see below)
- **Wallet**: MetaMask (live) / WalletConnect (not wired up yet, see below) / Demo Wallet
- **Data providers**: DeFiLlama (yields), CoinGecko (spot prices), LI.FI (cross-chain quotes)
- **Database**: Supabase (optional — falls back to an in-memory store when unconfigured)

## Design principle: simulate rather than break

Every external integration (OpenRouter, Flare FTSO, Flare wallet balance,
DeFiLlama, CoinGecko, LI.FI, Flare FDC, Supabase) is called through
`backend/app/services/simulation.py`'s
`safe_call()`. If the live call fails for *any* reason — no API key configured,
network error, unexpected response shape — it transparently falls back to a
realistic simulated value instead of erroring out. Every response carries
`simulated: true/false` (+ a `simulationReason`), and the frontend renders a
"Live" / "Simulated" badge next to each piece of data rather than silently
passing off fake data as real. The product always demos end to end, even with
zero API keys configured.

## Running locally

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in OPENROUTER_API_KEY etc. to go beyond simulation mode
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. It talks to the backend at
`NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`).

## What's real vs. simulated out of the box

With no API keys configured at all:

| Integration | Status with no keys | Notes |
|---|---|---|
| DeFiLlama yields (+ history) | **Live** | Public API, no key needed |
| CoinGecko spot prices | **Live** | Public API (free tier, rate-limited) |
| Flare FTSOv2 prices | **Live** | 11 feeds, read concurrently from Coston2 testnet via `web3.py`; set `FLARE_RPC_URL` for mainnet |
| Flare native wallet balance | **Live** | Real `eth_getBalance` for the connected address on Flare |
| LI.FI bridge quotes | **Live** | No key needed for basic quotes |
| OpenRouter recommendations / refine / alert explanations | Simulated | Needs `OPENROUTER_API_KEY` — falls back to a deterministic ranked rule-based recommendation otherwise |
| Flare FDC attestation | Always simulated | Phase-accurate timing (collecting → voting → finalized), but no real verifier/DA Layer — see `backend/app/services/flare_fdc.py` |
| Supabase portfolio storage | In-memory | Needs `SUPABASE_URL` + `SUPABASE_KEY` — run `backend/supabase_schema.sql` first |
| WalletConnect | Not implemented | Needs a Reown/WalletConnect Cloud project ID; MetaMask and "Use Demo Wallet" work today |

## API (backend, prefix `/api`)

- `POST /intent` — `{ intent, walletAddress?, portfolio?, history? }` → ranked `recommendations[]` + context
- `GET /alerts?wallet=` — smart opportunity alerts with AI explanations
- `GET /prices?symbols=FLR/USD,BTC/USD` / `GET /prices/all` — Flare FTSO feeds
- `GET /prices/spot?symbols=XAU,BTC` — CoinGecko spot prices
- `GET /yields?keywords=&chain=` — DeFiLlama opportunity explorer
- `GET /yields/{poolId}/history?days=` — per-pool APY/TVL history
- `GET /wallet/{address}/balance` — native FLR balance auto-detect
- `POST /bridge-quote` — LI.FI cross-chain quote
- `POST /verify`, `GET /verify/{jobId}` — Flare FDC attestation job (simulated)
- `POST /portfolio`, `GET /portfolio/{wallet_address}` — Supabase-backed (or in-memory) holdings

## Repo layout

```
frontend/   Next.js app (UI + wallet connect)
backend/    FastAPI app (routers, services, simulation-fallback logic)
```
