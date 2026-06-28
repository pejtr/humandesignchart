// Audit all imports for case-sensitivity / missing-file issues against the GIT index.
// Git index = exactly what Railway (Linux, case-sensitive) checks out.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

// Files as git tracks them (exact casing stored in the repo).
const tracked = execSync("git ls-files", { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
  .toString()
  .split("\n")
  .filter(Boolean)
  .map((p) => p.replace(/\\/g, "/"));

const trackedSet = new Set(tracked); // case-SENSITIVE membership
const trackedLowerMap = new Map(); // lowercase -> actual, to detect case bugs
for (const f of tracked) trackedLowerMap.set(f.toLowerCase(), f);

const aliases = {
  "@/": "client/src/",
  "@shared/": "shared/",
  "@assets/": "attached_assets/",
};

const exts = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"];
const indexExts = [
  "/index.ts",
  "/index.tsx",
  "/index.js",
  "/index.jsx",
  "/index.mjs",
];

// Resolve a candidate import path (repo-relative, posix) to a tracked file.
// Returns { ok: true } | { ok: 'case', actual } | { ok: false }
function resolveCandidate(rel) {
  const candidates = [];
  for (const e of exts) candidates.push(rel + e);
  for (const e of indexExts) candidates.push(rel + e);
  // exact-case hit
  for (const c of candidates) if (trackedSet.has(c)) return { ok: true };
  // case-insensitive hit => CASE BUG
  for (const c of candidates) {
    const hit = trackedLowerMap.get(c.toLowerCase());
    if (hit) return { ok: "case", actual: hit, tried: c };
  }
  return { ok: false };
}

const sourceFiles = tracked.filter((f) =>
  /^(client\/src|server|shared)\/.*\.(ts|tsx|js|jsx|mjs)$/.test(f)
);

const importRe =
  /(?:import\b[^'"]*?from\s*|import\s*|export\b[^'"]*?from\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

const problems = [];

for (const file of sourceFiles) {
  const abs = path.join(ROOT, file);
  let code;
  try {
    code = fs.readFileSync(abs, "utf-8");
  } catch {
    continue;
  }
  const dir = path.posix.dirname(file);
  let m;
  while ((m = importRe.exec(code))) {
    const spec = m[1];
    let rel = null;
    if (spec.startsWith("@/")) rel = aliases["@/"] + spec.slice(2);
    else if (spec.startsWith("@shared/")) rel = aliases["@shared/"] + spec.slice(8);
    else if (spec.startsWith("@assets/")) rel = aliases["@assets/"] + spec.slice(8);
    else if (spec.startsWith("./") || spec.startsWith("../"))
      rel = path.posix.normalize(path.posix.join(dir, spec));
    else continue; // bare module (node_modules) — skip

    rel = rel.replace(/\/$/, "");
    const res = resolveCandidate(rel);
    if (res.ok === true) continue;
    problems.push({
      file,
      spec,
      resolvedTo: rel,
      kind: res.ok === "case" ? "CASE-MISMATCH" : "MISSING",
      actual: res.actual || null,
    });
  }
}

if (problems.length === 0) {
  console.log("OK: vsechny relativni/alias importy se v git indexu resolvuji case-exact. Zadny Linux-build problem.");
} else {
  console.log(`NALEZENO ${problems.length} problemovych importu:\n`);
  for (const p of problems) {
    console.log(`[${p.kind}] ${p.file}`);
    console.log(`   import "${p.spec}"  ->  ${p.resolvedTo}`);
    if (p.actual) console.log(`   git ma soubor jako: ${p.actual}`);
    console.log("");
  }
}
