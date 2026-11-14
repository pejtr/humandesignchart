/** PR #87 preflight/preview only. No merge, production deploy, login or checkout. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectName = "humandesignchart-web";
const featureBranch = "fix/p0-en-sticky-whatsapp-og-20261112";
const previewBranch = "hd-p0-en-share-preview";
const must = (ok, message) => { if (!ok) throw new Error(message); };
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

export function previewOrigin(raw) {
  const url = new URL(raw);
  must(url.protocol === "https:" && /^[a-z0-9-]+\.humandesignchart-web\.pages\.dev$/.test(url.hostname)
    && !["main", "production"].includes(url.hostname.split(".")[0])
    && !url.port && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash,
  "An isolated HTTPS Pages deployment origin is required; production origins are refused.");
  return url.origin;
}

export function assertIsolatedProject(project) {
  must(project?.name === projectName && project.production_branch === "main", "Unexpected Pages project or production branch.");
  const preview = project.deployment_configs?.preview;
  must(preview && project.deployment_configs.production, "Cannot verify preview environment configuration.");
  const configFields = new Set(["env_vars", "compatibility_date", "compatibility_flags", "always_use_latest_compatibility_date", "usage_model", "limits", "placement", "fail_open", "build_image_major_version"]);
  for (const [key, value] of Object.entries(preview)) {
    const populated = value != null && value !== false && (typeof value !== "object" || Object.keys(value).length > 0);
    must(configFields.has(key) || !populated, "Preview backend binding or unreviewed configuration: " + key);
  }
  for (const [key, value] of Object.entries(preview.env_vars || {})) {
    must(["NODE_ENV", "VITE_OPENAI_ADS_PIXEL_ID"].includes(key) && value?.type === "plain_text",
      "Unsafe or unreviewed preview environment variable: " + key);
  }
}

export function assertSharePng(bytes) {
  must(bytes.length >= 10000 && bytes.length < 600000, "PNG size must be 10,000–599,999 bytes.");
  must(Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10])), "Invalid PNG signature.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  must(view.getUint32(16) === 1200 && view.getUint32(20) === 630, "PNG must be 1200×630.");
}

function meta(html, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (tag.match(/\b(?:property|name)=["']([^"']+)/i)?.[1] === key) {
      return tag.match(/\bcontent=["']([^"']+)/i)?.[1] || "";
    }
  }
  return "";
}

export async function probePreview(raw, fetcher = fetch) {
  const origin = previewOrigin(raw);
  const evidence = [];
  for (const locale of ["en", "cs"]) for (const ua of ["facebookexternalhit/1.1", "WhatsApp/2.24"]) {
    const url = origin + "/" + locale;
    const response = await fetcher(url, { headers: { "User-Agent": ua, Accept: "text/html" }, redirect: "error", signal: AbortSignal.timeout(25000) });
    must(response.status === 200 && (!response.url || new URL(response.url).origin === origin), "Unexpected preview HTML status/origin.");
    must((response.headers.get("content-type") || "").includes("text/html"), "Preview response must be HTML.");
    const html = await response.text();
    for (const key of ["og:title", "og:description", "og:url", "og:image"]) must(meta(html, key), "Missing SSR " + key);
    const image = origin + `/images/og-home-${locale}-share-v2.png`;
    must(meta(html, "og:url") === url && meta(html, "og:image") === image, "OG URL/image must reference the exact preview and locale.");
    must(meta(html, "og:image:secure_url") === image && meta(html, "twitter:image") === image, "Inconsistent preview image metadata.");
    must(meta(html, "robots") === "noindex,nofollow", "Preview must be noindex,nofollow.");
    const png = await fetcher(image, { headers: { "User-Agent": ua, Accept: "image/png" }, redirect: "error", signal: AbortSignal.timeout(25000) });
    must(png.status === 200 && (!png.url || new URL(png.url).origin === origin), "Unexpected preview image status/origin.");
    must((png.headers.get("content-type") || "").startsWith("image/png"), "Preview image must be image/png.");
    const bytes = Buffer.from(await png.arrayBuffer());
    assertSharePng(bytes);
    evidence.push({ locale, ua, url, image, status: response.status, imageStatus: png.status, bytes: bytes.length, dimensions: "1200x630", sha256: sha256(bytes), title: meta(html, "og:title"), description: meta(html, "og:description"), cacheControl: response.headers.get("cache-control"), htmlSha256: sha256(html) });
  }
  return evidence;
}

async function main() {
  const args = process.argv.slice(2);
  must(args.length === 0 || (args.length === 1 && args[0] === "--deploy-preview"), "This is a preview-only command; release and unknown flags are refused.");
  const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  process.chdir(root);
  const output = (bin, args) => execFileSync(bin, args, { encoding: "utf8" }).trim();
  // Windows package-manager launchers are .cmd files. Every command and argument
  // passed here is fixed below or a validated Git SHA; none comes from CLI input.
  const run = (bin, args, env = process.env) => execFileSync(bin, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  must(/github\.com[:/]pejtr\/humandesignchart(?:\.git)?$/.test(output("git", ["remote", "get-url", "origin"])), "Wrong source repository.");
  must(output("git", ["branch", "--show-current"]) === featureBranch, "Use the isolated PR #87 branch.");
  must(!output("git", ["status", "--porcelain", "--untracked-files=all"]), "Source tree must be clean.");
  const commit = output("git", ["rev-parse", "HEAD"]);
  must(/^[a-f\d]{40}$/i.test(commit), "Invalid source commit.");
  must(output("git", ["ls-remote", "origin", "refs/heads/" + featureBranch]).split(/\s/)[0] === commit, "PR branch changed; rebuild and recheck the exact SHA.");
  run("pnpm", ["check"]);
  run("pnpm", ["exec", "vitest", "run", "--maxWorkers=2", "--minWorkers=1"]);
  run("pnpm", ["build:cloudflare"]);
  const images = ["en", "cs"].map(locale => {
    const path = `dist/public/images/og-home-${locale}-share-v2.png`;
    const bytes = readFileSync(path); assertSharePng(bytes);
    return { path, bytes: bytes.length, sha256: sha256(bytes) };
  });
  for (const path of ["dist/public/index.html", "dist/public/_worker.js"]) must(readFileSync(path).length > 3000, "Missing build artifact: " + path);
  must(!output("git", ["status", "--porcelain", "--untracked-files=all"]), "Build modified source tree.");
  const evidenceDir = resolve("qa-artifacts/p0-en-sticky-whatsapp"); mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, "preflight.json"), JSON.stringify({ commit, checkedAt: new Date().toISOString(), images, deployment: "NOT_RUN", browser: "NOT_RUN", whatsapp: "NOT_RUN" }, null, 2));
  if (!args.length) { console.log("LOCAL PREFLIGHT PASS. No deployment, merge or production changes."); return; }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  must(/^[a-f\d]{32}$/i.test(account || "") && token, "Cloudflare account and scoped token required for isolated preview; no upload attempted.");
  const pixel = process.env.VITE_OPENAI_ADS_PIXEL_ID?.trim();
  must(pixel && readdirSync("dist/public/assets").filter(x => x.endsWith(".js")).some(x => readFileSync("dist/public/assets/" + x, "utf8").includes(pixel)), "Configured Ads Pixel identifier must be present in the compiled build.");
  const api = `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${projectName}`;
  const read = async url => {
    const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, redirect: "error", signal: AbortSignal.timeout(25000) });
    must(response.ok, "Cloudflare project read failed: " + response.status);
    const reply = await response.json(); must(reply.success, "Cloudflare API did not confirm success."); return reply.result;
  };
  assertIsolatedProject(await read(api));
  run("npx", ["--yes", "wrangler@4.147.0", "pages", "deploy", "dist/public", "--project-name=" + projectName, "--branch=" + previewBranch, "--commit-hash=" + commit, "--commit-dirty=false"]);
  const deployments = await read(api + "/deployments?env=preview&per_page=20");
  const deployment = deployments.find(d => d.environment === "preview" && d.deployment_trigger?.metadata?.commit_hash === commit && d.deployment_trigger?.metadata?.branch === previewBranch && d.latest_stage?.status === "success");
  must(deployment?.id && deployment.url, "Cannot bind a successful preview deployment to the tested SHA.");
  const origin = previewOrigin(deployment.url);
  writeFileSync(resolve(evidenceDir, "deployment.json"), JSON.stringify({ id: deployment.id, commit, origin, environment: "preview", checkedAt: new Date().toISOString() }, null, 2));
  run(process.execPath, ["scripts/qa/capture-en-share-preview.mjs"], { ...process.env, GIT_SHA: commit, HD_EN_PREVIEW_URL: origin });
  console.log("PREVIEW VALIDATION FINISHED. Actual WhatsApp composer evidence is still required. PR remains Draft; no promotion follows.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
