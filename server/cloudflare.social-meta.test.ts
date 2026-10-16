import { describe, expect, it } from "vitest";
import { withServerRenderedSeoMeta } from "../workers/social-meta";

const html = "<!doctype html><html><head><!--SEO_META--></head><body><div id=\"root\"></div></body></html>";

function assetResponse(body: string = html, type = "text/html"): Response {
  return new Response(body, {
    headers: { "content-type": type, "etag": "\"asset-version\"", "content-length": "100" },
  });
}

describe("Cloudflare WhatsApp preview metadata", () => {
  it("injects a complete Czech share card into initial HTML for /cs", async () => {
    const response = await withServerRenderedSeoMeta(
      new URL("https://humandesignmapa.cz/cs"),
      assetResponse(),
    );
    const text = await response.text();
    expect(text).toContain('property="og:title"');
    expect(text).toContain('property="og:locale" content="cs_CZ"');
    expect(text).toContain('property="og:image" content="https://humandesignmapa.cz/images/og-homepage.png"');
    expect(text).toContain('property="og:image:type" content="image/png"');
    expect(text).toContain('name="twitter:card" content="summary_large_image"');
    expect(text).not.toContain("<!--SEO_META-->");
    expect(response.headers.get("etag")).toBeNull();
    expect(response.headers.get("content-length")).toBeNull();
  });

  it("uses the English host for the English OG image", async () => {
    const response = await withServerRenderedSeoMeta(
      new URL("https://www.humandesignchart.app/en"),
      assetResponse(),
    );
    expect(await response.text()).toContain(
      'property="og:image" content="https://humandesignchart.app/images/og-homepage.png"',
    );
  });

  it("keeps unrelated binary and API responses unchanged", async () => {
    const css = assetResponse("body {color:red}", "text/css");
    const response = await withServerRenderedSeoMeta(
      new URL("https://humandesignmapa.cz/cs/assets/app.css"),
      css,
    );
    expect(response).toBe(css);
  });

  it("inserts tags before closing head if the placeholder is absent", async () => {
    const response = await withServerRenderedSeoMeta(
      new URL("https://humandesignmapa.cz/cs/"),
      assetResponse("<html><head></head><body></body></html>"),
    );
    expect(await response.text()).toContain('property="og:image"');
  });
});
