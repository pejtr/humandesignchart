/**
 * useSEO — centralized meta tag management hook
 * Call this in any page component to set title, description, OG, Twitter Card tags.
 */

const OG_IMAGES = {
  homepage: "/manus-storage/og-homepage.png",
  calculator: "/manus-storage/og-homepage.png",
  blog: "/manus-storage/og-homepage.png",
  pricing: "/manus-storage/og-homepage.png",
  aiGuide: "/manus-storage/og-homepage.png",
  default: "/manus-storage/og-homepage.png",
};

export { OG_IMAGES };

export interface SEOOptions {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "article";
  ogUrl?: string;
  locale?: string;
  keywords?: string;
  noIndex?: boolean;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    // Determine whether to set name or property attribute
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

export function useSEO(options: SEOOptions) {
  const {
    title,
    description,
    ogImage = OG_IMAGES.default,
    ogType = "website",
    ogUrl = window.location.href,
    locale = "cs_CZ",
    keywords,
    noIndex = false,
  } = options;

  // Title
  document.title = title;

  // Description
  setMeta('meta[name="description"]', "content", description);

  // Keywords
  if (keywords) {
    setMeta('meta[name="keywords"]', "content", keywords);
  }

  // Robots
  if (noIndex) {
    setMeta('meta[name="robots"]', "content", "noindex, nofollow");
  }

  // Open Graph
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
}
