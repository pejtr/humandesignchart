/**
 * Read-only public WhatsApp/Meta preview check, no credentials or checkout.
 * Run AFTER a real Cloudflare production deploy:
 * node scripts/qa/check-share-preview.mjs
 */
const urls = [
  "https://humandesignchart.app/",
  "https://humandesignchart.app/en",
  "https://www.humandesignchart.app/en",
  "https://humandesignmapa.cz/",
  "https://humandesignmapa.cz/cs",
];
let failed = 0;
function meta(html, property) {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  const tag = tags.find(t => t.includes('property="' + property + '"') ||
    t.includes("property='" + property + "'"));
  return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] || "";
}
for (const url of urls) {
  try {
    const htmlResponse = await fetch(url, {
      headers: { "User-Agent": "WhatsApp/2.24.0", Accept: "text/html" },
      signal: AbortSignal.timeout(20000),
    });
    const html = await htmlResponse.text();
    const title = meta(html, "og:title");
    const image = meta(html, "og:image");
    if (!htmlResponse.ok || !title || !image || !image.startsWith("https://") ||
      !htmlResponse.headers.get("content-type")?.includes("text/html")) {
      throw new Error("Bad HTML response or missing OG title/image");
    }
    const photo = await fetch(image, {
      headers: { "User-Agent": "WhatsApp/2.24.0", Accept: "image/png" },
      signal: AbortSignal.timeout(20000),
    });
    const bytes = Buffer.from(await photo.arrayBuffer());
    const png = bytes.length >= 24 && bytes.subarray(0, 8).equals(
      Buffer.from([137,80,78,71,13,10,26,10]));
    const width = png ? bytes.readUInt32BE(16) : 0;
    const height = png ? bytes.readUInt32BE(20) : 0;
    const okay = photo.ok && !!photo.headers.get("content-type")?.includes("image/png") &&
      png && width === 1200 && height === 630 && bytes.length <= 300000;
    console.log(JSON.stringify({
      url, status: htmlResponse.status, title, image,
      imageStatus: photo.status, imageContentType: photo.headers.get("content-type"),
      imageBytes: bytes.length, dimensions: width + "x" + height,
      pass: Boolean(okay),
    }, null, 2));
    if (!okay) failed++;
  } catch (err) {
    console.error("[FAIL] " + url + ": " + String(err));
    failed++;
  }
}
if (failed) {
  process.exitCode = 1;
  console.error("[NO-GO] " + failed + " public social-card checks failed.");
} else {
  console.log("[PASS] WhatsApp-like crawler can fetch the tags and PNGs. User WhatsApp cache still requires separate verification.");
}
