/** Minimal HTML helpers for server-rendered pages. */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface NavUser {
  displayName: string;
  isAdmin: boolean;
}

export function layout(opts: {
  title: string;
  body: string;
  user?: NavUser | null;
  flash?: string | null;
}): string {
  const nav = opts.user
    ? `
      <a href="/dashboard">Dashboard</a>
      <a href="/matches">Matches</a>
      ${opts.user.isAdmin ? '<a href="/admin">Admin</a>' : ''}
      <form method="post" action="/api/auth/logout" class="inline">
        <button type="submit" class="linkish">Log out</button>
      </form>`
    : `
      <a href="/waitlist">Waitlist</a>
      <a href="/login">Log in</a>
      <a class="btn btn-sm" href="/signup">Sign up</a>`;

  const flash = opts.flash
    ? `<div class="flash" role="status">${escapeHtml(opts.flash)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)} · Undate</title>
  <meta name="description" content="Undate — intentional, agentic AI matchmaking. No swiping." />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#000"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="#d27a89" font-family="Georgia,serif">U</text></svg>`,
  )}" />
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/">Undate</a>
    <nav class="nav">${nav}</nav>
  </header>
  ${flash}
  <main>${opts.body}</main>
  <footer class="site-footer">
    <p>Intentional matchmaking · Powered by Cloudflare Workers + D1</p>
  </footer>
</body>
</html>`;
}

export function homePage(): string {
  return `
  <section class="hero grain">
    <p class="eyebrow">Intentional · Agentic · Curated</p>
    <h1 class="display">UnSwipe.<br/><span class="rose">UnLimit.</span><br/>UnDate.</h1>
    <p class="lede">Not a swiping app — the antithesis of one. Your AI agent runs the matchmaking; you meet people worth meeting.</p>
    <div class="cta-row">
      <a class="btn" href="/waitlist">Request access</a>
      <a class="btn btn-ghost" href="/about">How it works</a>
    </div>
    <div class="stats">
      <div><strong>One</strong><span>considered introduction at a time</span></div>
      <div><strong>Zero</strong><span>swipes, feeds or like counts</span></div>
      <div><strong>Real</strong><span>chemistry, judged before you meet</span></div>
    </div>
  </section>
  <section class="section">
    <h2>How Undate works</h2>
    <ol class="steps">
      <li><span>01</span><div><h3>Request access</h3><p>Every member is considered, not automatic.</p></div></li>
      <li><span>02</span><div><h3>Meet your matchmaker</h3><p>A short conversation. Your agent learns how you connect.</p></div></li>
      <li><span>03</span><div><h3>Your agent runs the room</h3><p>Mock dates against the pool — filtering mismatches quietly.</p></div></li>
      <li><span>04</span><div><h3>Meet your match</h3><p>One curated introduction, with why you clicked.</p></div></li>
    </ol>
  </section>
  <section class="section band">
    <h2>Personality first</h2>
    <p class="lede narrow">We match on attachment, values, goals, and how you talk — not filters and feeds.</p>
    <a class="btn" href="/signup">Create an account</a>
  </section>`;
}

export function aboutPage(): string {
  return `
  <section class="section">
    <h1>How Undate works</h1>
    <p class="lede">Deep psychological profiling with hand-curated introductions. Your AI agent subtracts who would never work so the match you receive is one you could not have ruled out yourself.</p>
    <div class="cards">
      <article class="card"><h3>Hand curated</h3><p>Every introduction can be reviewed. AI helps matchmakers; it never replaces judgment.</p></article>
      <article class="card"><h3>Personality first</h3><p>Big Five, attachment, values, conversation style — signal that survives a first date.</p></article>
      <article class="card"><h3>Private by design</h3><p>No public like counts. Only your match sees what they need.</p></article>
    </div>
  </section>`;
}
