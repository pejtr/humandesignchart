import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
/** Generate optimized 1200x630 social image in build artifact, not source tree. */
for (const isEn of [true, false]) {
  const title = isEn ? "Your design." : "Tvoje mapa.";
  const line = isEn ? "Your story." : "Tvuj pribeh.";
  const kicker = isEn ? "HUMAN DESIGN CHART" : "HUMAN DESIGN MAPA";
  const sub = isEn ? "Explore your free personal Bodygraph" : "Objev svou osobni mapu zdarma";
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="bg"><stop stop-color="#2a3054"/><stop offset="1" stop-color="#0e1020"/></radialGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="42" y="42" width="1116" height="546" rx="25" fill="none" stroke="#d8c49a" stroke-opacity=".5" stroke-width="2"/>
  <circle cx="950" cy="323" r="222" fill="none" stroke="#8899ff" stroke-opacity=".35"/>
  <circle cx="950" cy="323" r="179" fill="none" stroke="#d8c49a" stroke-opacity=".5"/>
  <g stroke="#d8c49a" stroke-width="4" fill="none">
    <path d="M950 146V200M950 239V299M950 338V412M950 447V489"/>
    <path d="M950 290L884 362M950 290L1016 362M884 362L950 437M1016 362L950 437"/>
  </g>
  <path d="M950 132L897 215H1003Z" fill="#d8c49a" stroke="#fff5d9" stroke-width="2"/>
  <path d="M950 218L914 254L950 290L986 254Z" fill="#8899ff" stroke="#fff5d9" stroke-width="2"/>
  <rect x="914" y="300" width="72" height="59" rx="10" fill="#d8c49a"/>
  <path d="M950 365L905 428H995Z" fill="#8899ff"/>
  <rect x="914" y="439" width="72" height="52" rx="10" fill="#d8c49a"/>
  <text x="102" y="144" font-family="sans-serif" font-size="20" letter-spacing="3" fill="#d8c49a">${kicker}</text>
  <text x="99" y="288" font-family="serif" font-size="83" fill="#fff8ec">${title}</text>
  <text x="99" y="385" font-family="serif" font-size="83" fill="#d8c49a">${line}</text>
  <text x="103" y="459" font-family="sans-serif" font-size="23" fill="#c7c9db">${sub}</text>
  </svg>`;
  const bytes = new Resvg(xml).render().asPng();
  if (bytes.length < 10000 || bytes.length >= 600000) throw new Error("Invalid social image size: " + bytes.length);
  const output = resolve("dist", "public", "images", `og-home-${isEn ? "en" : "cs"}-share-v2.png`);
  mkdirSync(dirname(output), {recursive:true});
  writeFileSync(output, bytes);
  console.log(output, bytes.length, "bytes; 1200x630");
}
