# PR #87 preview validation implementation plan

**Goal:** Repair the failing navigation contract and collect isolated preview evidence without merge, production deployment, OAuth or checkout changes.

**Architecture:** Keep application behavior unchanged. Repair the existing regression test; replace the coupled release entry point with a preview-only runner and strengthen the existing evidence capture.

**Constraints:** Existing PR branch only; no production deploy, merge, auth/payment changes, live transactions or WhatsApp messages. Cloudflare preview requires verified empty backend bindings/secrets. Missing credentials or actual WhatsApp evidence remain explicit blockers.

- [ ] Reproduce the current failing Vitest contract, repair marker checks and verify absent markers cannot pass.
- [ ] Test preview hostname, deployment isolation and PNG contracts before adding a preview-only runner. Reject all release/unknown flags before any side effect.
- [ ] Collect bilingual OG HTTP evidence for both crawler UAs; extend browser captures with open-menu, keyboard and genuine scroll checks.
- [ ] Run TypeScript, the complete Vitest suite, Cloudflare build and local browser QA; inspect generated images and screenshots.
- [ ] Commit and push to the existing Draft PR only after checks. Record exact SHA and all remaining remote/WhatsApp evidence gaps.
- [ ] Deploy only if authorized Cloudflare credentials and preview isolation checks succeed; stop after preview evidence. Never promote this build automatically.
