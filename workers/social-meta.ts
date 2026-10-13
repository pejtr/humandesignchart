/**
 * Cloudflare Pages serves index.html for SPA routes. Bots (including WhatsApp)
 * don't execute the React useSEO hook, so inject Open Graph tags in the
 * initial HTML response before the browser receives it.
 */
import { buildSeoHead } from "../server/_core/seoMeta";

export async function withServerRenderedSeoMeta(url: URL, asset: Response): Promise<Response> {
  const locale = url.pathname.match(/^\/(cs|en)(?:\/|$)/)?.[1];
  if (!locale || !asset.ok || !asset.headers.get("content-type")?.includes("text/html")) {
    return asset;
  }

  const meta = buildSeoHead(locale, url.pathname);
  if (!meta) return asset;

  const html = await asset.text();
  const rendered = html.includes("<!--SEO_META-->")
    ? html.replace("<!--SEO_META-->", meta)
    : html.replace(/<\/head>/i, `  ${meta}\n</head>`);

  // The response body changed; upstream length, compression and entity tags
  // must not be carried over from the original Cloudflare static asset.
  const headers = new Headers(asset.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("content-type", "text/html; charset=utf-8");

  return new Response(rendered, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });
}
