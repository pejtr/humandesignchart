/**
 * Social share previews: local, deterministic, no external image services.
 * Build once after Vite, output only under dist/public/images.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist", "public", "images");
mkdirSync(output, { recursive: true });
function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function createCard({ brand, eyebrow, title, accent, subtitle, cta, file }) {
  const stars = Array.from({ length: 49 }, (_, i) => {
    const x = 39 + ((i * 173 + 113) % 1100);
    const y = 41 + ((i * 101 + 67) % 540);
    const r = i % 7 === 0 ? 1.6 : .85;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r +
      '" fill="#c0c9f4" opacity=".42"/>';
  }).join("");
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">',
    '<defs><linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">',
    '<stop stop-color="#071426"/><stop offset=".6" stop-color="#161d3f"/>',
    '<stop offset="1" stop-color="#0c1023"/></linearGradient>',
    '<radialGradient id="glow"><stop stop-color="#6d77d5" stop-opacity=".29"/>',
    '<stop offset="1" stop-color="#6d77d5" stop-opacity="0"/></radialGradient></defs>',
    '<rect width="1200" height="630" fill="url(#bg)"/>',
    '<ellipse cx="930" cy="310" rx="300" ry="265" fill="url(#glow)"/>',
    '<rect x="42" y="42" width="1116" height="546" rx="26" fill="none" stroke="#D8C49A" stroke-opacity=".27"/>',
    '<g>', stars, '</g>',
    '<text x="90" y="124" font-family="sans-serif" font-size="23" font-weight="700" fill="#D8C49A">', esc(brand), '</text>',
    '<text x="90" y="182" font-family="sans-serif" font-size="16" letter-spacing="3" fill="#8899FF">', esc(eyebrow), '</text>',
    '<text x="87" y="292" font-family="serif" font-size="70" fill="#F7F2EA">', esc(title), '</text>',
    '<text x="87" y="376" font-family="serif" font-style="italic" font-size="67" fill="#D8C49A">', esc(accent), '</text>',
    '<text x="90" y="429" font-family="sans-serif" font-size="20" fill="#DEE3F0">', esc(subtitle), '</text>',
    '<rect x="89" y="464" width="322" height="58" rx="29" fill="#D8C49A"/>',
    '<text x="116" y="502" font-family="sans-serif" font-size="21" font-weight="700" fill="#101324">', esc(cta), '</text>',
    '<g fill="none" stroke="#D8C49A" stroke-opacity=".3">',
    '<circle cx="936" cy="314" r="225"/><circle cx="936" cy="314" r="180" stroke="#8899FF"/>',
    '<circle cx="936" cy="314" r="134" stroke-dasharray="3 9"/></g>',
    '<g transform="translate(826 109)">',
    '<g fill="none" stroke="#AAB7FF" stroke-width="4" stroke-linecap="round">',
    '<path d="M110 75V128V208V258V330V400"/>',
    '<path d="M110 208L39 263M110 208L184 263M39 263L110 330M184 263L110 330"/></g>',
    '<path d="M110 10L71 73H149Z" fill="#D8C49A" stroke="#FFE4B4" stroke-width="2"/>',
    '<path d="M110 104L78 139L110 174L142 139Z" fill="#8899FF" stroke="#D9E0FF" stroke-width="2"/>',
    '<rect x="79" y="194" width="62" height="51" rx="10" fill="#D8C49A" stroke="#FFE4B4" stroke-width="2"/>',
    '<path d="M110 270L73 333H147Z" fill="#8899FF" stroke="#D9E0FF" stroke-width="2"/>',
    '<rect x="76" y="350" width="68" height="53" rx="10" fill="#D8C49A" stroke="#FFE4B4" stroke-width="2"/>',
    '<circle cx="39" cy="263" r="24" fill="#111A33" stroke="#8899FF" stroke-width="2"/>',
    '<circle cx="184" cy="263" r="24" fill="#111A33" stroke="#D8C49A" stroke-width="2"/>',
    '</g></svg>'
  ].join("");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  // conservative mobile sharing budget; not a claimed official WhatsApp limit
  if (png.length < 8000 || png.length > 300000) {
    throw new Error("OG size outside 8-300KB budget: " + file + " " + png.length);
  }
  if (png[0] !== 137 || png[1] !== 80 || png[2] !== 78 || png[3] !== 71 ||
    png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    throw new Error("Generated OG asset is not a 1200x630 PNG");
  }
  writeFileSync(resolve(output, file), png);
  console.log("[OG] " + file + " " + png.length + " bytes 1200x630");
}
createCard({
  brand: "HumanDesignChart.app",
  eyebrow: "PERSONAL BODYGRAPH",
  title: "Discover your design.",
  accent: "Explore your path.",
  subtitle: "Free chart  ·  Clear explanations",
  cta: "Get My Free Chart",
  file: "og-homepage-en.png",
});
createCard({
  brand: "HumanDesignMapa.cz",
  eyebrow: "TVA HUMAN DESIGN MAPA",
  title: "Objev svou mapu.",
  accent: "Poznej svůj design.",
  subtitle: "Osobni mapa zdarma  ·  Prehledny vyklad",
  cta: "Vytvorit mapu zdarma",
  file: "og-homepage-cs.png",
});
