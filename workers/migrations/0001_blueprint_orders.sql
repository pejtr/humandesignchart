-- Cloudflare D1: durable, idempotent receipt of verified ONYX PAY events.
-- Receipt is NOT fulfillment: the payment dispatcher must retry until entitlements are issued.
CREATE TABLE IF NOT EXISTS blueprint_payment_receipts (
  event_id TEXT PRIMARY KEY,
  payment_ref TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL CHECK (tenant_id = 'human-design'),
  offer_key TEXT NOT NULL CHECK (offer_key IN ('hd-blueprint-cz','hd-blueprint-en')),
  customer_email TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_DELIVERY' CHECK (status IN ('PENDING_DELIVERY','FULFILLED')),
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_blueprint_receipts_status ON blueprint_payment_receipts(status, received_at);
