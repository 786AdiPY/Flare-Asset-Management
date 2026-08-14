from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import alerts, bridge, fassets, intent, portfolio, prices, verify, wallet, yields

settings = get_settings()

app = FastAPI(title="AI-Asset Router API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["https://flare-asset-management-lemon.vercel.app"],
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intent.router, prefix="/api", tags=["intent"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(prices.router, prefix="/api", tags=["prices"])
app.include_router(bridge.router, prefix="/api", tags=["bridge"])
app.include_router(verify.router, prefix="/api", tags=["verify"])
app.include_router(portfolio.router, prefix="/api", tags=["portfolio"])
app.include_router(wallet.router, prefix="/api", tags=["wallet"])
app.include_router(yields.router, prefix="/api", tags=["yields"])
app.include_router(fassets.router, prefix="/api", tags=["fassets"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
