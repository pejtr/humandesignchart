import { describe, expect, it } from "vitest";
import { buildSeoHead } from "./seoMeta";

describe("localized SEO alternate links", () => {
  it("uses one locale segment on EN and CZ homepages", () => {
    for (const [locale, path] of [["en", "/en/"], ["cs", "/cs/"]] as const) {
      const html = buildSeoHead(locale, path);
      expect(html).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/"');
      expect(html).toContain('hreflang="en" href="https://humandesignchart.app/en/"');
      expect(html).not.toContain("/en/en/");
      expect(html).not.toContain("/cs/cs/");
    }
  });

  it("preserves the route slug when switching locale", () => {
    const html = buildSeoHead("en", "/en/blog");
    expect(html).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/blog"');
    expect(html).toContain('hreflang="en" href="https://humandesignchart.app/en/blog"');
  });

  it("renders complete indexable meta for the Honorace route", () => {
    const html = buildSeoHead("cs", "/cs/honorace");
    expect(html).toContain("<title>Honorace");
    expect(html).toContain('name="description"');
    expect(html).toContain('rel="canonical" href="https://humandesignmapa.cz/cs/honorace"');
    expect(html).toContain('property="og:title"');
  });

  it("renders complete indexable meta for the Angel Numbers overview", () => {
    const html = buildSeoHead("cs", "/cs/andelska-cisla");
    expect(html).toContain("<title>Andělská Čísla");
    expect(html).toContain('name="description"');
    expect(html).toContain('rel="canonical" href="https://humandesignmapa.cz/cs/andelska-cisla"');
    expect(html).toContain('property="og:title"');
  });

  it("emits hreflang only for production-ready cs, en locales and x-default", () => {
    const html = buildSeoHead("cs", "/cs/calculate");
    expect(html).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/calculate"');
    expect(html).toContain('hreflang="en" href="https://humandesignchart.app/en/calculate"');
    expect(html).not.toContain('hreflang="de"');
    expect(html).not.toContain('hreflang="fr"');
    expect(html).not.toContain('hreflang="es"');
    expect(html).not.toContain('hreflang="it"');
    expect(html).toContain('hreflang="x-default" href="https://humandesignchart.app/en/calculate"');
  });

  it("marks incomplete DE/FR/ES/IT translation routes noindex until localized", () => {
    for (const locale of ["de", "fr", "es", "it"]) {
      const html = buildSeoHead(locale, `/${locale}/calculate`);
      expect(html).toContain('name="robots" content="noindex,follow"');
      expect(html).not.toContain(`hreflang="${locale}"`);
    }
  });
});
