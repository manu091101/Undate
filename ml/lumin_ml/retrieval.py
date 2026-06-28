"""Candidate retrieval via pgvector ANN.

The 3072-dim profile_embedding column is HNSW-indexed. We retrieve top-200
nearest candidates per user, then apply hard filters (region, blocks,
preferences) before ranking.

IMPORTANT: Prisma 5 maps fields to columns using the *field name as-is*
unless @map() is applied. Lumin's Prisma schema uses camelCase fields and
NO @map directives, so Postgres column names are camelCase. All identifiers
below are double-quoted so Postgres preserves case.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

import psycopg
from pgvector.psycopg import register_vector

from .config import get_config


@contextmanager
def _conn() -> Iterator[psycopg.Connection]:
    cfg = get_config()
    with psycopg.connect(cfg.direct_url or cfg.database_url) as c:
        register_vector(c)
        yield c


def fetch_candidates(user_id: str, region: str, top_k: int = 200) -> list[str]:
    """Return top_k candidate user_ids by embedding similarity.

    Hard filters applied at SQL layer:
      - same residencyRegion (cross-region opt-in deferred to v1)
      - User.status = ACTIVE
      - not the user themselves
      - not previously matched in the last 90 days
      - age within preferences
    """
    sql = """
        WITH me AS (
            SELECT p."userId"                                    AS user_id,
                   p."profileEmbedding"                          AS profile_embedding,
                   pf."ageMin"                                   AS age_min,
                   pf."ageMax"                                   AS age_max,
                   EXTRACT(YEAR FROM age(p."dateOfBirth"))::int  AS my_age
            FROM "Profile"      p
            JOIN "Preferences"  pf ON pf."userId" = p."userId"
            WHERE p."userId" = %s
        )
        SELECT p."userId"::text
        FROM "Profile" p
        JOIN "User"    u ON u.id = p."userId"
        CROSS JOIN me
        WHERE u.status              = 'ACTIVE'
          AND u."residencyRegion"   = %s
          AND p."userId"            <> me.user_id
          AND p."profileEmbedding"  IS NOT NULL
          AND EXTRACT(YEAR FROM age(p."dateOfBirth"))::int
              BETWEEN me.age_min AND me.age_max
          AND NOT EXISTS (
              SELECT 1 FROM "Match" m
              WHERE m."proposedAt" > NOW() - INTERVAL '90 days'
                AND ((m."userAId" = me.user_id AND m."userBId" = p."userId")
                  OR (m."userBId" = me.user_id AND m."userAId" = p."userId"))
          )
        ORDER BY p."profileEmbedding" <=> me.profile_embedding
        LIMIT %s;
    """
    with _conn() as c, c.cursor() as cur:
        cur.execute(sql, (user_id, region, top_k))
        return [row[0] for row in cur.fetchall()]
