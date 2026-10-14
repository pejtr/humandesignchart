# Human Design P0 repair plan — 2026-10-13

## A. Funnel and pricing
- [x] Read-only Blueprint catalog exists in Cloudflare Worker.
- [ ] Verify checkout tracking fires only when provider checkout URL is created.
- [ ] Add tests for failed checkout and success redirect.

## B. Authenticated checkout
- [ ] Verify Cloudflare-compatible identity; never trust client-supplied user IDs.
- [ ] Create checkout using server catalog prices, idempotency and allowlisted redirects.
- [ ] Confirm ONYX PAY, Stripe and Comgate merchant contracts and callback URLs.

## C. Paid fulfillment
- [ ] Verify provider-signed callbacks and deduplicate events.
- [ ] Grant purchased content only after confirmed payment; test replay and retries.
- [ ] Keep real customer revenue separate from tests and mock payments.

## D. Release gate
- [ ] Pass typecheck, tests, Cloudflare build and end-to-end sandbox purchase.
- [ ] Review legal/GDPR, refunds and cancellation copy.
- [ ] Present production diff, risks, QA evidence and rollback for explicit approval.

No production deployment or revenue-ready claim before B–D pass.
