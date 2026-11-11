import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSeoHead } from "./_core/seoMeta";

describe("premium motion preview release contract", () => {
  for (const locale of ["cs", "en"]) {
    it(`emits real server-side preview OG and noindex for ${locale}`, () => {
      const html = buildSeoHead(locale, `/${locale}/motion-preview`);
      expect(html).toContain('name="robots" content="noindex,nofollow"');
      expect(html).toContain('property="og:image"');
      expect(html).toContain("/images/og-motion-preview.png");
      expect(html).toContain(`/${locale}/motion-preview`);
      expect(html).toContain("ZEN / FLOW");
      expect(html).toContain('name="twitter:card"');
    });
  }

  it("keeps demo media illustrative and never fabricates beta claims", () => {
    const page = readFileSync(resolve("client/src/pages/MotionPreview.tsx"), "utf8");
    expect(page).toContain("illustrative-not-calculated");
    expect(page).toContain("motion-preview-loop.svg");
    expect(page).not.toContain("7 200");
    expect(page).not.toContain("7,200");
    expect(page).not.toContain("beta testimonial");
    expect(page).toContain('localePath("/calculate")');
    expect(page).not.toContain("createCheckout");
  });

  it("declares reduced-motion and keyboard control, without modifying payment flow", () => {
    const css = readFileSync(resolve("client/src/components/bodygraph-motion.css"), "utf8");
    const ui = readFileSync(resolve("client/src/components/BodygraphMotionFrame.tsx"), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".hd-motion-control");
    expect(ui).toContain("aria-pressed");
    expect(ui).toContain("data-testid");
    expect(ui).not.toContain("stripe");
  });
});
