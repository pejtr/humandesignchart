/**
 * Public agent-discovery surface for the Cloudflare Pages runtime.
 * This is OpenAPI + a site guide, not a hosted MCP endpoint.
 * No private customer data, tokens or payments are exposed.
 */
const CS = "https://humandesignmapa.cz";
const EN = "https://humandesignchart.app";

export function agentDiscoveryResponse(publicUrl: URL): Response | null {
  const isEnglish = ["humandesignchart.app", "www.humandesignchart.app"].includes(publicUrl.hostname);
  const base = isEnglish ? EN : CS;
  const lang = isEnglish ? "en" : "cs";

  if (publicUrl.pathname === "/llms.txt") {
    const body = (isEnglish ? [
      "# Human Design Chart",
      "",
      "> Free online Human Design calculator and educational readings. Human Design is a symbolic self-reflection system, not a scientific or medical diagnosis.",
      "",
      "## Official content",
      "- Home: " + EN + "/en/",
      "- Free bodygraph calculator: " + EN + "/en/calculate",
      "- Types: " + EN + "/en/human-design-typy",
      "- Generator: " + EN + "/en/types/generator",
      "- Projector: " + EN + "/en/types/projector",
      "- Encyclopedia: " + EN + "/en/encyclopedia",
      "- Articles: " + EN + "/en/blog",
      "- Offers: " + EN + "/en/honorace",
      "",
      "## AI agent integration",
      "- OpenAPI 3.1: " + EN + "/openapi.json",
      "- Public chart calculation: POST " + EN + "/api/gpt/calculate",
      "- Input: birth date, local time and geographic latitude/longitude.",
      "- Output: basic type, strategy, authority and profile, not a purchase or user account.",
      "- Obtain express consent before submitting a person's birth details.",
      "- OpenAPI is not MCP. No hosted /mcp service is advertised as deployed.",
      "",
      "## Languages",
      "- Czech: " + CS + "/cs/",
      "- English: " + EN + "/en/",
      ""
    ] : [
      "# Human Design Mapa",
      "",
      "> Bezplatná online kalkulačka Human Design a vzdělávací výklady. Human Design je symbolický systém sebereflexe, nikoliv vědecky ověřená psychologická či lékařská diagnostika.",
      "",
      "## Oficiální stránky",
      "- Domovská stránka: " + CS + "/cs/",
      "- Human Design kalkulačka zdarma: " + CS + "/cs/human-design-kalkulacka",
      "- Výpočet osobní mapy: " + CS + "/cs/calculate",
      "- Pět typů Human Design: " + CS + "/cs/human-design-typy",
      "- Generátor: " + CS + "/cs/types/generator",
      "- Projektor: " + CS + "/cs/types/projector",
      "- Encyklopedie: " + CS + "/cs/encyclopedia",
      "- Články: " + CS + "/cs/blog",
      "- Nabídka a honorace: " + CS + "/cs/honorace",
      "",
      "## Integrace pro AI agenty",
      "- OpenAPI 3.1: " + CS + "/openapi.json",
      "- Veřejný výpočet: POST " + CS + "/api/gpt/calculate",
      "- Vstup: datum a čas narození, zeměpisná šířka a délka.",
      "- Výstup: typ, strategie, autorita a profil; bez platby a založení účtu.",
      "- Údaje o narození neposílejte bez výslovného souhlasu dotyčné osoby.",
      "- OpenAPI není MCP. Veřejný endpoint /mcp není v této verzi nasazen.",
      "",
      "## Jazyky",
      "- Čeština: " + CS + "/cs/",
      "- English: " + EN + "/en/",
      ""
    ]).join("\n");
    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-language": lang,
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=3600",
      },
    });
  }

  if (publicUrl.pathname === "/openapi.json") {
    const specification = {
      openapi: "3.1.0",
      info: {
        title: isEnglish ? "Human Design Chart Public API" : "Human Design Mapa – veřejné API",
        version: "1.0.0",
        description: isEnglish
          ? "Symbolic self-reflection calculation. Obtain consent before submitting private birth details."
          : "Symbolický výpočet pro sebereflexi. Před odesláním osobních údajů o narození vyžádejte souhlas.",
      },
      servers: [{ url: base }],
      paths: {
        "/api/gpt/calculate": {
          post: {
            operationId: "calculateHumanDesignChart",
            summary: isEnglish ? "Calculate basic Human Design chart" : "Vypočítat základní Human Design mapu",
            description: "Public calculation; no user account or purchase is created by this operation.",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      birthDate: { type: "string", format: "date", description: "YYYY-MM-DD" },
                      birthTime: { type: "string", pattern: "^\\d{2}:\\d{2}$", description: "Local time HH:mm" },
                      latitude: { type: "number", minimum: -90, maximum: 90 },
                      longitude: { type: "number", minimum: -180, maximum: 180 },
                    },
                    required: ["birthDate", "birthTime", "latitude", "longitude"],
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Basic chart attributes without checkout",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        type: { type: "string" },
                        strategy: { type: "string" },
                        authority: { type: "string" },
                        profile: { type: "string" },
                        credits: { type: "string" },
                        sponsorLink: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
              "400": { description: "Invalid input or birth data" },
              "405": { description: "Method not allowed" },
              "500": { description: "Calculation unavailable" },
            },
          },
        },
      },
    };
    return Response.json(specification, {
      headers: {
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  }
  return null;
}
