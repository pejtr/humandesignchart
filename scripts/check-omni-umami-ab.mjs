/**
 * Dependency-free source contract for OMNI Umami consent and A/B pilot.
 * Full typecheck, build and browser E2E remain release gates.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const read = path => readFileSync(path, "utf8");
const tracker = read("client/src/components/OmniUmamiPilot.tsx");
const wrapper = read("client/src/components/UmamiSitePilot.tsx");
const experiment = read("client/src/lib/omniLandingAB.ts");
const landing = read("client/src/pages/Home.tsx");
const id = "hd-hero-2026q4";
for (const token of [
  'VITE_UMAMI_ENABLED', 'VITE_UMAMI_WEBSITE_ID', 'VITE_UMAMI_SCRIPT_URL',
  'dataset.autoPageview = "false"', 'dataset.beforeSend',
  'data-omni-experiment', 'experiment_exposure', '"ui_interest"',
  'isPublicPath(window.location.pathname)', 'hasConsent()', 'privacyBlocked()',
]) {
  assert.ok((tracker + wrapper + landing).includes(token), "Missing privacy gate: " + token);
}
assert.ok(experiment.includes("VITE_OMNI_AB_PILOT_ENABLED") &&
  experiment.includes("window.crypto.getRandomValues") &&
  experiment.includes("sessionStorage") &&
  experiment.includes('return "A"'), "AB must fail closed and randomize without IDs");
assert.ok(landing.includes(id), "Missing experiment ID in targeted landing");
assert.ok(landing.includes('data-omni-variant={creative}'), "Missing variant exposure marker");
assert.ok(landing.includes("abCopy(creative"), "No creative copy variations");
assert.ok(!tracker.includes("new URLSearchParams(window.location.search)"),
  "Unsafe URL query ingestion");
assert.ok(tracker.includes('Object.keys(values).every(k => ["experiment", "variant"].includes(k))'),
  "Experiment event payload is not restricted");
assert.ok(tracker.includes("Object.keys(values).some(k => ![\"interest\", \"zone\", \"experiment\", \"variant\"].includes(k))"),
  "Interest event payload is not restricted");
console.log("OMNI Umami A/B pilot static gate PASS: " + id);
