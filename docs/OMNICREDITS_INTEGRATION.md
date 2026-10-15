# OMNICREDITS — Cross-project integration plan (2026-10-16)

Status: **APPROVED CONCEPT / NOT IMPLEMENTED OR DEPLOYED**. This document does not authorize production changes.

## Product
OMNICREDITS is a shared prepaid credit wallet across OMNIVERSE, with ONYX PAY handling fiat top-ups through supported processors (Comgate / Stripe / PayPal only when configured and verified). A single authenticated user can use credits across integrated services, subject to tenant, region, currency and product eligibility. Direct fiat checkout remains the default for ordinary purchases (OHORAI, Do Itálie, Katastr Online). Credits are for metered digital/AI consumption, not a universal replacement for payments.

## Rollout priority
- **P0:** OMNIVIDEO+ — video generation, rendering, dubbing, upscale; OMNIFORGE — image generation, AI tools, automations.
- **P1:** QAPRO / QAgent — AI test runs, reports; ONYXWEB — AI site generation and edits; iBOTS — AI messages and voice usage.
- **P2:** Human Design — optional premium AI readings; OMNISHOPPER — opt-in loyalty rewards (not cash equivalents).
- **Keep direct checkout:** OHORAI, Do Itálie, Katastr Online; any future credit bonuses require explicit product, legal and financial review.

## Architecture
ONYX PAY owns payment initiation, provider callback validation and top-up reconciliation. OMNICREDITS owns an append-only double-entry ledger, balances derived from ledger, per-user/per-tenant authorization, product-specific usage metering, pricing version, and auditable reserve -> capture -> release/refund lifecycle. Never trust client-side balances or provider callbacks without signature verification and idempotency. Separate promotional credits from purchased credits; define expiry, refunds, tax/accounting and transferability rules before launch. Do not expose cash redemption or peer-to-peer transfers without regulatory review.

## AI economics
Publish per-operation credit estimates before confirmation; meter actual usage; apply provider cost ceilings, margin-aware routing, rate limits, concurrency limits and anti-abuse controls. Failed operations release reserved credits; provider retry must not double charge. Define free/paid/subscription tiers and auto-refill as opt-in only.

## Release gates
1. Resolve OMNICREDITS PR #83 CI failure (production-gate pnpm setup JSON parse failure); full CI green, not just specialized checks.
2. Ledger migration and backups, idempotency/concurrency/refund/chargeback and authorization tests; replay provider callbacks.
3. Staging end-to-end top-up -> balance -> reservation -> successful AI job -> capture, plus failed job -> refund and cross-project usage.
4. Verify ONYX PAY callback, real fulfillment and reconciled accounting. Synthetic test transactions are NOT customer revenue.
5. Prepare design preview, risks, expected impact, QA evidence, rollback plan and owner approval before any major production rollout.

## Links
- OMNICREDITS PR: https://github.com/pejtr/OPTIMATEO/pull/83
- ONYX PAY repository: https://github.com/pejtr/OPTIMATEO
- OMNIVIDEO+ repository: https://github.com/pejtr/video-factory
- OMNIFORGE repository: https://github.com/pejtr/omniforge

## Repository scope
This copy belongs to **pejtr/humandesignchart**; integration work must be scoped to this project's actual APIs and release pipeline.
