"""Daily embedding refresh — runs 02:00 SGT.

Re-embeds any profile whose bio/voice_intro_transcript/onboarding answers
changed since the last embedding. Writes to Profile.profile_embedding.
"""
from __future__ import annotations

import argparse

import psycopg
from openai import OpenAI
from rich.console import Console
from rich.progress import track

from lumin_ml.config import get_config

console = Console()


def profile_text(row: dict) -> str:
    parts = [
        row.get("display_name") or "",
        f"{row.get('city') or ''} {row.get('occupation') or ''}".strip(),
        row.get("bio_short") or "",
        row.get("bio_long") or "",
        row.get("voice_intro_transcript") or "",
    ]
    return "\n".join(p for p in parts if p)


def main(batch_size: int, limit: int | None) -> None:
    cfg = get_config()
    client = OpenAI(api_key=cfg.openai_api_key)

    sql_pending = """
        SELECT p.user_id::text,
               p.display_name, p.city, p.occupation, p.bio_short, p.bio_long,
               (SELECT m.transcript FROM "Media" m
                WHERE m.user_id = p.user_id AND m.kind = 'VOICE_INTRO'
                ORDER BY m.created_at DESC LIMIT 1) AS voice_intro_transcript
        FROM "Profile" p
        WHERE (p.updated_at > NOW() - INTERVAL '36 hours' OR p.profile_embedding IS NULL)
        ORDER BY p.updated_at DESC
        LIMIT %s;
    """
    with psycopg.connect(cfg.direct_url or cfg.database_url) as c, c.cursor() as cur:
        cur.execute(sql_pending, (limit or 10_000,))
        cols = [d.name for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]

    console.print(f"to-refresh: {len(rows)}")
    if not rows:
        return

    for i in track(range(0, len(rows), batch_size), description="embedding"):
        batch = rows[i : i + batch_size]
        texts = [profile_text(r) for r in batch]
        resp = client.embeddings.create(model=cfg.embed_model, input=texts)
        embeds = [d.embedding for d in resp.data]

        with psycopg.connect(cfg.direct_url or cfg.database_url) as c, c.cursor() as cur:
            for row, vec in zip(batch, embeds):
                cur.execute(
                    'UPDATE "Profile" SET profile_embedding = %s::vector WHERE user_id = %s',
                    (vec, row["user_id"]),
                )
            c.commit()
    console.print("[green]done[/green]")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--limit", type=int, default=None)
    args = p.parse_args()
    main(args.batch_size, args.limit)
