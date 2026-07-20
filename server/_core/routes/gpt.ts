import { Express, Request, Response } from "express";

export function registerGptRoutes(app: Express) {
  // ─── Custom GPT SEO Backlink Endpoint ──────────────────────────────────
  app.post("/api/gpt/calculate", async (req: Request, res: Response) => {
    try {
      const { birthDate, birthTime, latitude, longitude, timezoneOffset, timezone } = req.body;
      if (!birthDate || !birthTime || latitude == null || longitude == null || timezoneOffset == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const { calculateChart } = await import("../humandesign");
      const chart = calculateChart(
        birthDate,
        birthTime,
        "API request",
        Number(latitude),
        Number(longitude),
        Number(timezoneOffset),
        timezone || "UTC",
      );
      const protocol = req.hostname.includes("localhost") ? "http" : "https";
      const isEn = req.hostname.includes("default") || req.hostname.includes("app") || req.hostname.includes("chart.com");
      const domain = isEn ? "www.humandesignchart.app" : "www.humandesignmapa.cz";

      res.json({
        success: true,
        credits: `Data provided by ${domain}`,
        sponsorLink: `${protocol}://${domain}`,
        type: chart.type,
        strategy: chart.strategy,
        authority: chart.authority,
        profile: chart.profile
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ─── OpenAPI Spec ──────────────────────────────────────────────────────
  app.get("/openapi.json", (req, res) => {
    const protocol = req.hostname.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${req.query.host || req.hostname}`;
    res.json({
      "openapi": "3.1.0",
      "info": {
        "title": "Human Design Calculator API",
        "description": "Free API for calculating Human Design charts.",
        "version": "1.0.0"
      },
      "servers": [{ "url": baseUrl }],
      "paths": {
        "/api/gpt/calculate": {
          "post": {
            "summary": "Calculate Bodygraph",
            "operationId": "calculateBodygraph",
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "birthDate": { "type": "string", "example": "1990-05-15" },
                      "birthTime": { "type": "string", "example": "14:30" },
                      "latitude": { "type": "number", "example": 50.0755 },
                      "longitude": { "type": "number", "example": 14.4378 },
                      "timezone": { "type": "string", "example": "Europe/Prague" },
                      "timezoneOffset": { "type": "number", "example": 1 }
                    },
                    "required": ["birthDate", "birthTime", "latitude", "longitude", "timezoneOffset"]
                  }
                }
              }
            },
            "responses": {
              "200": { "description": "Returns basic Human Design reading (type, strategy, authority, profile)." }
            }
          }
        }
      }
    });
  });
}
