/**
 * Deterministic 1200x630 PNG social card. Runs at Cloudflare build time,
 * using the existing @resvg/resvg-js dependency. No external image service.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(project, "dist", "public", "images", "og-motion-preview.png");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <radialGradient id="bg"><stop stop-color="#25294a"/><stop offset=".65" stop-color="#15182f"/><stop offset="1" stop-color="#0E1020"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0e2bc"/><stop offset="1" stop-color="#D8C49A"/></linearGradient>
  <linearGradient id="line" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8899FF"/><stop offset="1" stop-color="#D8C49A"/></linearGradient>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="1200" height="630" fill="#0E1020"/>
<rect width="1200" height="630" fill="url(#bg)"/>
<rect x="58" y="50" width="1084" height="530" rx="30" fill="none" stroke="#D8C49A" stroke-opacity=".28"/>
<circle cx="878" cy="318" r="220" fill="none" stroke="#8899FF" stroke-opacity=".18" stroke-width="1.5"/>
<circle cx="878" cy="318" r="182" fill="none" stroke="#D8C49A" stroke-opacity=".25"/>
<circle cx="878" cy="318" r="152" fill="#8899FF" fill-opacity=".10" filter="url(#glow)"/>
<g transform="translate(740 105)">
 <g fill="none" stroke="url(#line)" stroke-width="4" stroke-linecap="round" stroke-opacity=".7">
  <path d="M140 59V120M140 155V209M140 247V309M140 354V420"/>
  <path d="M140 230L65 305M140 230L213 305M65 305L140 354M213 305L140 354"/>
  <path d="M140 354L140 420"/>
 </g>
 <path d="M140 6L95 71H185Z" fill="#D8C49A" fill-opacity=".79" stroke="#f4e3bb" stroke-width="2"/>
 <path d="M140 94L106 128L140 162L174 128Z" fill="#8899FF" fill-opacity=".63" stroke="#c1c8ff" stroke-width="2"/>
 <rect x="108" y="206" width="64" height="50" rx="10" fill="#D8C49A" fill-opacity=".64" stroke="#f4e3bb" stroke-width="2"/>
 <path d="M140 272L97 336L183 336Z" fill="#8899FF" fill-opacity=".62" stroke="#a5b0ff" stroke-width="2"/>
 <rect x="105" y="359" width="70" height="57" rx="10" fill="#D8C49A" fill-opacity=".73" stroke="#f4e3bb" stroke-width="2"/>
 <circle cx="65" cy="305" r="25" fill="#15182f" stroke="#8899FF" stroke-width="2"/>
 <circle cx="213" cy="305" r="25" fill="#15182f" stroke="#D8C49A" stroke-width="2"/>
 </g>
 <rect x="744" y="517" width="282" height="45" rx="22" fill="#0E1020" stroke="#D8C49A" stroke-opacity=".54"/>
 <circle cx="774" cy="540" r="13" fill="#D8C49A"/>
 <path d="M770 534L782 540L770 546Z" fill="#0E1020"/>
 <rect x="809" y="524" width="100" height="31" rx="15" fill="#D8C49A"/>
 <text x="829" y="545" fill="#101324" font-family="sans-serif" font-weight="bold" font-size="16">ZEN</text>
 <text x="936" y="545" fill="#D8C49A" font-family="sans-serif" font-weight="bold" font-size="16">FLOW</text>
 <text x="106" y="134" fill="#D8C49A" font-family="sans-serif" font-size="19" letter-spacing="4">HUMAN DESIGN  •  ZEN / FLOW</text>
 <text x="102" y="258" fill="#f7f0e3" font-family="serif" font-size="73">Your energy</text>
 <text x="102" y="337" fill="#f7f0e3" font-family="serif" font-size="73">blueprint.</text>
 <text x="102" y="415" fill="url(#gold)" font-family="serif" font-size="79" font-style="italic">Alive.</text>
 <text x="106" y="486" fill="#c7c8d7" font-family="sans-serif" font-size="20">An interactive Bodygraph experience</text>
 <text x="106" y="537" fill="#8899FF" font-family="sans-serif" font-size="17" letter-spacing="3">LIVE PREVIEW</text>
</svg>`;
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, png);
if (png.length < 10_000) throw new Error("OG preview PNG unexpectedly small");
console.log(`Generated social preview PNG (${png.length} bytes): ${output}`);
