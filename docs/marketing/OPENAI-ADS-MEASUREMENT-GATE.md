# Human Design — OpenAI Ads revenue measurement gate

## Objective
Independent, first-party measurement with **server-confirmed purchases**, not a
blind Pixel event on the browser redirect. This is a prerequisite for paid ads.
Keep CZ and EN prices, currencies, spending and conversion attribution separate.

## Current architecture
- Marketing consent: `hd-cookie-consent` (marketing=true and accepted=true).
- Browser: `useOpenAIAdsPixel.ts`, OpenAI Pixel SDK, page and content events after consent.
- Click attribution: `oppref` retained **only after marketing consent**, session-scoped.
- Checkout: `openAIAdsMarketingConsent` and `openAIAdsOppref` included in
  Stripe Checkout Session metadata (no birth data, user identifiers or email).
- Purchase: signed Stripe webhook -> idempotent payment ledger -> `fulfilled`
  -> `order_created` sent by server via OpenAI Conversions API.
- Monetary value: **actual `session.amount_total` in minor units**, with actual
  currency. Dedup event id: Stripe Checkout Session ID.
- Browser `PaymentSuccess`: may emit `payment_return_viewed` to GA4 but
  **never** `Purchase` or `order_created`. Return URL is not proof of payment.
- Meta CAPI from this code path also needs captured marketing consent.
- OmniAds: article in-text plus footer banner, consent-aware, no checkout ads.

## Admin setup in ads.openai.com (account: Human Design Mapa)
1. Settings -> Conversions: create **Web data source** for `humandesignmapa.cz`.
   Retrieve the real Pixel ID. Only one accessible advertiser account is
   currently connected, with currency CZK; EN requires deliberate locale
   segmentation and budget/price FX reporting.
2. Create standard **Order Created** conversion event setting for that source,
   attribution window 30 days. Optionally add Registration Completed as a
   secondary funnel diagnostic, not the primary purchase optimization.
3. Provision a separate Conversions API key for that account.
4. Set `VITE_OPENAI_ADS_PIXEL_ID` at **frontend build time**, and
   `OPENAI_ADS_PIXEL_ID` + `OPENAI_CONVERSIONS_API_KEY` as **server-only**
   deployment secrets. NEVER put API key in `VITE_*`, git, browser or logs.
5. Rebuild/redeploy frontend. Run a real consented **test** checkout via the
   confirmed billing backend and verify pixel/Conversions API event receipts.
   Do not report a synthetic purchase as revenue.
6. Confirm billing back-end actually serves `/api/trpc/subscription.blueprintOffer`,
   `/api/trpc/subscription.createCheckout`, login, and signed webhooks,
   including Comgate. As of 2026-10-13, both public Cloudflare domains return
   **404** for subscription procedures. Until a working backend is deployed,
   the entire paid-ads **release gate FAILS** regardless of static HTTP 200s.
7. Full E2E: landing -> chart calculation -> registration -> checkout ->
   verified payment -> entitlement -> one conversion -> refund/reversal tests.
   Capture exact event counts and compare to server ledger. Confirm conversion
   settings connected to campaigns before bidding for conversions.
8. Explicitly validate CZ Comgate integration and consent propagation before
   enabling Comgate CAPI. The current partial migration does not make
   Comgate purchase reporting complete.

## Profitability / ROI reporting
Use sales net of refunds, fees, fulfilment and taxes where applicable, minus
ad spend. Distinguish ROAS (revenue / spend) from ROI (profit / spend).
For ROI >= 444%, contribution margin before ads / ad spend must exceed 5.44.
Use confirmed sales only; never infer a conversion from Pixel pageviews.

## Safety
- Ad spend stays paused until production purchase E2E and conversion receipts PASS.
- No imported raw birth data, health or personal profile data to any ad platform.
- Consent rejection or revocation stops browser tracking immediately.
- If a server purchase transmission fails, record an error; payment fulfilment
  must continue. Durable retry/outbox is a follow-up before claiming 100%
  delivery reliability.
