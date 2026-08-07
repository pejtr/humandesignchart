import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface JsonLdHeadProps {
  title?: string;
  description?: string;
  url?: string;
}

export function JsonLdHead({
  title = "Avanito Human Design — Osobní Rozbor & Mapa Zdarma",
  description = "Spočítejte si svou Human Design mapu zdarma. Získejte okamžitý výklad typu, profilu, autority a životního poslání s AI Marií.",
  url = "https://humandesign.cz",
}: JsonLdHeadProps) {
  const { locale } = useLanguage();

  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": title,
      "description": description,
      "url": url,
      "applicationCategory": "LifestyleApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CZK",
      },
      "author": {
        "@type": "Organization",
        "name": "Avanito Human Design",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-schema";
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById("json-ld-schema");
      if (existing) document.head.removeChild(existing);
    };
  }, [title, description, url, locale]);

  return null;
}
