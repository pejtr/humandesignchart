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
  const locale = url.pathname.match(/^\/(cs|en|de|fr|es|it)(?:\/|$)/)?.[1];
  const enHost = ["humandesignchart.app", "www.humandesignchart.app"].includes(url.hostname.toLowerCase());
  // Bare domains ("/") are the most shared URLs. Infer their language from
  // the hostname; otherwise WhatsApp gets the unprocessed <!--SEO_META--> shell.
  const htmlLang = locale || (enHost ? "en" : "cs");
  const meta = buildSeoHead(htmlLang, url.pathname);
  let html = await asset.text();
  if (enHost || (locale && locale !== "cs")) {
    html = html
      .replace('<html lang="cs">', `<html lang="${htmlLang}">`)
      .replaceAll("https://www.humandesignmapa.cz", "https://www.humandesignchart.app")
      .replaceAll("https://humandesignmapa.cz", "https://humandesignchart.app")
      .replace('title="Blog o Human Design"', 'title="Human Design Blog"')
      // Do not publish Czech-only FAQ markup on the English/international site.
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
  headers.set("content-language", htmlLang);

  return new Response(rendered, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });
}
