from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # CORS
    cors_origins: str = "http://localhost:3000"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_site_url: str = "http://localhost:3000"
    openrouter_site_name: str = "AI-Asset Router"

    # Flare
    flare_rpc_url: str = "https://coston2-api.flare.network/ext/C/rpc"

    # LI.FI
    lifi_api_key: str = ""

    # CoinGecko
    coingecko_api_key: str = ""

    # Supabase (optional — falls back to in-memory store when unset)
    supabase_url: str = ""
    supabase_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
