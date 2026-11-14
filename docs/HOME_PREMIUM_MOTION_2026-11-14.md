# Home Premium Motion Pilot — 2026-11-14

Source: user-provided "The Claude Guide: Create Stunning Website Animations", doc id `1Pb9EPx4_0GkmnnyoVQcI9Nb67LuJLPLB`.

## Implementation scope
- Add a subtle, one-shot headline/description reveal to the existing `HomeWow.css` landing hero.
- CTA remains visible/clickable throughout; its destination, text, signup, OAuth and checkout are unchanged.
- Keyboard focus ring for primary and secondary actions, instant static version when users request reduced motion.
- Existing continuously rotating orbit artwork is unchanged; do not stack extra scroll observers or libraries.

## Acceptance gates (all unchecked)
- [ ] pnpm check, pnpm test, pnpm build:cloudflare on exact PR SHA.
- [ ] Cloudflare preview created and tested 360/390/768/1440px, keyboard and touch.
- [ ] Reduced-motion emulation and real device verify CTA visible immediately.
- [ ] Verify LCP/CLS/INP do not regress; compare with current production baseline.
- [ ] Existing OAuth, paid checkout, email and WhatsApp/OG release gates remain independent, especially draft PRs #87 and #90.
- [ ] Human review before any merge/Cloudflare production deploy.

**SOURCE CHANGE ONLY. NO QA PASS, NO MERGE, NO DEPLOY.**
