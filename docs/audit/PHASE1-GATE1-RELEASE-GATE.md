# Phase 1 / Gate 1 — trustworthy release gate

Date: 2026-08-14

## Narrative invariant

The release gate protects the existing product journey without adding features:

- the user remains the hero;
- the saved Human Design chart remains the hero's canonical map;
- Marie remains an interpretive guide, never the source of deterministic chart facts.

## Classification of the 15 original QA failures

| # | Failing capability | Classification | Evidence and resolution |
|---|---|---|---|
| 1 | `publicStats.chartCount` | stale mock | The router still calls `countTotalCharts`; the QA DB module mock omitted that exported helper. Added the helper without changing production behavior. |
| 2 | Czech `content.blogList` | stale test | The current router and both clients consume `{ articles, categories }`, not a bare array. Assertions now verify both arrays. |
| 3 | English `content.blogList` | stale test | Same proven contract as the Czech endpoint. |
| 4 | `testimonials.getApproved` | stale mock | The router uses a Drizzle select chain; the mock returned an empty object. Added an in-memory Drizzle-compatible test adapter. |
| 5 | first `composite.analyze` contract | intentional contract change | Production and `CompositeChart.tsx` use `sharedChannels` and `centerCompatibility`; obsolete `shared`/`bridges` assertions were replaced with the active contract. |
| 6 | `newsletter.subscribe` | stale mock | Double opt-in uses Drizzle select/insert chains. The in-memory adapter now persists and filters subscriber rows. |
| 7 | `referral.getInfo` | stale mock | The protected route requires a current user record; the QA mock incorrectly returned `null`. It now returns the authenticated fixture user. |
| 8 | gift voucher check | intentional contract change | The registered namespace and current pricing client are `giftVoucher`; the obsolete `gift` namespace was updated in the test. |
| 9 | `notifications.getAll` | stale mock | The router dynamically imports `db.notifications`; mocking only `db` could never intercept it. Added the correct module mock. |
| 10 | `notifications.getUnreadCount` | stale test and stale mock | The current client consumes `{ count }`; the test expected a number and mocked the wrong module. Both were aligned to the proven contract. |
| 11 | `testimonials.submit` | stale mock | The production mutation uses `insert(...).values(...)`; the adapter now returns a deterministic insert id and preserves pending status. |
| 12 | `testimonials.getStats` | stale mock | The adapter now returns deterministic count and average values for approved fixtures. |
| 13 | multi-chart composite contract | intentional contract change | Repeated obsolete `shared`/`bridges` assertions now protect `sharedChannels` and `centerCompatibility`, matching the UI. |
| 14 | gamification streak endpoint | intentional contract change | The current widget uses the consolidated `gamification.getStats`; the removed `getStreak` procedure was not restored. The test now verifies streak fields in `getStats`. |
| 15 | gamification achievements endpoint | intentional contract change | The current router has no achievements endpoint. The second test now protects progression and daily-reward fields of `getStats`, which the current widget consumes. |

No failure was classified as a production regression. No test was deleted, skipped, or weakened to force a green result.

## Dependency and compiler repair

- pinned the repository to pnpm 10.18.0;
- moved pnpm 10 settings to `pnpm-workspace.yaml`;
- preserved the Tailwind override and Wouter patch in the lockfile;
- made lint target the actual application source instead of nested tool worktrees;
- added `tsconfig.test.json` and included test type-checking in `pnpm check`;
- repaired all error-severity lint findings; the existing warning backlog remains visible.

## Gate commands

The Gate 1 commit may be created only after these commands all exit zero:

```text
pnpm check
pnpm lint
pnpm test
pnpm build
```
