"""Configuration loader. All training/inference jobs read from here."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    database_url: str
    direct_url: str | None
    openai_api_key: str | None
    anthropic_api_key: str | None
    voyage_api_key: str | None
    s3_bucket: str | None
    s3_region: str
    model_dir: Path
    embed_model: str
    embed_dims: int
    ranker_version: str
    safety_threshold: float

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            database_url=_require("DATABASE_URL"),
            direct_url=os.getenv("DIRECT_URL"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            voyage_api_key=os.getenv("VOYAGE_API_KEY"),
            s3_bucket=os.getenv("LUMIN_S3_BUCKET"),
            s3_region=os.getenv("LUMIN_S3_REGION", "ap-south-1"),
            model_dir=Path(os.getenv("LUMIN_MODEL_DIR", "./models")),
            embed_model=os.getenv("LUMIN_EMBED_MODEL", "text-embedding-3-large"),
            embed_dims=int(os.getenv("LUMIN_EMBED_DIMS", "3072")),
            ranker_version=os.getenv("LUMIN_RANKER_VERSION", "v0.1-coldstart"),
            safety_threshold=float(os.getenv("LUMIN_SAFETY_THRESHOLD", "0.85")),
        )


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


@lru_cache(maxsize=1)
def get_config() -> Config:
    return Config.from_env()
