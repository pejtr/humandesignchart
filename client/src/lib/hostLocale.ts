/**
 * Each brand domain has one default language: humandesignchart.app is the
 * English site, humandesignmapa.cz the Czech one. Other hosts (localhost,
 * previews) fall back to the browser language.
 */
const HOST_LOCALES: Record<string, "cs" | "en"> = {
  "humandesignchart.app": "en",
  "humandesignmapa.cz": "cs",
};

export function hostDefaultLocale(hostname: string): "cs" | "en" | null {
  return HOST_LOCALES[hostname.toLowerCase().replace(/^www\./, "")] ?? null;
}
