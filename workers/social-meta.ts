/**
 * Cloudflare Pages serves a shared CZ HTML shell on two brands. Normalize
 * host-level language and brand before injecting route-specific metadata.
 * Never rewrite hreflang alternates after their generation.
 */
import { buildSeoHead } from "../server/_core/seoMeta";

export async function withServerRenderedSeoMeta(url: URL, asset: Response): Promise<Response> {
  if (!asset.ok || !asset.headers.get("content-type")?.includes("text/html")) {
    return asset;
  }
  const locale = url.pathname.match(/^\/(cs|en)(?:\/|$)/)?.[1];
  // The public Cloudflare edge workers reverse-proxy the Pages origin: the
  // Pages worker sees a *.pages.dev host. Route locale remains trustworthy.
  const enHost = locale === "en" || (!locale && ["humandesignchart.app", "www.humandesignchart.app"].includes(url.hostname.toLowerCase()));
  const meta = locale ? buildSeoHead(locale, url.pathname) : "";
  if (!meta && !enHost) return asset;

  let html = await asset.text();
  if (enHost) {
    html = html
      .replace('<html lang="cs">', '<html lang="en">')
      .replaceAll("https://www.humandesignmapa.cz", "https://www.humandesignchart.app")
      .replaceAll("https://humandesignmapa.cz", "https://humandesignchart.app")
      .replace('title="Blog o Human Design"', 'title="Human Design Blog"')
      // Do not publish Czech-only FAQ markup on the English site.
      .replace(/<!-- NotFair GEO[\s\S]*?<\/script>/, "");
  }

  const rendered = !meta
    ? html
    : html.includes("<!--SEO_META-->")
      ? html.replace("<!--SEO_META-->", meta)
      : html.replace(/<\/head>/i, `  ${meta}\n</head>`);

  const headers = new Headers(asset.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("content-language", enHost ? "en" : "cs");

  return new Response(rendered, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });
}
