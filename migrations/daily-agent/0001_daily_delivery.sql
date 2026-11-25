-- Isolated daily-delivery database only; never apply to shared ONYX PAY.
CREATE TABLE IF NOT EXISTS hd_daily_preferences (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('cs','en')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  unsubscribe_token TEXT NOT NULL UNIQUE,
  consent_version TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS hd_daily_preferences_enabled ON hd_daily_preferences(enabled,user_id);
CREATE TABLE IF NOT EXISTS hd_daily_delivery (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('CLAIMED','SENT','FAILED','UNKNOWN','CANCELLED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,day)
);
