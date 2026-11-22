/**
 * Public text-first HTML fallback: same content visible to humans and crawlers
 * while the SPA loads. React replaces it at mount; no bot-specific markup.
 * Never touch authenticated, payment, calculated-chart or API routes.
 */
import { BLOG_ARTICLES } from "../server/data/blogArticles";
import { BLOG_ARTICLES_EN } from "../server/data/blogArticlesEn";

const TYPES = new Set(["generator", "manifesting-generator", "projector", "manifestor", "reflector"]);
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function textOnly(input: string): string {
  return input.replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_#>|]/g, "")
    .replace(/\s+/g, " ").trim();
}
function nav(locale: "en" | "cs"): string {
  const links = locale === "en"
    ? [["Free calculator", "calculate"], ["Human Design types", "human-design-typy"],
       ["Guides and articles", "blog"]]
    : [["Kalkulačka zdarma", "human-design-kalkulacka"],
       ["Typy Human Design", "human-design-typy"], ["Články a průvodce", "blog"]];
  return '<nav aria-label="Explore Human Design">' + links.map(([label, path]) =>
    '<a href="/' + locale + '/' + path + '">' + esc(label) + '</a>').join(" · ") + "</nav>";
}
function frame(locale: "en" | "cs", heading: string, body: string): string {
  const notice = locale === "en"
    ? "Human Design is a symbolic self-reflection system, not a scientifically validated diagnostic method."
    : "Human Design je symbolický systém sebereflexe, nikoli vědecky ověřená diagnostická metoda.";
  return '<main data-initial-seo-content="public" lang="' + locale +
    '" style="max-width:840px;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif;line-height:1.65">' +
    "<h1>" + esc(heading) + "</h1>" + body + nav(locale) +
    '<p style="font-size:.9rem;opacity:.75">' + esc(notice) + "</p></main>";
}
function excerptFromArticle(markdown: string): string {
  // Strictly reuse published copy; never fabricate article claims.
  return markdown.split(/\n\s*\n/).map(textOnly)
    .filter(text => text.length >= 90 && !/^https?:\/\//.test(text))
    .slice(0, 4).map(text => "<p>" + esc(text.slice(0, 650)) + "</p>").join("");
}
export function initialPublicHtml(url: URL): string | null {
  const match = /^\/(cs|en)(?:\/(.*))?$/.exec(url.pathname);
  if (!match) return null;
  const locale = match[1] as "cs" | "en";
  const slug = (match[2] || "").replace(/\/$/, "");
  const english = locale === "en";
  const enHost = ["humandesignchart.app", "www.humandesignchart.app"].includes(url.hostname);
  const csHost = ["humandesignmapa.cz", "www.humandesignmapa.cz"].includes(url.hostname);
  if (english ? !enHost : !csHost) return null;
  const articles = english ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
  if (slug === "") {
    const description = english
      ? "Enter your birth date, time and place to calculate a free Human Design bodygraph. Discover your symbolic type, strategy, inner authority and profile and explore educational guides."
      : "Zadejte datum, čas a místo narození a vypočítejte si Human Design mapu zdarma. Poznejte svůj typ, strategii, autoritu a profil a prohlédněte si vzdělávací průvodce.";
    const latest = articles.slice(0, 8).map(article =>
      '<li><a href="/' + locale + "/blog/" + esc(article.slug) + '">' + esc(article.title) + "</a></li>").join("");
    return frame(locale, english ? "Free Human Design Chart & Bodygraph Calculator" :
      "Human Design mapa a kalkulačka zdarma",
      "<p>" + esc(description) + "</p><h2>" +
      (english ? "Read our guides" : "Čtěte naše průvodce") + "</h2><ul>" + latest + "</ul>");
  }
  if (slug === "calculate" || slug === "human-design-kalkulacka") {
    const description = english
      ? "Calculate a Human Design bodygraph using your birth date, local birth time and location. Explore symbolic type, strategy, authority and profile."
      : "Spočítejte si Human Design bodygraph podle data, času a místa narození. Zjistěte svůj symbolický typ, strategii, autoritu a profil.";
    return frame(locale, english ? "Free Human Design Bodygraph Calculator" : "Human Design kalkulačka zdarma",
      "<p>" + esc(description) + "</p>");
  }
  if (slug === "blog") {
    const items = articles.map(article => '<li><a href="/' + locale + "/blog/" + esc(article.slug) +
      '">' + esc(article.title) + "</a> — " + esc(article.excerpt.slice(0, 160)) + "</li>").join("");
    return frame(locale, english ? "Human Design guides and articles" : "Články a průvodce Human Design",
      "<ul>" + items + "</ul>");
  }
  if (slug.startsWith("blog/")) {
    const name = slug.slice(5);
    if (!name || name.includes("/")) return null;
    const article = articles.find(entry => entry.slug === name);
    if (!article) return null;
    return frame(locale, article.title,
      "<p>" + esc(article.excerpt) + "</p>" + excerptFromArticle(article.content || ""));
  }
  if (slug === "human-design-typy") {
    const labels = [...TYPES];
    const text = english
      ? "Human Design describes five symbolic types: Generator, Manifesting Generator, Projector, Manifestor and Reflector. Explore their traditional interpretations."
      : "Human Design rozlišuje pět symbolických typů: Generátor, Manifestující Generátor, Projektor, Manifestor a Reflektor. Prozkoumejte jejich tradiční výklady.";
    return frame(locale, english ? "The five Human Design types" : "Pět typů Human Design",
      "<p>" + esc(text) + "</p><ul>" +
      labels.map(type => '<li><a href="/' + locale + "/types/" + type + '">' +
        esc(type.replace(/-/g, " ")) + "</a></li>").join("") + "</ul>");
  }
  if (slug.startsWith("types/")) {
    const type = slug.slice(6);
    if (!TYPES.has(type)) return null;
    const label = type.replace(/-/g, " ");
    const text = english
      ? "Explore the " + label + " type and its traditional Human Design strategy and authority."
      : "Poznejte typ " + label + " a jeho tradiční strategii a autoritu v Human Design.";
    return frame(locale, english ? label + " — Human Design type" : label + " — typ Human Design",
      "<p>" + esc(text) + "</p>");
  }
  return null;
}
