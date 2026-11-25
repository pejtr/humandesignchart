# HUMAN DESIGN DAILY — MCP + optional daily email (CZ / EN)

## Current implementation and boundaries
This PR introduces a read-only stateless Streamable HTTP MCP endpoint, /mcp, on the existing Pages project humandesignchart-web. It is disabled unless HD_DAILY_MCP_ENABLED=true; do not advertise or enable it in production before isolated preview, security and client compatibility checks. It shares the existing ephemeris, gate wheel and Prague calendar-day helpers. Cache the public snapshot per Prague day; there is no chargeable model call or customer-data lookup in these two tools.

- get_daily_chart: 13 calculated planetary positions with gates, lines, day, timezone and timestamp.
- get_daily_reading: localized symbolic gate themes, reflection prompt and optional comparison with explicitly supplied natal gate numbers. An agent can synthesize a longer reading from those facts. No natal birth details, account IDs, tokens or email addresses accepted.
- Customer MCP is never the old internal LEADOS stdio bridge. No CRM, D1 writes, checkout, fulfillment, mail sends or payment tools exposed.
- Use a fixed Prague-day snapshot, not the current instant. With the feature flag enabled, /api/daily-agent/today and the daily-transit page use the same snapshot as MCP and service email. The legacy page remains the disabled-feature fallback; compare existing personalized readings before switching.
- No claim that Human Design predicts outcomes or is medically/scientifically validated.

## Client compatibility / daily delivery
Target URL after verified release: https://humandesignchart.app/mcp (also CZ storefront).
Test initialize, tools/list, tools/call in MCP Inspector and in actual supported ChatGPT, Claude and Gemini clients. Client plan/region/permissions vary; for ChatGPT use the supported remote custom app or approved published plugin path. For Claude add remote custom connector; for Gemini validate custom MCP app support or Gemini CLI HTTP transport. Never promise every plan or app has custom MCP support.
MCP is on-demand; adding the connection does not by itself schedule daily delivery to any chat. The client or a user-authorized OMNION scheduled job must call the tool daily. Do not add a task to a user's account merely because they connect.

## P1 — account-bound private agent integration
Reuse verified Google sign-in for identity, but implement dedicated MCP OAuth authorization with scoped, revocable tokens (not Google credentials or browser session cookies). Verify audience, expiry, issuer, PKCE and tenant/owner authorization. Public MCP remains public read-only; separately protect private tools get_my_chart, get_my_daily_reading and get_my_entitlement. Resolve owner from verified token, never supplied userId/email. Return only selected chart fields, never raw birth data by default. Deny cross-account access. Use explicit consent before sending derived chart information to an external agent. Account-bound functionality is NOT implemented in the public pilot.

## P1 — optional daily email (code implemented, production disabled)
The new Pages endpoints and dashboard preferences use the verified Google session. A separate Cloudflare cron Worker sends general daily themes, not private natal readings. No marketing subscription is created; PR #104 remains a separate five-message confirmed opt-in nurture campaign.
- Current pilot: one message per day around 08:00 Europe/Prague, CS/EN chosen from the storefront, OFF by default. User can copy a prompt with selected gate numbers into their own agent; private account-bound MCP, personal scheduled email and arbitrary delivery times are not part of this release.
- Dedicated database binding HD_DAILY_EMAIL_DB, migration migrations/daily-agent/0001_daily_delivery.sql. Never apply this migration to optimateo-paygate or the OAuth/customer DB. The Pages app and scheduled worker must bind to the same dedicated daily database.
- The scheduled worker entrypoint is workers/daily-agent-email-cron.ts, configuration template wrangler.daily-delivery.example.toml. Both services default disabled. Create separate isolated test bindings and test sender first. Use existing verified Brevo sender and secrets, never log secret values.
- A 15-minute cron runs only in the Prague 08:00 hour, with 20 candidates per tick and a durable ceiling of 80 daily claims. Atomic user/day claim prevents repeat sends; check opt-out immediately before sending. Provider accepted (SENT) is not proven inbox delivery. UNKNOWN requires operator reconciliation, never automatic resend; failures are not retried during this pilot.
- Verify stored email is still authorized, account deletion/address change reconciliation, provider suppression handling, and retention before enabling real recipients. Old unsubscribe links must remain effective for their intended recipient. Verify these in preview; no historical users are auto-enrolled.
- Set HD_DAILY_MCP_ENABLED=true only in isolated preview for client checks. Configure HD_DAILY_EMAIL_ENABLED=true only in isolated preview with dedicated D1, a controlled seed recipient and verified sending identity. Production remains disabled until the tests below and operational cost review pass. No GitHub Actions production deployment.
- No real emails have been sent by this change. Email preference updates, opt-out and cron have deterministic tests; provider delivery and browser integration require actual preview verification.

## Revenue policy
Keep the free funnel and existing Blueprint as P0. Free public daily chart and deterministic reading have no per-call LLM bill, but still incur Cloudflare request/CPU costs. Use Cloudflare rate limiting before enabling; avoid arbitrary high rate requests, bound payload and concurrent work. Measure call counts and costs with no personal arguments in logs. Propose HUMAN DESIGN+ daily personal reports, saved charts and optional delivery; pricing and ONYX CREDIT/entitlement are not configured here. If using generated AI premium readings, check entitlement before generating, cache by owner/day/locale/entitlement and set a hard cost budget; do not deduct credits for failed calls. No recurring billing or new charges without a validated price/offer.
Track agent-originated visits only through privacy-safe source links, confirmed email subscriptions, paid order, delivery and contribution margin. Never fabricate conversion events.

## Release acceptance
1. pnpm check, full Vitest and build:cloudflare; confirm SDK browser-target bundle works and is within actual CF upload limits. Test with real MCP Inspector.
2. Isolated Pages preview only; enable feature flag there, verify JSON-RPC initialize, tools/list, tools/call and notifications; test clients, reject foreign origins and oversized requests, enforce Cloudflare edge rate limits. Verify no account/lead tools and no private cache/log data.
3. Confirm existing calculator/AI guide, login/session, sitemap/SEO smoke and Blueprint checkout still work. No new deploy until existing revenue release gates are satisfied.
4. Deploy only through authorized Cloudflare-only release with --no-bundle and rollback evidence; check public endpoint before advertising. The discovery file and customer-facing connector page expose MCP only when the flag is enabled. Confirm /llms.txt and public endpoint together after the approved release.
5. Verify separate email opt-in and daily delivery before marketing the email feature.
