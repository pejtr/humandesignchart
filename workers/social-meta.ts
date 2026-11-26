/**
 * Cloudflare Pages serves a shared CZ HTML shell on two brands. Normalize
 * host-level language and brand before injecting route-specific metadata.
 * Never rewrite hreflang alternates after their generation.
 */
import { buildSeoHead } from "../server/_core/seoMeta";
import { initialPublicHtml } from "./seo-static-content";


// An upstream Cloudflare reverse proxy can make request.url point to the
// *.pages.dev origin, losing the original share URL's CZ/EN hostname.
// Accept only our own known brand domains, never arbitrary forwarded hosts.
const PUBLIC_BRAND_HOSTS = new Set([
  "humandesignchart.app",
  "www.humandesignchart.app",
  "humandesignmapa.cz",
  "www.humandesignmapa.cz",
]);

export function publicSeoUrlFromRequest(request: Request): URL {
  const url = new URL(request.url);
  if (!url.hostname.endsWith(".pages.dev")) return url;
  for (const headerName of ["x-forwarded-host", "x-original-host", "host"]) {
    const raw = request.headers.get(headerName);
    const hostname = raw?.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "");
    if (hostname && PUBLIC_BRAND_HOSTS.has(hostname)) {
      url.hostname = hostname;
      return url;
    }
  }
  return url;
}

export async function withServerRenderedSeoMeta(url: URL, asset: Response, publicPixelId?: string): Promise<Response> {
  if (!asset.ok || !asset.headers.get("content-type")?.includes("text/html")) {
    return asset;
  }
  const locale = url.pathname.match(/^\/(cs|en|de|fr|es|it)(?:\/|$)/)?.[1];
  const enHost = ["humandesignchart.app", "www.humandesignchart.app"].includes(url.hostname.toLowerCase());
  // Bare domains ("/") are the most shared URLs. Infer their language from
  // the hostname; otherwise WhatsApp gets the unprocessed <!--SEO_META--> shell.
  const htmlLang = locale || (enHost ? "en" : "cs");
  let meta = buildSeoHead(htmlLang, url.pathname);
  // A shareable *.pages.dev preview must refer to its OWN OG image, not an
  // unlaunched image path on the live branded domains. This route stays noindex.
  if (/^\/(?:cs|en)\/motion-preview\/?$/.test(url.pathname) &&
      url.hostname.endsWith(".pages.dev") && meta) {
    const canonicalBrand = htmlLang === "cs"
      ? "https://humandesignmapa.cz" : "https://humandesignchart.app";
    meta = meta
      .replaceAll(`${canonicalBrand}/images/og-motion-preview.png`,
        `${url.origin}/images/og-motion-preview.png`)
      .replaceAll(`${canonicalBrand}/${htmlLang}/motion-preview`,
        `${url.origin}${url.pathname}`);
  }
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

  // Render a real H1, published article excerpt and crawlable links in
  // first-paint HTML, not only an empty React root. It is visible to all
  // visitors until the SPA mounts and replaces the content.
  const fallback = initialPublicHtml(url);
  const populated = fallback
    ? rendered.replace(/<div id="root">\s*<\/div>/, '<div id="root">' + fallback + '</div>')
    : rendered;

  // The public identifier is not a secret. Never inject API credentials,
  // arbitrary strings, or production tracking on preview hosts.
  const safePixelId = PUBLIC_BRAND_HOSTS.has(url.hostname) &&
    typeof publicPixelId === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(publicPixelId.trim())
    ? publicPixelId.trim() : null;
  const finalHtml = safePixelId
    ? populated.replace(/<\/head>/i, '<meta name="hd-openai-ads-pixel-id" content="' + safePixelId + '">\n</head>')
    : populated;
  const headers = new Headers(asset.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("content-language", htmlLang);

  // Private pages, URLs in the wrong language for this domain and previews
  // must not compete for canonical indexation. No redirects are introduced,
  // preserving OAuth same-host callback cookies and checkout sessions.
  const crossBrandLocale = (enHost && locale === "cs") ||
    (["humandesignmapa.cz", "www.humandesignmapa.cz"].includes(url.hostname) && locale === "en");
  const privatePage = /^\/(?:cs\/|en\/)?(?:login|account|dashboard|portal|admin|payment|crm-dashboard|social-scheduler|ugc-factory|vsl|chat-reading|vsl-chat|refer|chart)(?:\/|$)/.test(url.pathname);
  // Angel-number article data is Czech-only; do not claim English
  // editorial content or feed untranslated content into the EN index.
  const untranslatedAngel = enHost && /^\/en\/andelska-cisla(?:\/|$)/.test(url.pathname);
  if (crossBrandLocale || privatePage || untranslatedAngel ||
      /^\/(?:cs|en)\/motion-preview\/?$/.test(url.pathname)) {
    headers.set("x-robots-tag", "noindex, follow");
  }

  return new Response(finalHtml, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });
}
