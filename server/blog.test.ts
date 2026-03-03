import { describe, it, expect } from "vitest";
import { blogArticles, getBlogArticleBySlug, getBlogArticlesByCategory } from "../shared/blogArticles";

describe("Blog Articles", () => {
  it("should have at least 10 articles", () => {
    expect(blogArticles.length).toBeGreaterThanOrEqual(10);
  });

  it("each article should have required fields", () => {
    for (const article of blogArticles) {
      expect(article.slug).toBeTruthy();
      expect(article.title).toBeTruthy();
      expect(article.excerpt).toBeTruthy();
      expect(article.content).toBeTruthy();
      expect(article.category).toBeTruthy();
      expect(article.readingTime).toBeGreaterThan(0);
      expect(article.tags).toBeInstanceOf(Array);
      expect(article.tags.length).toBeGreaterThan(0);
    }
  });

  it("should find article by slug", () => {
    const firstArticle = blogArticles[0];
    const found = getBlogArticleBySlug(firstArticle.slug);
    expect(found).toBeDefined();
    expect(found?.slug).toBe(firstArticle.slug);
  });

  it("should return undefined for non-existent slug", () => {
    const found = getBlogArticleBySlug("non-existent-article-slug");
    expect(found).toBeUndefined();
  });

  it("should filter articles by category", () => {
    const categories = [...new Set(blogArticles.map(a => a.category))];
    expect(categories.length).toBeGreaterThan(1);

    for (const category of categories) {
      const filtered = getBlogArticlesByCategory(category);
      expect(filtered.length).toBeGreaterThan(0);
      for (const article of filtered) {
        expect(article.category).toBe(category);
      }
    }
  });

  it("all slugs should be unique", () => {
    const slugs = blogArticles.map(a => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("all slugs should be URL-safe (lowercase, hyphens only)", () => {
    for (const article of blogArticles) {
      expect(article.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("should have articles about Human Design types", () => {
    const typeArticles = blogArticles.filter(a =>
      a.tags.some(t => ["generátor", "projektor", "manifestor", "reflektor"].includes(t.toLowerCase())) ||
      a.category === "typy"
    );
    expect(typeArticles.length).toBeGreaterThan(0);
  });

  it("should have articles about strategy", () => {
    const strategyArticles = blogArticles.filter(a =>
      a.category === "Strategie" || a.tags.includes("strategie")
    );
    expect(strategyArticles.length).toBeGreaterThan(0);
  });

  it("content should be substantial (at least 500 chars)", () => {
    for (const article of blogArticles) {
      expect(article.content.length).toBeGreaterThan(500);
    }
  });
});
