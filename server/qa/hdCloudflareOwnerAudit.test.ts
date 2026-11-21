import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

describe("Cloudflare OAuth owner-only audit contract", () => {
  it("passes all isolated Node audit tests without an API token or network", () => {
    const env = { ...process.env, CLOUDFLARE_API_TOKEN: "", CLOUDFLARE_ACCOUNT_ID: "" };
    const result = spawnSync(process.execPath, [
      "--test", "scripts/qa/hd-cloudflare-oauth-owner-audit.test.mjs",
    ], { cwd: process.cwd(), env, encoding: "utf8", timeout: 20000 });
    expect(result.error).toBeUndefined();
    expect(result.status, (result.stdout || "") + "\n" + (result.stderr || "")).toBe(0);
    expect(result.stdout).toContain("pass 8");
    expect(result.stdout).toContain("fail 0");
  });
});
