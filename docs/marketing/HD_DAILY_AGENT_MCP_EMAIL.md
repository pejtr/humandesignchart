# HUMAN DESIGN DAILY — MCP + optional daily email (CZ / EN)

## Current implementation and boundaries
This PR introduces a read-only stateless Streamable HTTP MCP endpoint, /mcp, on the existing Pages project humandesignchart-web. It is disabled unless HD_DAILY_MCP_ENABLED=true; do not advertise or enable it in production before isolated preview, security and client compatibility checks. It shares the existing ephemeris, gate wheel and Prague calendar-day helpers. Cache the public snapshot per Prague day; there is no chargeable model call or customer-data lookup in these two tools.

- get_daily_chart: 13 calculated planetary positions with gates, lines, day, timezone and timestamp.
- get_daily_reading: localized symbolic gate themes, reflection prompt and optional comparison with explicitly supplied natal gate numbers. An agent can synthesize a longer reading from those facts. No natal birth details, account IDs, tokens or email addresses accepted.
- Customer MCP is never the old internal LEADOS stdio bridge. No CRM, D1 writes, checkout, fulfillment, mail sends or payment tools exposed.
- Use a fixed Prague-day snapshot, not the current instant; reconcile legacy daily-transit UI and mail with this same calculation in a follow-up. The old Node router's wheel wrapping and channel list differ from the canonical calculator; compare before switching.
- No claim that Human Design predicts outcomes or is medically/scientifically validated.

## Client compatibility / daily delivery
Target URL after verified release: https://humandesignchart.app/mcp (also CZ storefront).
Test initialize, tools/list, tools/call in MCP Inspector and in actual supported ChatGPT, Claude and Gemini clients. Client plan/region/permissions vary; for ChatGPT use the supported remote custom app or approved published plugin path. For Claude add remote custom connector; for Gemini validate custom MCP app support or Gemini CLI HTTP transport. Never promise every plan or app has custom MCP support.
MCP is on-demand; adding the connection does not by itself schedule daily delivery to any chat. The client or a user-authorized OMNION scheduled job must call the tool daily. Do not add a task to a user's account merely because they connect.

## P1 — account-bound private agent integration
Reuse verified Google sign-in for identity, but implement dedicated MCP OAuth authorization with scoped, revocable tokens (not Google credentials or browser session cookies). Verify audience, expiry, issuer, PKCE and tenant/owner authorization. Public MCP remains public read-only; separately protect private tools get_my_chart, get_my_daily_reading and get_my_entitlement. Resolve owner from verified token, never supplied userId/email. Return only selected chart fields, never raw birth data by default. Deny cross-account access. Use explicit consent before sending derived chart information to an external agent. Account-bound functionality is NOT implemented in the public pilot.

## P1 — optional daily email (not live)
Reuse Brevo and the existing user preference concept from server/jobs/dailyTransit.ts. The existing scheduler depends on a Node process and MySQL; a Cloudflare Pages direct upload does not prove it runs. Do not run two schedulers for the same user.
- Account UI: daily delivery off by default, choose agent/on-demand, email, or both; locale and preferred time/timezone; separate marketing opt-in and unsubscribe. Verify email ownership. No daily messages for historical leads merely because they subscribed to the 5-day nurture course (PR #104).
- Schedule with one existing authorized OMNION job or a dedicated Cloudflare scheduled Worker, not a new SaaS. Before release verify actual D1 account/preference/entitlement mapping; use an additive reviewed schema if needed, never mutate the shared payment tables.
- One durable queue record per user+day+channel+locale; atomic claim and retry, suppress duplicates across retries and daylight-saving changes, respect revoked permission before sending. Use the same daily snapshot for MCP and email. Email contains date, major transit themes, optional concise personal reflection and link to the secure daily page; never include raw birth details, chart identifier or private data in URLs.
- Check provider quota, verified sender, delivery, opt-out and cost; no marketing if only service notification selected. Use separately opted-in marketing templates to offer paid Blueprint. Verify with seed inboxes only before enabling real recipients.
- Email scheduler, preferences, Brevo workflow and delivery integration are deferred pending actual production access and schema audit. No new email is sent by this PR.

## Revenue policy
Keep the free funnel and existing Blueprint as P0. Free public daily chart and deterministic reading have no per-call LLM bill, but still incur Cloudflare request/CPU costs. Use Cloudflare rate limiting before enabling; avoid arbitrary high rate requests, bound payload and concurrent work. Measure call counts and costs with no personal arguments in logs. Propose HUMAN DESIGN+ daily personal reports, saved charts and optional delivery; pricing and ONYX CREDIT/entitlement are not configured here. If using generated AI premium readings, check entitlement before generating, cache by owner/day/locale/entitlement and set a hard cost budget; do not deduct credits for failed calls. No recurring billing or new charges without a validated price/offer.
Track agent-originated visits only through privacy-safe source links, confirmed email subscriptions, paid order, delivery and contribution margin. Never fabricate conversion events.

## Release acceptance
1. pnpm check, full Vitest and build:cloudflare; confirm SDK browser-target bundle works and is within actual CF upload limits. Test with real MCP Inspector.
2. Isolated Pages preview only; enable feature flag there, verify JSON-RPC initialize, tools/list, tools/call and notifications; test clients, reject foreign origins and oversized requests, enforce Cloudflare edge rate limits. Verify no account/lead tools and no private cache/log data.
3. Confirm existing calculator/AI guide, login/session, sitemap/SEO smoke and Blueprint checkout still work. No new deploy until existing revenue release gates are satisfied.
4. Deploy only through authorized Cloudflare-only release with --no-bundle and rollback evidence; check public endpoint before advertising. Only after verified preview and production enablement update llms.txt and customer-facing connector links; current discovery file correctly does not claim live MCP.
5. Verify separate email opt-in and daily delivery before marketing the email feature.
