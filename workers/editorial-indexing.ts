/**
 * Distinguish real published editorial URLs from non-existing SPA article slugs.
 * These paths must not return a generic 200 app shell (Google "soft 404").
 * Deliberately does NOT touch customer login, purchases, charts or other routes.
 */
import { BLOG_ARTICLES } from "../server/data/blogArticles";
import { BLOG_ARTICLES_EN } from "../server/data/blogArticlesEn";
import { ANGEL_NUMBERS } from "../server/data/angelNumbers";

const TYPES = new Set(["generator", "manifesting-generator", "projector", "manifestor", "reflector"]);

export function isMissingEditorialPage(pathname: string): boolean {
  const matched = /^\/(cs|en)\/(blog|types|andelska-cisla)\/(.+)$/.exec(pathname);
  if (!matched) return false;
  const [, locale, section, raw] = matched;
  const slug = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  if (!slug || slug.includes("/")) return true;
  if (section === "types") return !TYPES.has(slug);
  if (section === "blog") {
    const published = locale === "en" ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
    return !published.some(article => article.slug === slug);
  }
  return !ANGEL_NUMBERS.some(article => article.slug === slug);
}

/**
 * Preserve the normal React app/NotFound experience for human visitors but
 * correctly report the HTTP status to Google and other HTTP clients.
 * Never mistake a non-HTML asset for an editorial page.
 */
export function editorialNotFoundResponse(asset: Response): Response {
  const headers = new Headers(asset.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("x-robots-tag", "noindex, nofollow");
  headers.set("cache-control", "no-store");
  return new Response(asset.body, {
    status: 404,
    statusText: "Not Found",
    headers,
  });
}
