import { describe, expect, it } from "vitest";
import { buildSeoHead } from "./_core/seoMeta";

describe("partner invite SEO preview", () => {
  it("renders a Czech WhatsApp-compatible preview for a clean invite URL", () => {
    const head = buildSeoHead("cs", "/cs/partner/HDM2026");

    expect(head).toContain("Pojďme porovnat naše Human Design mapy");
    expect(head).toContain('property="og:description"');
    expect(head).toContain('property="og:image" content="https://www.humandesignmapa.cz/images/og-homepage.png"');
    expect(head).toContain('name="twitter:card" content="summary_large_image"');
    expect(head).toContain('rel="canonical" href="https://www.humandesignmapa.cz/cs/partner/HDM2026"');
  });
});
