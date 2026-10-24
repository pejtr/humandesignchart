import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pricing = readFileSync(resolve(process.cwd(), "client/src/pages/Pricing.tsx"), "utf8");

describe("Blueprint checkout handoff", () => {
  it("redirects only after storing the reference and recovery token", () => {
    const mutationStart = pricing.indexOf("const checkout = trpc.subscription.createCheckout.useMutation(");
    const nextMutation = pricing.indexOf("const redeemVoucher =", mutationStart);
    const checkoutHook = pricing.slice(mutationStart, nextMutation);
    expect(checkoutHook).not.toContain("onSuccess:");
    const pending = pricing.indexOf('"hd_pending_checkout"');
    const access = pricing.indexOf('"hd_download_token_" + refId');
    const redirect = pricing.indexOf("if (url) window.location.assign(url);");
    expect(mutationStart).toBeGreaterThan(-1);
    expect(pending).toBeGreaterThan(mutationStart);
    expect(access).toBeGreaterThan(pending);
    expect(redirect).toBeGreaterThan(access);
  });
});
