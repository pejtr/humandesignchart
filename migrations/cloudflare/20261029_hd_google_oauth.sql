-- P0 Google sign-in for Cloudflare Pages (BOTH Human Design domains).
-- Apply manually to the existing bound D1 database *before* enabling OAuth.
-- Additive only. NEVER drop, rename, truncate or migrate the legacy user/payment tables.
-- HUMAN GATE: confirm the production D1 binding and backup/checkpoint first.

CREATE TABLE IF NOT EXISTS hd_oauth_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hd_oauth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES hd_oauth_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hd_oauth_sessions_user ON hd_oauth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hd_oauth_sessions_expiry ON hd_oauth_sessions(expires_at);
