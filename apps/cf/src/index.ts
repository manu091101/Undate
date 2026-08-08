import { Hono } from 'hono';
import type { Env } from './lib/db';
import {
  activateUser,
  createUser,
  getUserByEmail,
  getUserById,
  getWaitlistByEmail,
  insertWaitlist,
  inviteWaitlist,
  listActiveUsers,
  listWaitlist,
  matchesForUser,
  upsertMatch,
  userToFeatures,
} from './lib/db';
import {
  clearSessionCookieHeader,
  hashPassword,
  parseCookie,
  randomId,
  SESSION_COOKIE,
  sessionCookieHeader,
  signSession,
  verifyPassword,
  verifySession,
  type SessionClaims,
} from './lib/auth';
import { explainTopAxes, rank } from './lib/matching';
import { aboutPage, escapeHtml, homePage, layout } from './lib/html';

type AppEnv = { Bindings: Env; Variables: { session: SessionClaims | null } };

const app = new Hono<AppEnv>();

function jwtSecret(env: Env): string {
  return env.JWT_SECRET || 'dev-only-undate-jwt-secret-min-32-chars-xx';
}

function isSecure(c: { req: { url: string } }): boolean {
  return new URL(c.req.url).protocol === 'https:';
}

async function loadSession(c: { env: Env; req: { header: (n: string) => string | undefined } }): Promise<SessionClaims | null> {
  const token = parseCookie(c.req.header('Cookie') ?? null, SESSION_COOKIE);
  if (!token) return null;
  return verifySession(token, jwtSecret(c.env));
}

app.use('*', async (c, next) => {
  c.set('session', await loadSession(c));
  await next();
});

// ── Health ──────────────────────────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'undate', runtime: 'cloudflare-workers', d1: true }),
);

// ── Waitlist API ────────────────────────────────────────────────────────
app.post('/api/waitlist', async (c) => {
  let body: { email?: string; city?: string; region?: string; referralCode?: string };
  const ct = c.req.header('content-type') || '';
  if (ct.includes('application/json')) {
    body = await c.req.json().catch(() => ({}));
  } else {
    const fd = await c.req.parseBody();
    body = {
      email: String(fd.email || ''),
      city: String(fd.city || ''),
      region: String(fd.region || 'SG'),
      referralCode: String(fd.referralCode || ''),
    };
  }
  const email = (body.email || '').trim().toLowerCase();
  const region = (body.region || 'SG').toUpperCase().slice(0, 8);
  const result = await insertWaitlist(c.env.DB, {
    id: randomId('w'),
    email,
    city: body.city,
    region: region || 'SG',
    referral_code: body.referralCode || undefined,
  });
  if (!result.ok) {
    if (ct.includes('application/json')) {
      return c.json({ ok: false, error: result.error }, result.error === 'invalid_email' ? 400 : 409);
    }
    return c.redirect(`/waitlist?error=${encodeURIComponent(result.error)}`);
  }
  if (ct.includes('application/json')) {
    return c.json({ ok: true, email });
  }
  return c.redirect('/waitlist?ok=1');
});

app.get('/api/waitlist/check', async (c) => {
  const email = (c.req.query('email') || '').trim().toLowerCase();
  if (!email) return c.json({ ok: false, error: 'email_required' }, 400);
  const row = await getWaitlistByEmail(c.env.DB, email);
  return c.json({ ok: true, found: !!row, status: row?.status ?? null });
});

