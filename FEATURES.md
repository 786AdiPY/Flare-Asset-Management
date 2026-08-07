# Features

A tour of everything in the app, page by page, with what's genuinely live vs.
clearly-labeled simulated fallback. See `README.md` for setup/run instructions
and the overall simulate-rather-than-break design principle.

Every page shares one nav bar and one wallet connection (MetaMask or "Use Demo
Wallet"), persisted in `localStorage` via `frontend/src/lib/walletContext.tsx`
so it survives page navigation and refresh.

---

## Home (`/`) — AI Intent Recommendation Engine

Describe a financial goal in plain language ("Generate passive income with my
tokenized gold") and get back **2–3 ranked on-chain strategies**, not just one.

- The backend gathers live context first — Flare FTSO prices, DeFiLlama yield
  opportunities matched to keywords in the intent (or the connected wallet's
  saved holdings) — then asks an LLM (via OpenRouter) to rank strategies against
  that context.
- The top pick is shown in full (chain, protocol, est. APY/fees, risk, steps,
  explanation). Alternatives #2 and #3 collapse into expandable cards, each
  carrying a **`comparisonNote`** — a one-line reason it ranked below the top
  pick (e.g. "offers 12.3 pts lower APY"). This is the explainable-AI angle
  from the original pitch: not just *why the winner*, but *why not the others*.
- **Refine, don't restart.** Once you have a recommendation, the form switches
  to "Refine your recommendation" — type something like *"make it lower risk"*
  and the full prior exchange is sent back as conversation history
  (`ConversationTurn[]`) so the follow-up is contextual, not a fresh cold ask.
- Risk level in the simulated fallback is derived from pool TVL (≥$5M → low,
  ≥$1M → medium, else high) as a liquidity/safety proxy — not arbitrary.
- **Live**: DeFiLlama yields, Flare FTSO prices. **Simulated without a key**:
  the ranking itself falls back to a deterministic rule engine
  (`backend/app/services/rule_engine.py`) that ranks by APY and fills in the
  same comparison-note structure, so refine/rank/compare all still work with
  zero API keys configured.
- Endpoint: `POST /api/intent` — `{ intent, walletAddress?, portfolio?, history? }`

## Holdings & Alerts (`/holdings`) — Smart Opportunity Alerts

Save what you actually hold so alerts compare against reality instead of a
canned demo portfolio.

- **Auto-detect balance.** On connecting a wallet, the page reads its real
  native FLR balance on-chain (`eth_getBalance` via `web3.py` against
  `FLARE_RPC_URL`) and offers a one-click "Add to holdings." ERC-20 tokens and
  other chains aren't auto-detected yet (would need a token list + multicall
  or a balances API per chain) — add those manually.
- Manually add/remove holdings with an optional current protocol + APY (unset
  = idle, 0% baseline).
- **Save holdings** persists via `POST /api/portfolio` (Supabase if configured,
  otherwise an in-memory store keyed by wallet address).
- The alerts panel below re-queries DeFiLlama for each holding's symbol, and
  surfaces an alert whenever a real qualifying pool beats the current APY by
  >15% relative, with an AI-generated (or simulated) plain-language
  explanation of the trade-off and risk.
- Saving holdings immediately refreshes the alerts panel (no reload needed).
- **Live**: wallet balance (Flare native), DeFiLlama yields. **Simulated
  without a key**: alert explanations.
- Endpoints: `GET /api/wallet/{address}/balance`, `POST`/`GET /api/portfolio`,
  `GET /api/alerts?wallet=`

## Yields (`/yields`) — Opportunity Explorer

Browse the same DeFiLlama universe the recommendation engine draws from,
filterable by symbol, with historical context per pool.

- Live pool list (project, chain, symbol, APY, TVL), capped at a believable
  APY range — DeFiLlama includes thinly-traded reward-farm pools with
  four/five-digit APYs that are real numbers but not credible recommendations;
  anything above the cap is filtered out as noise, both here and in the
  recommendation engine.
- **30-day APY/TVL history per pool**, fetched lazily on expand (not
  preloaded for all 20 rows) and rendered as an inline sparkline — because a
  single-snapshot high APY doesn't tell you if a rate is stable or about to
  collapse. Sparkline follows this codebase's chart conventions: a single
  2px line, 10%-opacity area wash, an end-dot, and a hover crosshair +
  tooltip (see `frontend/src/components/Sparkline.tsx`).
- **Live**: pool list and history both come straight from `yields.llama.fi`.
  Simulated fallback (deterministic per pool ID, so repeated views look
  consistent) only kicks in if DeFiLlama is unreachable.
- Endpoints: `GET /api/yields?keywords=&chain=`, `GET /api/yields/{poolId}/history?days=`

## Feeds (`/feeds`) — Flare FTSO Price Feeds

Every Flare FTSOv2 feed this app knows how to read, refreshed every 30s.

- Broadened from the original 3 (FLR, BTC, ETH) to 11 category-1 (crypto)
  feeds: FLR, SGB, BTC, ETH, XRP, LTC, DOGE, ADA, ALGO, USDT, USDC — all
  against USD.
- Feed IDs are **derived programmatically**, not hand-typed: 1 category byte +
  ASCII symbol, right-padded to 21 bytes
  (`backend/app/services/flare_ftso.py:_build_feed_id`), the same encoding
  verified against Flare's own FLR/USD, BTC/USD, ETH/USD examples. All 11
  currently resolve live against Coston2 — any that don't (e.g. if a feed
  isn't active on a given network) transparently fall back to simulated
  rather than erroring the whole page.
- Registry resolution (`FlareContractRegistry` → `FtsoV2` address) is cached
  after the first successful call; all feed reads run **concurrently**
  (`asyncio.gather`), not sequentially — the initial version of this page
  serially awaited 11 RPC round-trips and took ~35s to load, parallelizing
  brought it under 5s.
- Endpoint: `GET /api/prices/all`

## Verify (`/verify`) — Flare Data Connector

Submit a cross-chain attestation request and watch it move through FDC's
actual phases.

- This is explicitly **not** a live FDC integration — a real one needs a live
  source-chain transaction, a funded attestation-request account, and polling
  across external verifier servers plus the Data Availability Layer
  (documented in `backend/app/services/flare_fdc.py`, with links to Flare's
  FDC docs). That's out of scope for this scaffold.
- What's implemented is a **phase-accurate local simulation**: submitting a
  request creates a job that progresses `collecting` (90s, matching FDC's
  real collection window) → `voting` (30s) → `finalized`, at which point it
  returns a Merkle proof and voting round ID. The frontend polls every 3s and
  renders a phase stepper.
- Always labeled `simulated: true` with an explicit reason — this page is
  about showing the *shape* of FDC's flow accurately, not claiming to be a
  live verifier.
- Endpoints: `POST /api/verify`, `GET /api/verify/{jobId}`

---

## Cross-cutting: the simulation-fallback design

Every external call (OpenRouter, Flare FTSO, Flare wallet balance, DeFiLlama,
CoinGecko, LI.FI, Supabase) goes through `safe_call()` in
`backend/app/services/simulation.py`: try the live call, and on *any* failure
— missing key, network error, unexpected shape — fall back to a realistic
simulated value instead of a broken page. Every response carries
`simulated` + `simulationReason`, and the frontend always renders a
Live/Simulated badge next to the data it applies to, rather than silently
presenting fake data as real. Flare FDC is the one exception that's
*permanently* simulated (see above) since there's no live path to fall back
from yet.
