import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

describe("Cloudflare branded SEO production smoke", () => {
  it("verifies the fail-closed read-only smoke using deterministic fixture responses", () => {
    const result = spawnSync(process.execPath,
      ["--test", "scripts/qa/hd-seo-live-smoke.test.mjs"],
      { cwd: process.cwd(), encoding: "utf8", timeout: 20000 });
    expect(result.error).toBeUndefined();
    expect(result.status, (result.stdout || "") + "\n" + (result.stderr || "")).toBe(0);
    expect(result.stdout).toContain("pass 4");
    expect(result.stdout).toContain("fail 0");
  });
});