// ── Auth API ────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (c) => {
  let body: {
    email?: string;
    password?: string;
    displayName?: string;
    city?: string;
    region?: string;
    age?: number | string;
    gender?: string;
  };
  const ct = c.req.header('content-type') || '';
  if (ct.includes('application/json')) {
    body = await c.req.json().catch(() => ({}));
  } else {
    const fd = await c.req.parseBody();
    body = {
      email: String(fd.email || ''),
      password: String(fd.password || ''),
      displayName: String(fd.displayName || ''),
      city: String(fd.city || ''),
      region: String(fd.region || 'SG'),
      age: String(fd.age || ''),
      gender: String(fd.gender || ''),
    };
  }
  const password = body.password || '';
  if (password.length < 8) {
    if (ct.includes('application/json')) return c.json({ ok: false, error: 'password_too_short' }, 400);
    return c.redirect('/signup?error=password_too_short');
  }
  const password_hash = await hashPassword(password);
  const id = randomId('u');
  const ageNum = body.age != null && body.age !== '' ? Number(body.age) : undefined;
  const created = await createUser(c.env.DB, {
    id,
    email: body.email || '',
    password_hash,
    display_name: body.displayName || '',
    region: (body.region || 'SG').toUpperCase(),
    city: body.city,
    age: Number.isFinite(ageNum) ? ageNum : undefined,
    gender: body.gender,
  });
  if (!created.ok) {
    if (ct.includes('application/json')) return c.json({ ok: false, error: created.error }, 400);
    return c.redirect(`/signup?error=${encodeURIComponent(created.error)}`);
  }
  // Auto-activate first-wave members for demo (status WAITLIST → can still login; dashboard explains)
  const user = await getUserById(c.env.DB, id);
  if (!user) return c.json({ ok: false, error: 'create_failed' }, 500);
  const claims: SessionClaims = {
    sub: user.id,
    email: user.email,
    status: user.status,
    isAdmin: user.is_admin === 1,
    displayName: user.display_name,
  };
  const token = await signSession(claims, jwtSecret(c.env));
  if (ct.includes('application/json')) {
    return c.json(
      { ok: true, user: { id: user.id, email: user.email, status: user.status } },
      201,
      { 'Set-Cookie': sessionCookieHeader(token, isSecure(c)) },
    );
  }
  const res = c.redirect('/dashboard');
  res.headers.set('Set-Cookie', sessionCookieHeader(token, isSecure(c)));
  return res;
});

app.post('/api/auth/login', async (c) => {
  let body: { email?: string; password?: string };
  const ct = c.req.header('content-type') || '';
  if (ct.includes('application/json')) {
    body = await c.req.json().catch(() => ({}));
  } else {
    const fd = await c.req.parseBody();
    body = { email: String(fd.email || ''), password: String(fd.password || '') };
  }
  const user = await getUserByEmail(c.env.DB, body.email || '');
  if (!user || !(await verifyPassword(body.password || '', user.password_hash))) {
    if (ct.includes('application/json')) return c.json({ ok: false, error: 'invalid_credentials' }, 401);
    return c.redirect('/login?error=invalid_credentials');
  }
  const claims: SessionClaims = {
    sub: user.id,
    email: user.email,
    status: user.status,
    isAdmin: user.is_admin === 1,
    displayName: user.display_name,
  };
  const token = await signSession(claims, jwtSecret(c.env));
  if (ct.includes('application/json')) {
    return c.json(
      { ok: true, user: { id: user.id, email: user.email, status: user.status, isAdmin: claims.isAdmin } },
      200,
      { 'Set-Cookie': sessionCookieHeader(token, isSecure(c)) },
    );
  }
  const res = c.redirect(claims.isAdmin ? '/admin' : '/dashboard');
  res.headers.set('Set-Cookie', sessionCookieHeader(token, isSecure(c)));
  return res;
});

app.post('/api/auth/logout', async (c) => {
  const res = c.redirect('/');
  res.headers.set('Set-Cookie', clearSessionCookieHeader(isSecure(c)));
  return res;
});

app.get('/api/auth/me', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ ok: false, user: null }, 401);
  const user = await getUserById(c.env.DB, session.sub);
  if (!user) return c.json({ ok: false, user: null }, 401);
  return c.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      status: user.status,
      isAdmin: user.is_admin === 1,
      city: user.city,
      region: user.region,
    },
  });
});

// ── Matches API ─────────────────────────────────────────────────────────
app.post('/api/matches/generate', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const me = await getUserById(c.env.DB, session.sub);
  if (!me) return c.json({ ok: false, error: 'unauthorized' }, 401);
  if (me.status !== 'ACTIVE' && !me.is_admin) {
    return c.json({ ok: false, error: 'not_active' }, 403);
  }
  const others = (await listActiveUsers(c.env.DB)).filter((u) => u.id !== me.id);
  const ranked = rank(userToFeatures(me), others.map(userToFeatures), 3);
  const results = [];
  for (const r of ranked) {
    const other = others.find((u) => u.id === r.userId)!;
    const axes = explainTopAxes(r.breakdown);
    const narrative =
      axes.length > 0
        ? `Strong signals on ${axes.join(', ')}. Score ${Math.round(r.score * 100)}%.`
        : `Compatible at ${Math.round(r.score * 100)}% on our cold-start ranker.`;
    const matchId = `m_${[me.id, other.id].sort().join('_').slice(0, 60)}`;
    await upsertMatch(c.env.DB, {
      id: matchId,
      userA: me.id,
      userB: other.id,
      score: r.score,
      breakdown: r.breakdown,
      narrative,
    });
    results.push({
      matchId,
      userId: other.id,
      displayName: other.display_name,
      city: other.city,
      score: r.score,
      narrative,
      photoUrl: other.photo_url,
      breakdown: r.breakdown,
    });
  }
  return c.json({ ok: true, matches: results });
});

