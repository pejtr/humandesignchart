/**
 * useSEO — centralized meta tag management hook with JSON-LD, hreflang, canonical.
 * Call this in any page component to set title, description, OG, Twitter Card, structured data.
 */

import { useEffect } from "react";

const OG_IMAGES = {
  homepage: "/images/og-homepage.png",
  calculator: "/images/og-homepage.png",
  blog: "/images/og-homepage.png",
  pricing: "/images/og-homepage.png",
  aiGuide: "/images/og-homepage.png",
  default: "/images/og-homepage.png",
};

export { OG_IMAGES };

export interface SEOOptions {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  ogUrl?: string;
  locale?: string;
  keywords?: string;
  noIndex?: boolean;
  /** Alternate locale URLs for hreflang */
  alternateLocales?: { lang: string; url: string }[];
  /** JSON-LD structured data to inject */
  jsonLd?: Record<string, any>;
  /** Article-specific meta */
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  /** Twitter author handle */
  twitterCreator?: string;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    if (selector.includes('property="')) {
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      if (prop) el.setAttribute("property", prop);
    } else if (selector.includes('name="')) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setHreflang(lang: string, href: string) {
  const selector = `link[hreflang="${lang}"]`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", lang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: Record<string, any>) {
  const id = "useSEO-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  const el = document.getElementById("useSEO-jsonld");
  if (el) el.remove();
}

export function useSEO(options: SEOOptions) {
  const {
    title,
    description,
    ogImage = OG_IMAGES.default,
    ogType = "website",
    ogUrl = typeof window !== "undefined" ? window.location.href : "",
    locale = "cs_CZ",
    keywords,
    noIndex = false,
    alternateLocales,
    jsonLd,
    articlePublishedTime,
    articleModifiedTime,
    articleAuthor,
    twitterCreator,
  } = options;

  useEffect(() => {
    document.title = title;
    // Set <html lang> dynamically for correct language signal to crawlers
    const langCode = locale === "cs_CZ" ? "cs" : locale === "en_US" ? "en" : locale === "ru_RU" ? "ru" : locale === "uk_UA" ? "uk" : locale === "de_DE" ? "de" : locale === "hu_HU" ? "hu" : (locale || "cs").split("_")[0];
    document.documentElement.setAttribute("lang", langCode);
    setMeta('meta[name="description"]', "content", description);
    if (keywords) setMeta('meta[name="keywords"]', "content", keywords);
    if (noIndex) {
      setMeta('meta[name="robots"]', "content", "noindex, nofollow");
    } else {
      const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (robots) robots.remove();
    }

    // OpenGraph
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", ogType);
    setMeta('meta[property="og:url"]', "content", ogUrl);
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:image:width"]', "content", "1200");
    setMeta('meta[property="og:image:height"]', "content", "630");
    setMeta('meta[property="og:locale"]', "content", locale);
    setMeta('meta[property="og:site_name"]', "content", "Human Design Mapa");

    // Twitter Card
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", ogImage);
    setMeta('meta[name="twitter:site"]', "content", "@humandesignmapa");
    if (twitterCreator) {
      setMeta('meta[name="twitter:creator"]', "content", twitterCreator);
    }

    // Article-specific OG tags
    if (articlePublishedTime) {
      setMeta('meta[property="article:published_time"]', "content", articlePublishedTime);
    }
    if (articleModifiedTime) {
      setMeta('meta[property="article:modified_time"]', "content", articleModifiedTime);
    }
    if (articleAuthor) {
      setMeta('meta[property="article:author"]', "content", articleAuthor);
    }

    // Canonical URL
    const canonicalUrl = ogUrl.split("?")[0];
    setCanonical(canonicalUrl);

    // Hreflang alternate links
    if (alternateLocales) {
      for (const alt of alternateLocales) {
        setHreflang(alt.lang, alt.url);
      }
      // x-default points to English version
      const defaultAlt = alternateLocales.find(a => a.lang === "en");
      if (defaultAlt) {
        setHreflang("x-default", defaultAlt.url);
      }
    }

    // JSON-LD structured data
    if (jsonLd) {
      setJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }

    return () => {
      // Cleanup JSON-Ld on unmount to prevent stale data
      removeJsonLd();
    };
  }, [title, description, ogImage, ogType, ogUrl, locale, keywords, noIndex, alternateLocales, jsonLd, articlePublishedTime, articleModifiedTime, articleAuthor, twitterCreator]);
}
