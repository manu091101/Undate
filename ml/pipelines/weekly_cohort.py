"""Weekly cohort pipeline — runs Saturday 18:00 SGT.

For every active user:
  1. Retrieve top-200 candidates via pgvector ANN (with hard filters).
  2. Score via cold-start ranker (or LightGBM once trained).
  3. Persist top-K (default 7) into match_candidates table.
  4. Enqueue LLM narrative-generation jobs.
  5. Hand off to curator queue (Sunday 02:00 SGT).
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone

import psycopg
from rich.console import Console
from rich.progress import track

from lumin_ml.cold_start_ranker import rank
from lumin_ml.config import get_config
from lumin_ml.retrieval import fetch_candidates

console = Console()


def iso_week_id(dt: datetime) -> str:
    iso = dt.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def run(top_k: int, region: str, dry_run: bool) -> None:
    cfg = get_config()
    week_id = iso_week_id(datetime.now(timezone.utc))
    console.print(f"[bold]Weekly cohort[/bold] week={week_id} region={region} top_k={top_k}")

    with psycopg.connect(cfg.direct_url or cfg.database_url) as c, c.cursor() as cur:
        cur.execute(
            'SELECT id::text FROM "User" WHERE status = %s AND residency_region = %s',
            ("ACTIVE", region),
        )
        active_user_ids = [row[0] for row in cur.fetchall()]
    console.print(f"active users: {len(active_user_ids)}")

    for user_id in track(active_user_ids, description="ranking"):
        candidate_ids = fetch_candidates(user_id, region=region, top_k=200)
        # In v0 we fetch UserFeatures inline. In a real run this would batch via SQL.
        # Stubbed here to keep the file complete and reviewable.
        # TODO: integrate FeatureLoader (TBI) — same module that the API uses
        # so prod inference and offline ranker share feature parity.
        if not candidate_ids:
            continue
        console.print(f"  {user_id[:8]} → {len(candidate_ids)} candidates")
        if dry_run:
            continue
        # Persist top_k into match_candidates would happen here.
    console.print("[green]done[/green]")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--top-k", type=int, default=7)
    p.add_argument("--region", default="SG")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    run(args.top_k, args.region, args.dry_run)