app.get('/api/matches', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const rows = await matchesForUser(c.env.DB, session.sub);
  return c.json({ ok: true, matches: rows });
});

// ── Admin API ───────────────────────────────────────────────────────────
async function requireAdmin(c: { get: (k: 'session') => SessionClaims | null; env: Env }) {
  const session = c.get('session');
  if (!session?.isAdmin) return null;
  const user = await getUserById(c.env.DB, session.sub);
  if (!user || user.is_admin !== 1) return null;
  return user;
}

app.get('/api/admin/waitlist', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ ok: false, error: 'forbidden' }, 403);
  return c.json({ ok: true, waitlist: await listWaitlist(c.env.DB) });
});

app.post('/api/admin/waitlist/:id/invite', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ ok: false, error: 'forbidden' }, 403);
  const id = c.req.param('id');
  const ok = await inviteWaitlist(c.env.DB, id);
  const ct = c.req.header('content-type') || '';
  if (!ct.includes('application/json') && c.req.header('accept')?.includes('text/html')) {
    return c.redirect(ok ? '/admin?invited=1' : '/admin?error=invite_failed');
  }
  // form posts without json
  if (c.req.header('content-type')?.includes('form')) {
    return c.redirect(ok ? '/admin?invited=1' : '/admin?error=invite_failed');
  }
  return c.json({ ok });
});

app.post('/api/admin/users/:id/activate', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ ok: false, error: 'forbidden' }, 403);
  const id = c.req.param('id');
  const ok = await activateUser(c.env.DB, id);
  if (c.req.header('content-type')?.includes('form') || !c.req.header('content-type')?.includes('json')) {
    // also handle form
  }
  const wantsHtml = (c.req.header('accept') || '').includes('text/html') || (c.req.header('content-type') || '').includes('form');
  if (wantsHtml) return c.redirect(ok ? '/admin?activated=1' : '/admin?error=activate_failed');
  return c.json({ ok });
});

// Form-friendly admin actions
app.post('/admin/invite', async (c) => {
  if (!(await requireAdmin(c))) return c.redirect('/login');
  const fd = await c.req.parseBody();
  const id = String(fd.id || '');
  await inviteWaitlist(c.env.DB, id);
  return c.redirect('/admin?invited=1');
});

app.post('/admin/activate', async (c) => {
  if (!(await requireAdmin(c))) return c.redirect('/login');
  const fd = await c.req.parseBody();
  const id = String(fd.id || '');
  await activateUser(c.env.DB, id);
  return c.redirect('/admin?activated=1');
});

// ── HTML pages ──────────────────────────────────────────────────────────
function page(c: { get: (k: 'session') => SessionClaims | null }, title: string, body: string, flash?: string | null) {
  const s = c.get('session');
  const html = layout({
    title,
    body,
    user: s ? { displayName: s.displayName, isAdmin: s.isAdmin } : null,
    flash,
  });
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  });
}

app.get('/', (c) => page(c, 'Home', homePage()));
app.get('/about', (c) => page(c, 'About', aboutPage()));

app.get('/waitlist', (c) => {
  const ok = c.req.query('ok');
  const err = c.req.query('error');
  const body = `
  <section class="section">
    <h1>Request access</h1>
    <p class="lede">Join the Undate waitlist. We invite in small cohorts so every introduction stays considered.</p>
    ${ok ? '<p class="ok">You are on the list. We will be in touch.</p>' : ''}
    ${err ? `<p class="error">${escapeHtml(err)}</p>` : ''}
    <form class="form" method="post" action="/api/waitlist">
      <label>Email<input required type="email" name="email" placeholder="you@example.com" /></label>
      <label>City<input type="text" name="city" placeholder="Singapore" /></label>
      <label>Region
        <select name="region">
          <option value="SG">Singapore</option>
          <option value="IN">India</option>
          <option value="US">United States</option>
          <option value="EU">Europe</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label>Referral code (optional)<input type="text" name="referralCode" /></label>
      <button class="btn" type="submit">Join waitlist</button>
    </form>
  </section>`;
  return page(c, 'Waitlist', body);
});

