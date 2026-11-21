import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve("client/src/pages/HomeWow.css"), "utf8");
const home = readFileSync(resolve("client/src/pages/Home.tsx"), "utf8");

describe("CZ homepage ambient background", () => {
  it("stays behind the hero as decorative, non-interactive CSS", () => {
    expect(home).toContain('className="hd-wow-ambient" aria-hidden="true"');
    expect(css).toContain(".hd-wow-ambient::before");
    expect(css).toContain(".hd-wow-ambient::after");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("z-index: -1");
  });

  it("uses slow transform-only drift without touching CTA animations", () => {
    expect(css).toContain("@keyframes hd-wow-ambient-aurora");
    expect(css).toContain("@keyframes hd-wow-ambient-stars");
    expect(css).toContain("42s ease-in-out infinite alternate");
    expect(css).toContain("65s linear infinite alternate");
    expect(css).toContain("translate3d(");
    expect(css).toContain(".hd-wow-actions .hd-wow-primary:focus-visible");
  });

  it("provides no-animation fallbacks for reduced motion and mobile", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transform: none !important");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain(".hd-wow-ambient::after { opacity: .3; }");
  });
});
