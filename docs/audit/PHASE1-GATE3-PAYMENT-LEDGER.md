# Phase 1 Gate 3 — Payment event and entitlement ledger

## Scope and trust boundary

Stripe and Comgate now normalize verified provider data into one server-owned payment event contract. Client price, currency and product data are not used for fulfillment. The canonical offer is resolved from `server/payments/offers.ts`.

Stripe promotion codes are supported safely: `amount_subtotal` must equal the canonical offer while `amount_total` records the discounted paid amount. Comgate has no promotion path here, so its verified status amount must equal the canonical offer.

## Replay and transaction model

- `payment_events` has a unique `(provider, eventId)` key.
- A row is selected `FOR UPDATE` inside the same database transaction as entitlement and affiliate mutations.
- `entitlement_ledger` has a unique `(paymentEventId, entitlementKey)` key.
- A terminal `fulfilled`, `audit` or `reversed` event is never fulfilled again.
- A failed transaction rolls back its claim and all business mutations. The failure is then recorded outside the failed transaction and a later delivery can retry it.
- Affiliate conversions link to `paymentEventId` with a unique key, preventing duplicate commission.

Replay tests cover one delivery, two sequential deliveries, ten concurrent deliveries, Stripe, Comgate, rollback/retry, amount mismatch and refund replay.

## Audit states

Malformed or unmatchable provider events are retained with `status=audit` and a structured code. Examples include missing user/product/payment reference, canonical offer mismatch, unknown original payment and partial Stripe refunds.

## Compensation model

Full Stripe refunds, Stripe chargebacks and Comgate cancellations locate the original fulfilled purchase by provider payment reference. Unused credits, PDF credits, unredeemed vouchers, active subscription state and unpaid affiliate commission are compensated transactionally. Redeemed vouchers, paid affiliate commissions and EUR affiliate conversions require manual review instead of unsafe automatic mutation.

## Migration and release hold

Migration `drizzle/0017_numerous_william_stryker.sql` was generated but **not applied**. Production schema and migration journal state have not been independently inspected in this task, so applying it would violate the Gate 3 stop condition.

### Forward plan

1. Take a production database backup and record its checksum/location.
2. Verify the applied Drizzle migration journal ends at `0016_greedy_scream`.
3. Confirm no tables named `payment_events` or `entitlement_ledger` and no `affiliateConversions.paymentEventId` column already exist.
4. Apply `0017` in a maintenance window.
5. Verify both unique constraints and run synthetic signed webhook fixtures without a real payment.
6. Deploy application code only after schema verification succeeds.

### Rollback/recovery plan

- Before application deployment: if migration fails, restore the backup or drop only partially created Gate 3 objects after comparing them with `0017`.
- After application deployment but before real events: roll back application first, then drop the two new tables and `affiliateConversions.paymentEventId`/unique key if required.
- After real payment events exist: do **not** drop ledger data. Roll application forward, replay provider events, and reconcile `payment_events`, `entitlement_ledger`, user balances and affiliate conversions from an export.
- Never retry a partially applied migration blindly; inspect schema objects and the migration journal first.

## Explicit non-actions

- No production migration was run.
- No real Stripe or Comgate payment was created.
- No provider dashboard settings were changed.
