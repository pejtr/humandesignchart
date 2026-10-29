-- Cloudflare D1 migration: Google OAuth user records.
-- Run against the SAME D1 binding used by Pages (HD_ORDERS or DB), in preview
-- before production. Separate table prevents touching legacy customer records.
CREATE TABLE IF NOT EXISTS hd_auth_users (
  id TEXT PRIMARY KEY NOT NULL,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_signed_in TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hd_auth_users_email ON hd_auth_users(email);
