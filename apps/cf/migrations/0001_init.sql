-- Undate D1 schema (MVP: waitlist, auth, profiles, matches, admin)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITLIST', -- WAITLIST | ACTIVE | BANNED
  is_admin INTEGER NOT NULL DEFAULT 0,
  region TEXT NOT NULL DEFAULT 'SG',
  city TEXT,
  age INTEGER,
  gender TEXT,
  relationship_goal TEXT DEFAULT 'SERIOUS_DATING',
  attachment TEXT DEFAULT 'UNKNOWN',
  wants_kids TEXT DEFAULT 'UNKNOWN',
  communication_style TEXT,
  mbti TEXT,
  openness REAL,
  conscientiousness REAL,
  extraversion REAL,
  agreeableness REAL,
  neuroticism REAL,
  bio TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  city TEXT,
  region TEXT NOT NULL DEFAULT 'SG',
  referral_code TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING', -- WAITING | INVITED | ACCEPTED
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_uq ON waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist(status);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_uq ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL,
  user_b_id TEXT NOT NULL,
  score REAL NOT NULL,
  breakdown_json TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PROPOSED', -- PROPOSED | DELIVERED | MUTUAL | PASSED
  narrative TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS matches_a_idx ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS matches_b_idx ON matches(user_b_id);
