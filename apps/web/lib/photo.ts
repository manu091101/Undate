// Photo URL resolution + upload constants.
//
// Production:  s3Key = "users/<uuid>/<photo>.jpg" → CloudFront signed URL with 5-min TTL.
// MVP / dev:   s3Key may be:
//   - a full https:// URL (demo/placeholder photo from pravatar etc.)
//   - a path under /uploads/ served as a static file by Next.js
//
// We always treat the column as "whatever string resolves to the photo." Treating
// it as opaque keeps the migration to real S3 signed URLs a single function-swap.

export function resolvePhotoUrl(s3Key: string | null | undefined): string | null {
  if (!s3Key) return null;
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) return s3Key;
  if (s3Key.startsWith('/')) return s3Key;
  return `/${s3Key}`;
}

export const PHOTO_LIMITS = {
  maxBytes: 8 * 1024 * 1024, // 8MB
  acceptedMime: ['image/jpeg', 'image/png', 'image/webp'] as const,
  maxPerUser: 6,
  resizedMaxEdge: 1600,
  thumbMaxEdge: 480,
};

export function fallbackAvatar(displayName: string, gender: string | null): string {
  // Last-resort deterministic placeholder when a profile has no photo.
  const seed = encodeURIComponent(`${displayName ?? 'lumin'}-${gender ?? 'x'}`);
  return `https://i.pravatar.cc/600?u=${seed}`;
}
