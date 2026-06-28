-- Run AFTER `prisma migrate dev --name init` so the Match table exists.
-- Enforces canonical ordering of (userAId, userBId) so a pair cannot be
-- stored twice in opposite orientations. See schema.prisma Match.

ALTER TABLE "Match"
  ADD CONSTRAINT match_canonical_order_chk
  CHECK ("userAId" < "userBId");

-- And a partial unique index that's case-blind to the schema declaration:
-- if any pre-existing rows violated ordering, this would fail noisily so we
-- can repair before enforcing.