app.get('/signup', (c) => {
  const err = c.req.query('error');
  const body = `
  <section class="section">
    <h1>Create account</h1>
    <p class="lede">Start as waitlisted. An admin can activate you for matching.</p>
    ${err ? `<p class="error">${escapeHtml(err)}</p>` : ''}
    <form class="form" method="post" action="/api/auth/signup">
      <label>Display name<input required name="displayName" /></label>
      <label>Email<input required type="email" name="email" /></label>
      <label>Password (min 8)<input required type="password" name="password" minlength="8" /></label>
      <label>City<input name="city" /></label>
      <label>Age<input type="number" name="age" min="18" max="99" /></label>
      <label>Gender
        <select name="gender">
          <option value="WOMAN">Woman</option>
          <option value="MAN">Man</option>
          <option value="NONBINARY">Non-binary</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label>Region
        <select name="region">
          <option value="SG">Singapore</option>
          <option value="IN">India</option>
          <option value="US">US</option>
          <option value="EU">EU</option>
        </select>
      </label>
      <button class="btn" type="submit">Sign up</button>
    </form>
    <p class="hint">Demo admin: founder@undate.local / undate-demo-2026</p>
  </section>`;
  return page(c, 'Sign up', body);
});

app.get('/login', (c) => {
  const err = c.req.query('error');
  const body = `
  <section class="section">
    <h1>Log in</h1>
    ${err ? `<p class="error">${escapeHtml(err)}</p>` : ''}
    <form class="form" method="post" action="/api/auth/login">
      <label>Email<input required type="email" name="email" /></label>
      <label>Password<input required type="password" name="password" /></label>
      <button class="btn" type="submit">Log in</button>
    </form>
    <p class="hint">Demo: founder@undate.local or priya@undate.local · password undate-demo-2026</p>
  </section>`;
  return page(c, 'Log in', body);
});

app.get('/dashboard', async (c) => {
  const session = c.get('session');
  if (!session) return c.redirect('/login?next=/dashboard');
  const user = await getUserById(c.env.DB, session.sub);
  if (!user) return c.redirect('/login');
  const body = `
  <section class="section">
    <h1>Hello, ${escapeHtml(user.display_name)}</h1>
    <p class="lede">Status: <strong>${escapeHtml(user.status)}</strong>${
      user.is_admin ? ' · Admin' : ''
    }</p>
    <div class="cards">
      <article class="card">
        <h3>Your profile</h3>
        <p>${escapeHtml(user.city || '—')} · ${escapeHtml(user.region)} · age ${user.age ?? '—'}</p>
        <p>${escapeHtml(user.bio || 'Complete onboarding in a future release; matching uses seeded traits for demo members.')}</p>
      </article>
      <article class="card">
        <h3>This week</h3>
        <p>Generate a curated shortlist from active members using the literature-grounded ranker.</p>
        <p><a class="btn btn-sm" href="/matches">Open matches</a></p>
      </article>
    </div>
  </section>`;
  return page(c, 'Dashboard', body);
});

