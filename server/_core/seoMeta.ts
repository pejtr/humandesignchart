/**
 * Server-side SEO meta tag generation.
 * Maps URL paths to page-specific <title>, <meta>, <link rel="canonical">, and hreflang
 * so crawlers receive correct metadata in the initial HTML response (no JS required).
 */

import { BLOG_ARTICLES } from "../data/blogArticles";
import { BLOG_ARTICLES_EN } from "../data/blogArticlesEn";
import { ANGEL_NUMBERS } from "../data/angelNumbers";

const CS = "https://www.humandesignmapa.cz";
const EN = "https://www.humandesignchart.app";

interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Build the full <head> meta injection HTML for a given locale + path. */
export function buildSeoHead(locale: string, pathname: string): string {
  const meta = resolveMeta(locale, pathname);
  if (!meta) return "";

  const isEn = locale === "en";
  const base = isEn ? EN : CS;
  const lang = isEn ? "en" : locale;
  const canonical = meta.canonical;
  const ogImage = meta.ogImage || `${CS}/images/og-homepage.png`;

  // Build alternate hreflang links — cs always on CS domain, others on EN domain
  const altPath = canonical.replace(CS, "").replace(EN, "");
  const csAlt = CS + altPath;
  const enAlt = EN + "/en" + altPath;

  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:type" content="${meta.ogType || "website"}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="${isEn ? "en_US" : "cs_CZ"}" />`,
    `<meta property="og:site_name" content="${isEn ? "Human Design Chart" : "Human Design Mapa"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:site" content="@humandesignmapa" />`,
    meta.keywords ? `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />` : "",
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="cs" href="${csAlt}" />`,
    `<link rel="alternate" hreflang="en" href="${enAlt}" />`,
    `<link rel="alternate" hreflang="x-default" href="${enAlt}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

function resolveMeta(locale: string, pathname: string): RouteMeta | null {
  const isEn = locale === "en";
  const base = isEn ? EN : CS;
  const slug = pathname.replace(`/${locale}/`, "").replace(`/${locale}`, "").replace(/^\/+/, "");

  // ── Static routes ──────────────────────────────────────────────────
  const staticRoutes: Record<string, RouteMeta> = {
    "": {
      title: isEn
        ? "Free Human Design Chart — Calculator & AI Reading | HumanDesignChart.app"
        : "✨ Human Design Mapa Zdarma — Kalkulátor & AI Výklad 🔮 | HumanDesignMapa.cz",
      description: isEn
        ? "Calculate your Human Design chart for free. Discover your type, strategy, authority, and profile. Get a personalized AI reading."
        : "Vypočítejte svou Human Design mapu zdarma. Zjistěte svůj typ, strategii, autoritu a profil. Získejte personalizovaný AI výklad v češtině.",
      canonical: `${base}/${locale}/`,
      keywords: isEn
        ? "human design, human design chart, bodygraph calculator, free human design, human design reading, type, strategy, authority"
        : "human design, human design mapa, bodygraph kalkulátor, human design zdarma, human design česky, typ human design, autorita human design, inkarnační kříž, AI výklad human design",
    },
    calculate: {
      title: isEn
        ? "Human Design Calculator — Free Bodygraph Chart | HumanDesignChart.app"
        : "Kalkulátor Human Design — Zdarma Tělo Graf 📊 | HumanDesignMapa.cz",
      description: isEn
        ? "Calculate your Human Design bodygraph for free. Enter your birth data and discover your type, strategy, authority, and profile."
        : "Vypočítejte si svůj Human Design bodygraph zdarma. Zadejte své datum narození a objevte svůj typ, strategii, autoritu a profil.",
      canonical: `${base}/${locale}/calculate`,
    },
    "human-design-kalkulacka": {
      title: isEn
        ? "Human Design Calculator — Free Bodygraph Chart | HumanDesignChart.app"
        : "Human Design Kalkulačka — Zdarma Výpočet Mapy 🧮 | HumanDesignMapa.cz",
      description: isEn
        ? "Calculate your Human Design bodygraph for free. Enter your birth data and discover your type, strategy, authority, and profile."
        : "Vypočítejte si svůj Human Design zdarma. Zadejte datum, čas a místo narození pro kompletní rozbor vaší energetické mapy.",
      canonical: `${base}/${locale}/human-design-kalkulacka`,
    },
    "human-design-test": {
      title: isEn
        ? "Human Design Test — Discover Your Type | HumanDesignChart.app"
        : "Human Design Test — Zjistěte Svůj Typ 🧪 | HumanDesignMapa.cz",
      description: isEn
        ? "Take our Human Design test to discover your type. Answer questions about your life experience and find out if you are a Generator, Projector, Manifestor, or Reflector."
        : "Udělejte si náš Human Design test a zjistěte svůj typ. Odpovězte na otázky o svém životě a zjistěte, zda jste Generator, Projektor, Manifestor nebo Reflektor.",
      canonical: `${base}/${locale}/human-design-test`,
    },
    "human-design-typy": {
      title: isEn
        ? "Human Design Types — Generator, Projector, Manifestor, Reflector | HumanDesignChart.app"
        : "Typy Human Design — Generator, Projektor, Manifestor, Reflektor 👥 | HumanDesignMapa.cz",
      description: isEn
        ? "Discover the 5 Human Design types: Generator, Manifesting Generator, Projector, Manifestor, and Reflector. Learn their strategies and authorities."
        : "Objevte 5 typů Human Design: Generator, Manifestující Generator, Projektor, Manifestor a Reflektor. Naučte se jejich strategie a autority.",
      canonical: `${base}/${locale}/human-design-typy`,
    },
    encyclopedia: {
      title: isEn
        ? "Human Design Encyclopedia — Gates, Channels, Centers | HumanDesignChart.app"
        : "Encyklopedie Human Design — Brány, Dráhy, Centra 📚 | HumanDesignMapa.cz",
      description: isEn
        ? "Complete Human Design encyclopedia: gates, channels, centers, and more. Look up any Human Design concept."
        : "Kompletní encyklopedie Human Design: brány, dráhy, centra a další. Vyhledejte jakýkoliv pojem z Human Design.",
      canonical: `${base}/${locale}/encyclopedia`,
    },
    "ai-guide": {
      title: isEn
        ? "AI Human Design Guide — Personalized Reading | HumanDesignChart.app"
        : "AI Průvodce Human Design — Osobní Výklad 🤖 | HumanDesignMapa.cz",
      description: isEn
        ? "Get a personalized AI reading of your Human Design chart. Understand your type, strategy, authority, profile, and life purpose."
        : "Získejte personalizovaný AI výklad vaší Human Design mapy. Pochopte svůj typ, strategii, autoritu, profil a životní poslání.",
      canonical: `${base}/${locale}/ai-guide`,
    },
    transits: {
      title: isEn
        ? "Human Design Transits — Current planetary positions | HumanDesignChart.app"
        : "Tranzity Human Design — Aktuální planetární pozice 🪐 | HumanDesignMapa.cz",
      description: isEn
        ? "See today's Human Design transits. Understand how planetary positions affect your chart and energy."
        : "Podívejte se na dnešní tranzity Human Design. Pochopení, jak planetární pozice ovlivňují vaši mapu a energii.",
      canonical: `${base}/${locale}/transits`,
    },
    "transit-calendar": {
      title: isEn
        ? "Transit Calendar — Human Design Planetary Movements | HumanDesignChart.app"
        : "Kalendář Tranzitů — Planetární Pohyby Human Design 📅 | HumanDesignMapa.cz",
      description: isEn
        ? "Human Design transit calendar. See upcoming planetary shifts and their influence on your energy."
        : "Kalendář tranzitů Human Design. Sledujte nadcházející planetární změny a jejich vliv na vaši energii.",
      canonical: `${base}/${locale}/transit-calendar`,
    },
    celebrities: {
      title: isEn
        ? "Celebrity Human Design Charts — Famous People | HumanDesignChart.app"
        : "Human Design Slavných osobností — Známé Osobnosti 🌟 | HumanDesignMapa.cz",
      description: isEn
        ? "Explore Human Design charts of famous celebrities. See what type, profile, and authority your favorite stars have."
        : "Prozkoumejte Human Design mapy slavných celebrit. Podívejte se, jaký typ, profil a autoritu mají vaše oblíbené hvězdy.",
      canonical: `${base}/${locale}/celebrities`,
    },
    compare: {
      title: isEn
        ? "Compare Human Design Charts — Relationship Analysis | HumanDesignChart.app"
        : "Porovnání Human Design Map — Vztahová Analýza 💑 | HumanDesignMapa.cz",
      description: isEn
        ? "Compare two Human Design charts side by side. Understand relationship dynamics and compatibility."
        : "Porovnejte dvě Human Design mapy vedle sebe. Pochopte dynamiku vztahů a kompatibilitu.",
      canonical: `${base}/${locale}/compare`,
    },
    composite: {
      title: isEn
        ? "Composite Human Design Chart — Relationship Synthesis | HumanDesignChart.app"
        : "Kompozitní Human Design Mapa — Syntéza Vztahu 💑 | HumanDesignMapa.cz",
      description: isEn
        ? "Create a composite Human Design chart from two people. See the synthesized energy of your relationship."
        : "Vytvořte kompozitní Human Design mapu ze dvou lidí. Uviděte syntézu energie vašeho vztahu.",
      canonical: `${base}/${locale}/composite`,
    },
    "role-compatibility": {
      title: isEn
        ? "Role Compatibility — Human Design Relationship Roles | HumanDesignChart.app"
        : "Kompatibilita Rolí — Vztahové Role v Human Design 🤝 | HumanDesignMapa.cz",
      description: isEn
        ? "Understand compatibility between Human Design types. See how different roles interact in relationships."
        : "Pochopení kompatibility mezi typy Human Design. Podívejte se, jak různé role interagují ve vztazích.",
      canonical: `${base}/${locale}/role-compatibility`,
    },
    "return-chart": {
      title: isEn
        ? "Return Chart — Solar Return Human Design | HumanDesignChart.app"
        : "Return Chart — Sluneční Návrat Human Design 🔄 | HumanDesignMapa.cz",
      description: isEn
        ? "Generate your Solar Return Human Design chart. See your energy blueprint for the current year."
        : "Vygenerujte si sluneční návrat Human Design mapy. Podívejte se na energetický plán pro aktuální rok.",
      canonical: `${base}/${locale}/return-chart`,
    },
    variables: {
      title: isEn
        ? "Human Design Variables — Digestion, Environment, Perspective | HumanDesignChart.app"
        : "Proměnné Human Design — Strava, Prostředí, Perspektiva 🔬 | HumanDesignMapa.cz",
      description: isEn
        ? "Explore Human Design variables: digestion, environment, view, motivation, and more. Deep dive into your body's mechanics."
        : "Prozkoumejte proměnné Human Design: stravu, prostředí, pohled, motivaci a další. Hluboký ponor do mechaniky vašeho těla.",
      canonical: `${base}/${locale}/variables`,
    },
    iching: {
      title: isEn
        ? "I Ching & Human Design — Hexagrams & Gates | HumanDesignChart.app"
        : "I Ching a Human Design — Hexagramy a Brány ☯️ | HumanDesignMapa.cz",
      description: isEn
        ? "Explore the connection between I Ching hexagrams and Human Design gates. Understand the ancient wisdom in your chart."
        : "Prozkoumejte spojení mezi hexagramy I Ching a branami Human Design. Pochopte starověkou moudrost ve vaší mapě.",
      canonical: `${base}/${locale}/iching`,
    },
    "incarnation-cross": {
      title: isEn
        ? "Incarnation Cross — Life Purpose in Human Design | HumanDesignChart.app"
        : "Inkarnační Kříž — Životní Poslání v Human Design ✝️ | HumanDesignMapa.cz",
      description: isEn
        ? "Discover your Incarnation Cross and understand your life purpose in Human Design. Learn about the 4 types of Incarnation Crosses."
        : "Objevte svůj inkarnační kříž a pochopte své životní poslání v Human Design. Zjistěte o 4 typech inkarnačních křížů.",
      canonical: `${base}/${locale}/incarnation-cross`,
    },
    "daily-transit": {
      title: isEn
        ? "Daily Transit — Today's Human Design Energy | HumanDesignChart.app"
        : "Denní Tranzit — Dnešní Energia Human Design 🌅 | HumanDesignMapa.cz",
      description: isEn
        ? "See today's Human Design transit. Understand the daily energy and how it affects you."
        : "Podívejte se na dnešní tranzit Human Design. Pochopení denní energie a jak ovlivňuje vás.",
      canonical: `${base}/${locale}/daily-transit`,
    },
    pricing: {
      title: isEn
        ? "Pricing — Human Design Plans & Features | HumanDesignChart.app"
        : "Ceník — Plány a Funkce Human Design 💰 | HumanDesignMapa.cz",
      description: isEn
        ? "Choose the right Human Design plan for you. Free, Pro, and Premium options with AI readings, transit alerts, and more."
        : "Vyberte si správný plán Human Design. Zdarma, Pro a Premium možnosti s AI výklady, upozorněními na tranzity a dalšími.",
      canonical: `${base}/${locale}/pricing`,
    },
    blog: {
      title: isEn
        ? "Human Design Blog — Articles & Guides | HumanDesignChart.app"
        : "Blog o Human Design — Články a Průvodce ✍️ | HumanDesignMapa.cz",
      description: isEn
        ? "Expert articles about Human Design: types, strategies, authority, profiles, gates, channels and more."
        : "Odborné články o Human Design: typy, strategie, autorita, profily, brány, dráhy a další.",
      canonical: `${base}/${locale}/blog`,
    },
    andelska: {
      title: isEn
        ? "Angel Numbers — Meanings & Interpretations | HumanDesignChart.app"
        : "Andělská Čísla — Významy a Výklady 👼 | HumanDesignMapa.cz",
      description: isEn
        ? "Discover the meaning of angel numbers. Learn what numbers like 111, 222, 333, 444 and more mean for your life."
        : "Objevte význam andělských čísel. Zjistěte, co znamenají čísla jako 111, 222, 333, 444 a další pro váš život.",
      canonical: `${base}/${locale}/andelska-cisla`,
    },
    "reddit-human-design": {
      title: isEn
        ? "Reddit Human Design — Community Guide | HumanDesignChart.app"
        : "Reddit Human Design — Průvodce Komunitou 📱 | HumanDesignMapa.cz",
      description: isEn
        ? "Your guide to the Human Design community on Reddit. Find the best subreddits and discussions."
        : "Váš průvodce komunitou Human Design na Redditu. Najděte nejlepší subreddity a diskuse.",
      canonical: `${base}/${locale}/reddit-human-design`,
    },
  };

  // Check exact static match
  if (staticRoutes[slug]) {
    return staticRoutes[slug];
  }

  // ── Dynamic: /partner/:referralCode ───────────────────────────────
  // Clean, share-friendly invite URL. The client redirects people to
  // the calculator while crawlers receive a complete preview card.
  if (slug.startsWith("partner/")) {
    const referralCode = slug.replace("partner/", "").split(/[?#]/)[0];
    return {
      title: isEn
        ? "Let's Compare Our Human Design Charts ✨"
        : "Pojďme porovnat naše Human Design mapy ✨",
      description: isEn
        ? "Create your free chart and discover the energy, strengths and dynamics of our relationship."
        : "Vytvořte si zdarma svou mapu a objevte energii, silné stránky i dynamiku našeho vztahu.",
      canonical: `${base}/${locale}/partner/${encodeURIComponent(referralCode)}`,
      ogImage: `${CS}/images/og-homepage.png`,
    };
  }

  // ── Dynamic: /types/:type ──────────────────────────────────────────
  if (slug.startsWith("types/")) {
    const type = slug.replace("types/", "");
    const typeNames: Record<string, { cs: string; en: string }> = {
      generator: { cs: "Generator", en: "Generator" },
      "manifesting-generator": { cs: "Manifestující Generator", en: "Manifesting Generator" },
      projector: { cs: "Projektor", en: "Projector" },
      manifestor: { cs: "Manifestor", en: "Manifestor" },
      reflector: { cs: "Reflektor", en: "Reflector" },
    };
    const t = typeNames[type];
    if (t) {
      return {
        title: isEn
          ? `${t.en} — Human Design Type Strategy & Authority | HumanDesignChart.app`
          : `${t.cs} — Typ Human Design Strategie a Autorita 👤 | HumanDesignMapa.cz`,
        description: isEn
          ? `Learn about the ${t.en} type in Human Design. Discover their strategy, authority, and how they interact with the world.`
          : `Dozvěděte se o typu ${t.cs} v Human Design. Objevte jejich strategii, autoritu a jak interagují se světem.`,
        canonical: `${base}/${locale}/types/${type}`,
      };
    }
  }

  // ── Dynamic: /blog/:slug ───────────────────────────────────────────
  if (slug.startsWith("blog/")) {
    const blogSlug = slug.replace("blog/", "");
    const articles = isEn ? BLOG_ARTICLES_EN : BLOG_ARTICLES;
    const art = articles.find((a) => a.slug === blogSlug);
    if (art) {
      return {
        title: art.metaTitle || art.title,
        description: art.metaDescription || art.excerpt,
        canonical: `${base}/${locale}/blog/${art.slug}`,
        ogType: "article",
        ogImage: art.coverImage?.startsWith("http") ? art.coverImage : undefined,
      };
    }
    // Fallback for unknown blog slugs
    return {
      title: isEn ? "Blog Article | HumanDesignChart.app" : "Článek na Blogu | HumanDesignMapa.cz",
      description: isEn ? "Read this article about Human Design." : "Přečtěte si tento článek o Human Design.",
      canonical: `${base}/${locale}/blog/${blogSlug}`,
      ogType: "article",
    };
  }

  // ── Dynamic: /andelska-cisla/:slug ─────────────────────────────────
  if (slug.startsWith("andelska-cisla/")) {
    const angelSlug = slug.replace("andelska-cisla/", "");
    const art = ANGEL_NUMBERS.find((a) => a.slug === angelSlug);
    if (art) {
      return {
        title: art.metaTitle || art.title,
        description: art.metaDescription || art.excerpt,
        canonical: `${base}/${locale}/andelska-cisla/${art.slug}`,
        ogType: "article",
      };
    }
    return {
      title: isEn ? "Angel Number | HumanDesignChart.app" : "Andělské Číslo | HumanDesignMapa.cz",
      description: isEn ? "Discover the meaning of this angel number." : "Objevte význam tohoto andělského čísla.",
      canonical: `${base}/${locale}/andelska-cisla/${angelSlug}`,
      ogType: "article",
    };
  }

  // No match — return null (use default index.html meta)
  return null;
}
