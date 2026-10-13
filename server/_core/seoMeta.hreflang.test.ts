import { describe, expect, it } from "vitest";
import { buildSeoHead } from "./seoMeta";

describe("localized SEO alternate links", () => {
  it("uses one locale segment on EN and CZ homepages", () => {
    for (const [locale, path] of [["en", "/en/"], ["cs", "/cs/"]] as const) {
      const html = buildSeoHead(locale, path);
      expect(html).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/"');
      expect(html).toContain('hreflang="en" href="https://www.humandesignchart.app/en/"');
      expect(html).not.toContain("/en/en/");
      expect(html).not.toContain("/cs/cs/");
    }
  });

  it("preserves the route slug when switching locale", () => {
    const html = buildSeoHead("en", "/en/blog");
    expect(html).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/blog"');
    expect(html).toContain('hreflang="en" href="https://www.humandesignchart.app/en/blog"');
  });
});