app.get('/matches', async (c) => {
  const session = c.get('session');
  if (!session) return c.redirect('/login?next=/matches');
  const me = await getUserById(c.env.DB, session.sub);
  if (!me) return c.redirect('/login');

  // Generate if empty
  let rows = await matchesForUser(c.env.DB, me.id);
  if (rows.length === 0 && (me.status === 'ACTIVE' || me.is_admin)) {
    const others = (await listActiveUsers(c.env.DB)).filter((u) => u.id !== me.id);
    const ranked = rank(userToFeatures(me), others.map(userToFeatures), 3);
    for (const r of ranked) {
      const other = others.find((u) => u.id === r.userId)!;
      const axes = explainTopAxes(r.breakdown);
      const narrative =
        axes.length > 0
          ? `Strong on ${axes.join(', ')}.`
          : `Cold-start score ${Math.round(r.score * 100)}%.`;
      await upsertMatch(c.env.DB, {
        id: `m_${[me.id, other.id].sort().join('_').slice(0, 60)}`,
        userA: me.id,
        userB: other.id,
        score: r.score,
        breakdown: r.breakdown,
        narrative,
      });
    }
    rows = await matchesForUser(c.env.DB, me.id);
  }

  const cards: string[] = [];
  for (const row of rows as Array<Record<string, unknown>>) {
    const a = String(row.user_a_id);
    const b = String(row.user_b_id);
    const otherId = a === me.id ? b : a;
    const other = await getUserById(c.env.DB, otherId);
    if (!other) continue;
    const score = Number(row.score);
    const narrative = String(row.narrative || '');
    const photo = other.photo_url || `https://i.pravatar.cc/600?u=${encodeURIComponent(other.id)}`;
    cards.push(`
      <article class="match-card">
        <img src="${escapeHtml(photo)}" alt="" width="96" height="96" />
        <div>
          <h3>${escapeHtml(other.display_name)} <span class="score">${Math.round(score * 100)}%</span></h3>
          <p>${escapeHtml(other.city || '')} · ${escapeHtml(other.relationship_goal || '')}</p>
          <p>${escapeHtml(narrative)}</p>
        </div>
      </article>`);
  }

  const body = `
  <section class="section">
    <h1>Your matches</h1>
    <p class="lede">One considered shortlist — ranked by attachment, goals, values, and temperament.</p>
    ${
      me.status !== 'ACTIVE' && !me.is_admin
        ? '<p class="error">Your account is not ACTIVE yet. An admin must activate you before matching runs.</p>'
        : ''
    }
    ${cards.length ? cards.join('') : '<p class="hint">No matches yet.</p>'}
    <form method="post" action="/api/matches/generate" id="regen" style="margin-top:1rem">
      <button class="btn btn-ghost" type="button" onclick="fetch('/api/matches/generate',{method:'POST'}).then(()=>location.reload())">Regenerate shortlist</button>
    </form>
  </section>`;
  return page(c, 'Matches', body);
});

app.get('/admin', async (c) => {
  const session = c.get('session');
  if (!session) return c.redirect('/login?next=/admin');
  if (!session.isAdmin) return c.redirect('/dashboard');
  const waitlist = await listWaitlist(c.env.DB);
  const users = await c.env.DB.prepare('SELECT id, email, display_name, status, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 100').all();
  const wRows = waitlist
    .map(
      (w) => `
    <tr>
      <td>${escapeHtml(w.email)}</td>
      <td>${escapeHtml(w.city || '')}</td>
      <td>${escapeHtml(w.region)}</td>
      <td>${escapeHtml(w.status)}</td>
      <td>
        ${
          w.status === 'WAITING'
            ? `<form method="post" action="/admin/invite" class="inline">
                <input type="hidden" name="id" value="${escapeHtml(w.id)}" />
                <button class="btn btn-sm" type="submit">Invite</button>
              </form>`
            : '—'
        }
      </td>
    </tr>`,
    )
    .join('');
  const uRows = (users.results as Array<Record<string, unknown>> | undefined)
    ?.map(
      (u) => `
    <tr>
      <td>${escapeHtml(String(u.display_name))}</td>
      <td>${escapeHtml(String(u.email))}</td>
      <td>${escapeHtml(String(u.status))}</td>
      <td>${u.is_admin ? 'yes' : 'no'}</td>
      <td>
        ${
          u.status !== 'ACTIVE'
            ? `<form method="post" action="/admin/activate" class="inline">
                <input type="hidden" name="id" value="${escapeHtml(String(u.id))}" />
                <button class="btn btn-sm" type="submit">Activate</button>
              </form>`
            : '—'
        }
      </td>
    </tr>`,
    )
    .join('') ?? '';

  const flash =
    c.req.query('invited') ? 'Invite recorded.' : c.req.query('activated') ? 'User activated.' : c.req.query('error') || null;

  const body = `
  <section class="section">
    <h1>Admin</h1>
    <p class="lede">Waitlist curation and member activation.</p>
    <h2>Waitlist</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>Email</th><th>City</th><th>Region</th><th>Status</th><th></th></tr></thead>
      <tbody>${wRows || '<tr><td colspan="5">Empty</td></tr>'}</tbody>
    </table></div>
    <h2 style="margin-top:2rem">Users</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Admin</th><th></th></tr></thead>
      <tbody>${uRows}</tbody>
    </table></div>
  </section>`;
  return page(c, 'Admin', body, flash);
});

// Static assets: fall through to ASSETS binding
app.get('/styles.css', async (c) => {
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    if (res.status === 200) return res;
  }
  // fallback empty
  return c.text('/* missing */', 404);
});

app.notFound(async (c) => {
  // try assets
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    if (res.status !== 404) return res;
  }
  return page(c, 'Not found', `<section class="section"><h1>Not found</h1><p><a href="/">Home</a></p></section>`);
});

export default app;
