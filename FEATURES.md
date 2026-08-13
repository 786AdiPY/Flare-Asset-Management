# Features & Architecture Overview

A comprehensive guide to the **AI-Asset Router** app structure, page routes, backend services, and component architecture.

---

## Repository & Directory Structure

```
FLare/
├── frontend/                       # Next.js 14 App Router Frontend
│   └── src/
│       ├── app/                    # Page Routes
│       │   ├── page.tsx            # Home: Landing Page & Main Goal-Aware Asset Router
│       │   ├── holdings/page.tsx   # Portfolio Holdings & Goal-Matched Smart Alerts
│       │   ├── yields/page.tsx     # Cross-Chain DeFi Yield Explorer (DeFiLlama + Sparklines)
│       │   └── feeds/page.tsx      # Live Flare FTSOv2 Price Oracle Feeds (11 category-1 feeds)
│       ├── components/             # UI Components
│       │   ├── landing/            # LandingPage, DynamicGlobe (WebGL cobe 3/5 sphere), LandingNavbar
│       │   ├── NavBar.tsx          # Header Navigation Bar with Logo & Route Links
│       │   ├── IntentForm.tsx      # Natural Language Intent Input & Prompt Examples
│       │   ├── RecommendationCard.tsx # Goal-Aware Strategy Cards ("Why this option?", evidence, "Best Match")
│       │   ├── FAssetsCard.tsx     # Contextual Coston2 FTestXRP / FXRP Onboarding Card
│       │   ├── HoldingsPanel.tsx   # On-chain Native FLR Balance Auto-detection & Portfolio Saver
│       │   ├── AlertsPanel.tsx     # Goal-Matched Smart Opportunity Alerts
│       │   ├── PriceTicker.tsx     # Live FTSOv2 Price Ticker Bar (FLR, BTC, ETH, XRP)
│       │   ├── RoutePreviewModal.tsx # Non-custodial LI.FI Route & Bridge Execution Modal
│       │   ├── Sparkline.tsx       # 30-Day Yield/TVL Historical Sparkline Chart
│       │   ├── TxStatusCard.tsx    # Step-by-Step Route Broadcast & Transaction Tracker
│       │   └── WalletConnect.tsx   # MetaMask & Demo Wallet Connection Toggle
│       └── lib/                    # Client Services & State
│           ├── api.ts              # Backend API Client
│           ├── types.ts            # TypeScript Models (GoalProfile, Recommendation, Alert, etc.)
│           ├── wallet.ts           # MetaMask EIP-1193 Transaction Sender
│           └── walletContext.tsx   # Global Wallet State & localStorage Persistence
│
└── backend/                        # FastAPI Python Backend Engine
    └── app/
        ├── main.py                 # FastAPI Application Server & CORS Configuration
        ├── config.py               # Environment Variables & Settings
        ├── models/
        │   └── schemas.py          # Pydantic Schemas (GoalProfile, Recommendation, IntentResponse, etc.)
        ├── routers/                # API Endpoints
        │   ├── intent.py           # POST /api/intent (Goal-Aware Router Endpoint)
        │   ├── fassets.py          # GET /api/fassets/ftestxrp (Live Coston2 Parameters)
        │   ├── alerts.py           # GET /api/alerts (Goal-Matched Opportunity Alerts)
        │   ├── prices.py           # GET /api/prices (FTSOv2 Live Oracle Feeds)
        │   ├── bridge.py           # POST /api/bridge-quote (LI.FI Quote API)
        │   ├── yields.py           # GET /api/yields & /history (DeFiLlama Pools)
        │   ├── portfolio.py        # POST/GET /api/portfolio (Supabase / In-Memory Store)
        │   └── wallet.py           # GET /api/wallet/{address}/balance (Coston2 On-Chain FLR Balance)
        └── services/               # Core Decision Engines & On-Chain Integrations
            ├── goal_engine.py      # Goal Profile Parser & Deterministic Scoring Engine
            ├── fassets.py          # Contract Registry Resolver for AssetManagerFXRP (Coston2)
            ├── flare_ftso.py       # Flare FTSOv2 Oracle Price Reader (11 Category-1 Feeds)
            ├── openrouter.py       # OpenRouter LLM Intent Parsing & Alert Explanations
            ├── rule_engine.py      # Deterministic Fallback Recommendation Engine
            ├── defillama.py        # DeFiLlama Yield Opportunities & History Fetcher
            ├── lifi.py             # LI.FI Cross-Chain Bridge & Swap Route Provider
            ├── supabase_client.py  # Portfolio Storage Client
            └── simulation.py       # Fail-Safe Wrapper (`safe_call`) for Graceful Simulated Fallbacks
```

