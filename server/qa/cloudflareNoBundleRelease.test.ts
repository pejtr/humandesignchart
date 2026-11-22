import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Cloudflare Pages production release safety and upload reliability", () => {
  const direct = readFileSync("scripts/p0-direct-cloudflare-release.sh", "utf8");
  const oauth = readFileSync("scripts/release-hd-google-oauth.sh", "utf8");

  it("deploys the exact prebuilt _worker.js without Wrangler re-bundling", () => {
    for (const script of [direct, oauth]) {
      expect(script).toContain("pnpm build:cloudflare");
      expect(script).toContain("test -s dist/public/_worker.js");
      expect(script).toMatch(/wrangler@4\.147\.0 pages deploy dist\/public --no-bundle/);
      expect(script).toContain("--project-name=humandesignchart-web");
    }
  });

  it("does not remove production approval or D1 OAuth and checkout safety gates", () => {
    expect(direct).toContain('HD_PRODUCTION_DEPLOY_APPROVED');
    expect(direct).toContain('HD_CHECKOUT_SANDBOX_PASS');
    expect(direct).toContain('HD_D1_AND_WEBHOOK_VERIFIED');
    expect(direct).toContain('HD_ROLLBACK_READY');
    expect(oauth).toContain('HD_OAUTH_D1_BACKUP_CONFIRMED');
    expect(oauth).toContain('HD_OAUTH_D1_MIGRATED');
    expect(oauth).toContain('HD_GOOGLE_AUTH_SECRETS_PRESENT');
    expect(oauth).toContain('HD_PRODUCTION_DEPLOY_APPROVED');
  });

  it("retains branded-domain SEO post-deploy smoke and refuses false success", () => {
    expect(direct).toContain("node scripts/qa/hd-seo-live-smoke.mjs");
    expect(direct).toContain("[NO-GO] Cloudflare deploy submitted");
    expect(direct).toContain("exit 1");
  });
});
