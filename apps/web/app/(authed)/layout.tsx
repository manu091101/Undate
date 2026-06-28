// This layout is intentionally NOT used by Next.js, the (authed) folder name
// would create a route group. We pulled the AppNav into individual pages
// instead so the marketing pages (/, /about, /journal) don't accidentally
// inherit it. Kept as a placeholder for the Phase-1 refactor that may move
// every protected page under (authed)/ to share metadata + layout.
export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