---

## 1. Landing Page (`/` when view = landing) — 3D Interactive Globe & Onboarding

An institutional landing page designed to introduce Flare FTSO valuation, cross-chain yield routing, and FAssets.

- **Dynamic 3D Globe (`DynamicGlobe.tsx`)**: Built with WebGL/`cobe` showing 3/5 view of the globe, smooth 360-degree mouse drag rotation, hairline white route arcs, and active data nodes (Flare FTSOv2, XRP XRPL, Ethereum, Base, Arbitrum, Avalanche).
- **Hover Node Labels**: Hovering over any dot node pops up its chain/currency badge in real-time (`FLR — Flare FTSOv2`, `XRP — XRPL`, `ETH — Ethereum Mainnet`, etc.).
- **Hero Entry Points**:
  - `Launch AssetRouter →`: Opens the primary Goal-Aware AssetRouter app interface.
  - `⚡ Have XRP? Explore Flare →`: Direct single-entry point that launches the router pre-loaded with an XRP/FXRP FAssets discovery query.

---

## 2. Main App Router (`/` when view = app) — Goal-Aware Recommendation Engine

Non-custodial intent routing for tokenized real-world assets and crypto holdings across multiple chains.

### A. Intent → Goal Profile Extraction
Translates natural-language financial goals (*"I want at least 8% low risk yield on my USDC on Flare"*) into a structured `GoalProfile`:
- `asset`: Target asset ticker (e.g. `USDC`, `FLR`, `XRP`)
- `objective`: Primary intent (`yield`, `liquidity`, `preservation`, `growth`, `lowest_cost`)
- `targetApy`: Explicit target APY (e.g. `8.0%`)
- `riskTolerance`: User risk preference (`low`, `medium`, `high`)
- `maxLockDays`: Lockup constraints (`0` for unlocked)
- `preferredChain`: Target network preference (e.g. `Flare`)
- `feePreference`: Execution fee preference (`lowest_fees`, `acceptable`)

*Strict Rule*: Only populates constraints explicitly stated by the user; unstated fields remain `null`.

### B. Deterministic Goal-Based Scoring & Ranking
Instead of picking raw highest APY, the backend scoring engine (`backend/app/services/goal_engine.py`) deterministically scores candidate strategies:
- **Target APY Fit**: Bonus when APY ≥ target, scaled penalty if below.
- **Risk Alignment**: Bonus when candidate risk matches user tolerance.
- **Liquidity Signal**: TVL is evaluated strictly as a **liquidity depth signal** (`$1M+ TVL`), **NOT** as a risk classification.
- **Fee & Chain Fit**: Scoring boosts for low fees (<0.3%) and matching `preferredChain`.
- **FAssets / FXRP Pathway**: Evaluated dynamically when relevant (e.g. XRP queries) without forcing it into unrelated requests.
- **`Best Match` Badge**: Assigned to the #1 ranked pick **AFTER** deterministic scoring.
- **LLM Boundary**: OpenRouter LLM is used strictly for intent extraction and narrative explanations — **never for generating fake numerical data**.

### C. Recommendation UI & "Why this option?" Evidence Checkmarks
- **Parsed Goal Profile Chips**: Displays extracted constraint chips above the recommendation cards so users can verify how their request was parsed.
- **"Why this option?" Section**: Replaces generic AI reasoning with evidence checkmarks backed *only* by supported data:
  - `✓ Meets target APY (8.4% ≥ 8.0%)`
  - `✓ Matches low risk preference`
  - `✓ Fits liquidity requirement ($2.4M TVL)`
  - `✓ Low execution fee (0.3%)`
  - `✓ Preferred chain (Flare)`
