from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Secrets come only from the environment."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mp_access_token: SecretStr = Field(min_length=10)
    mp_webhook_secret: SecretStr = Field(min_length=10)
    payment_link_secret: SecretStr = Field(min_length=32)
    mp_use_sandbox: bool = False
    frontend_url: str
    public_api_url: str = ""
    allowed_origins: str = ""
    database_path: str = "data/payments.db"

    @property
    def origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def frontend_base(self) -> str:
        return self.frontend_url.rstrip("/")

    @property
    def webhook_url(self) -> str | None:
        base = self.public_api_url.rstrip("/")
        return f"{base}/api/webhooks/mercadopago" if base.startswith("https://") else None


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
