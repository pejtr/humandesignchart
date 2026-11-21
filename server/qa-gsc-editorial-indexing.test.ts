import { describe, expect, it } from "vitest";
import { isMissingEditorialPage, editorialNotFoundResponse } from "../workers/editorial-indexing";
import { BLOG_ARTICLES } from "./data/blogArticles";
import { BLOG_ARTICLES_EN } from "./data/blogArticlesEn";
import { ANGEL_NUMBERS } from "./data/angelNumbers";

describe("GSC soft-404 editorial status guard", () => {
  it("keeps every published CZ and EN article indexable", () => {
    for (const article of BLOG_ARTICLES) {
      expect(isMissingEditorialPage("/cs/blog/" + article.slug)).toBe(false);
    }
    for (const article of BLOG_ARTICLES_EN) {
      expect(isMissingEditorialPage("/en/blog/" + article.slug)).toBe(false);
    }
  });

  it("keeps all five canonical type pages", () => {
    for (const type of ["generator","manifesting-generator","projector","manifestor","reflector"]) {
      expect(isMissingEditorialPage("/en/types/" + type)).toBe(false);
      expect(isMissingEditorialPage("/cs/types/" + type)).toBe(false);
    }
  });

  it("preserves every real angel-number article", () => {
    for (const article of ANGEL_NUMBERS) {
      expect(isMissingEditorialPage("/cs/andelska-cisla/" + article.slug)).toBe(false);
    }
  });

  it("identifies never-published and malformed editorial paths", () => {
    for (const path of ["/en/blog/not-a-real-article", "/cs/blog/not-a-real-article",
      "/en/blog/not-a-real-article/", "/cs/types/unsupported-type",
      "/en/types/unsupported-type", "/cs/andelska-cisla/unsupported-number",
      "/en/blog/double/nested", "/en/blog/definitely-not-present"]) {
      expect(isMissingEditorialPage(path)).toBe(true);
    }
  });

  it("never rewrites checkout, account, calculator, known root, or assets", () => {
    for (const path of ["/en/", "/cs", "/en/calculate",
      "/en/account", "/cs/login", "/en/payment/success",
      "/en/blog", "/en/types", "/en/andelska-cisla",
      "/api/oauth/callback/google", "/api/trpc/auth.me",
      "/assets/x.js", "/en/chart/123"]) {
      expect(isMissingEditorialPage(path)).toBe(false);
    }
  });

  it("returns real 404 and noindex, without carrying stale HTML entity metadata", async () => {
    const response = editorialNotFoundResponse(new Response("<html>Not found</html>", {
      headers: {"content-type": "text/html", "etag": "abc", "content-length": "23"},
    }));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.has("etag")).toBe(false);
    expect(response.headers.has("content-length")).toBe(false);
    expect(await response.text()).toContain("Not found");
  });
});