- **Explainable Alternatives**: Candidates #2 and #3 collapse into expandable cards with a `comparisonNote` explaining why they ranked below the top pick.
- **Refine Conversation**: Submitting follow-up requests (*"make it lower risk"*) retains full `ConversationTurn[]` history.

### D. Contextual FAssets / FXRP Card (`FAssetsCard.tsx`)
Rendered dynamically whenever the user's query involves XRP:
- **Live Coston2 On-Chain Data**: Reads the deployed `AssetManagerFXRP` (`0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA`) and `FTestXRP` token (`0x0b6A3645c240605887a5532109323A3E12273dc7`) via the **Flare Contract Registry** (`0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019`).
- **Live Lot Size**: Displays the live 10.0 XRP lot size requirement.
- **XRP/USD Oracle Price**: Reads live FTSOv2 price feed.
- **Manual XRP Amount Preview**: Allows users to preview how many lots their XRP covers without requiring XRPL wallet integration.

### E. LI.FI Non-Custodial Route Execution
- Clicking **"Select Route & Execute →"** opens `RoutePreviewModal.tsx`, querying LI.FI (`/api/bridge-quote`) for real cross-chain bridge/swap quotes, estimated duration, gas, and slippage.
- Executes via connected MetaMask wallet (`eth_sendTransaction`), or simulated step-by-step broadcast for Demo Wallet.

---

## 3. Holdings & Opportunity Alerts (`/holdings`)

A dedicated space to manage active portfolio holdings and receive goal-matched alerts.

- **Auto-Detect Native FLR Balance**: Queries real on-chain balance via `eth_getBalance` against `FLARE_RPC_URL` (Coston2).
- **Manual Asset Portfolio**: Add holdings with symbol, chain, amount, current protocol, and current APY (saved via `POST /api/portfolio` to Supabase or in-memory store).
- **Goal-Matched Smart Alerts**: Continuously monitors holdings against DeFiLlama yield pools. Triggers alerts only when a new opportunity materially matches the user's requirements:
  > *"Your current position yields 3.2%. A new 8.4% opportunity now meets your 5.2% target while remaining within your low-risk preference."*

---

## 4. Yields Explorer (`/yields`)

Browse cross-chain DeFi yield opportunities sourced from DeFiLlama.

- **Filtered Opportunity Table**: Filterable by asset keyword and chain. Inflationary/thinly-traded farm pools above 60% APY are automatically filtered out.
- **30-Day APY & TVL History Sparklines**: Expandable rows lazily fetch 30-day historical data (`GET /api/yields/{poolId}/history`) rendered as custom SVG sparklines with hover crosshairs and tooltips.

---

## 5. Flare FTSOv2 Price Feeds (`/feeds`)

Live dashboard of Flare FTSOv2 oracle feeds refreshed every 30 seconds.

- **11 Category-1 Crypto Feeds**: FLR/USD, SGB/USD, BTC/USD, ETH/USD, XRP/USD, LTC/USD, DOGE/USD, ADA/USD, ALGO/USD, USDT/USD, USDC/USD.
- **Programmatic Feed ID Encoding**: Feed IDs derived programmatically (`category 0x01` + ASCII symbol right-padded to 21 bytes) as defined by FTSOv2 specification.
- **Contract Registry Caching**: `FlareContractRegistry` → `FtsoV2` address resolution cached in memory; all feeds fetched concurrently via `asyncio.gather()`.

---

## 6. Resilient Simulation Fallback Architecture

Every external call (OpenRouter LLM, Flare FTSO, Coston2 RPC, DeFiLlama, LI.FI, Supabase) is wrapped in `safe_call()` (`backend/app/services/simulation.py`):
- Attempts live network/contract call first.
- On key absence, rate limit, or RPC error, seamlessly falls back to realistic simulated data.
- Standardized response flag: `simulated: boolean` & `simulationReason: string | null`.
- Frontend displays `SimulatedBadge` components for complete user transparency.
