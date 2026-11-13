/** Actual remote WhatsApp/Open Graph probe. Read-only. Usage:
 * node scripts/qa/probe-whatsapp-share.mjs https://humandesignchart.app/en
 */
const url = new URL(process.argv[2] || "https://humandesignchart.app/en");
const trusted = new Set(["humandesignchart.app","www.humandesignchart.app","humandesignmapa.cz","www.humandesignmapa.cz"]);
const assert = (ok,msg) => { if (!ok) throw new Error(msg); };
assert(url.protocol === "https:" && trusted.has(url.hostname) && !url.port && !url.username && !url.password, "Unexpected public hostname");
function getOG(html,key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const property=tag.match(/\bproperty=["']([^"']+)/i)?.[1];
    if (property === key) return tag.match(/\bcontent=["']([^"']+)/i)?.[1] || "";
  }
  return "";
}
for (const ua of ["facebookexternalhit/1.1","WhatsApp/2.24"]) {
  const response = await fetch(url, {headers:{"User-Agent":ua,Accept:"text/html"},signal:AbortSignal.timeout(20000)});
  assert(response.ok, `${ua}: HTTP ${response.status}`);
  assert(trusted.has(new URL(response.url).hostname), "Unexpected off-domain redirect");
  assert((response.headers.get("content-type")||"").includes("text/html"),`${ua}: response is not HTML`);
  const html=await response.text();
  for (const key of ["og:title","og:description","og:url","og:image"]) {
    const value=getOG(html,key);
    assert(value,`${ua}: missing ${key} in raw HTML`);
    assert(html.indexOf(`property="${key}"`) < 300000, `${ua}: ${key} not in first 300KB`);
    console.log(`${ua} ${key}: ${value}`);
  }
  const imageUrl=new URL(getOG(html,"og:image"));
  assert(imageUrl.protocol==="https:" && trusted.has(imageUrl.hostname),"Untrusted OG image host");
  const image=await fetch(imageUrl,{headers:{"User-Agent":ua,Accept:"image/png"},signal:AbortSignal.timeout(20000)});
  assert(image.ok,`${ua}: image HTTP ${image.status}`);
  assert((image.headers.get("content-type")||"").startsWith("image/png"),`${ua}: image has wrong MIME type`);
  const bytes=new Uint8Array(await image.arrayBuffer());
  assert(bytes.length > 10000 && bytes.length < 600000, `${ua}: image size not within target: ${bytes.length}`);
  assert(bytes.slice(0,8).join(",")==="137,80,78,71,13,10,26,10","Bad PNG header");
  const view=new DataView(bytes.buffer);
  assert(view.getUint32(16)===1200 && view.getUint32(20)===630, "Bad OG dimensions");
  console.log(`${ua}: PASS, share image 1200x630 ${bytes.length} bytes`);
}
console.log("HTTP OG PASS. Final visual verification still required in WhatsApp app.");
