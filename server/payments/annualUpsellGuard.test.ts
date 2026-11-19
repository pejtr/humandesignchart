import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("Post-purchase annual upsell guard", () => {
  it("keeps the annual CTA hidden while the server only accepts the Blueprint plan", () => {
    const worker = read("workers/pages-api.ts");
    const page = read("client/src/pages/PaymentSuccess.tsx");
    const serverOnlyBlueprint = /plan:\s*z\.literal\("blueprint"\)/.test(worker);
    const ctaEnabled = /ANNUAL_UPGRADE_CHECKOUT_AVAILABLE\s*=\s*true/.test(page);
    // A paying customer must never be shown a checkout button that errors.
    expect(serverOnlyBlueprint && ctaEnabled).toBe(false);
    expect(page).toMatch(/isBlueprint && ANNUAL_UPGRADE_CHECKOUT_AVAILABLE &&/);
  });
});
