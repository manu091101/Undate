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

export function fallbackAvatar(displayName: string, _gender?: string | null): string {
  // Neutral, deterministic placeholder when a profile has no photo yet, an
  // initial on a soft pink gradient. Never a random (wrong-gender) stock face.
  // Returned as an inline SVG data URI (allowed by the CSP img-src data:).
  const initial = (displayName?.trim()?.[0] ?? 'U').toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#FDE3EE"/><stop offset="1" stop-color="#F7B8CE"/>` +
    `</linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#g)"/>` +
    `<text x="50%" y="50%" dy=".34em" text-anchor="middle" font-family="Georgia, serif" font-size="300" fill="#BE185D">${initial}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
