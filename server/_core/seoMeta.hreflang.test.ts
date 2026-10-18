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

  it("emits complete hreflang alternates for cs, en, de, fr, es, it, and x-default", () => {
    const html = buildSeoHead("de", "/de/calculate");
    expect(html).toContain('hreflang="cs" href="https://humandesignmapa.cz/cs/calculate"');
    expect(html).toContain('hreflang="en" href="https://humandesignchart.app/en/calculate"');
    expect(html).toContain('hreflang="de" href="https://humandesignchart.app/de/calculate"');
    expect(html).toContain('hreflang="fr" href="https://humandesignchart.app/fr/calculate"');
    expect(html).toContain('hreflang="es" href="https://humandesignchart.app/es/calculate"');
    expect(html).toContain('hreflang="it" href="https://humandesignchart.app/it/calculate"');
    expect(html).toContain('hreflang="x-default" href="https://humandesignchart.app/en/calculate"');
    expect(html).toContain('property="og:locale" content="de_DE"');
  });

  it("handles French, Spanish and Italian og:locale correctly", () => {
    expect(buildSeoHead("fr", "/fr/calculate")).toContain('property="og:locale" content="fr_FR"');
    expect(buildSeoHead("es", "/es/calculate")).toContain('property="og:locale" content="es_ES"');
    expect(buildSeoHead("it", "/it/calculate")).toContain('property="og:locale" content="it_IT"');
  });
});
