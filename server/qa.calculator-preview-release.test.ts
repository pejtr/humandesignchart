import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
describe("PR86 calculator release gate", () => {
  it("prevents accidental production deploy via wrong Pages project or branch", () => {
    const s = readFileSync(resolve("scripts/qa/deploy-calculator-preview.ps1"), "utf8");
    expect(s).toContain("hd-calculator-preview");
    expect(s).toContain("humandesignchart-web");
    expect(s).toContain("dist/public");
    expect(s).toContain("deployment_configs.preview");
    expect(s).toContain("production_branch");
    expect(s).not.toContain("--branch=main");
  });
  it("ships syntactically correct browser QA without customer actions", () => {
    const file = resolve("scripts/qa/capture-calculator-preview.mjs");
    const checked = spawnSync(process.execPath, ["--check", file], { encoding: "utf8", timeout: 10000 });
    expect(checked.status, checked.stderr).toBe(0);
    const s = readFileSync(file, "utf8");
    expect(s).toContain("/calculate");
    expect(s).toContain("humandesignchart-web.pages.dev");
    expect(s).toContain("reducedMotion");
    expect(s).not.toContain(".submit(");
  });
});
