import { describe, expect, it } from "vitest";
import { agentDiscoveryResponse } from "../workers/agent-discovery";

describe("Cloudflare production SEO/GEO and agent discovery", () => {
  it("provides a real Czech llms.txt with accurate, useful links and no invented MCP", async () => {
    const response = agentDiscoveryResponse(new URL("https://humandesignmapa.cz/llms.txt"));
    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toContain("text/plain");
    expect(response?.headers.get("content-language")).toBe("cs");
    const body = await response!.text();
    expect(body).toContain("https://humandesignmapa.cz/cs/human-design-kalkulacka");
    expect(body).toContain("https://humandesignmapa.cz/openapi.json");
    expect(body).toContain("OpenAPI není MCP");
    expect(body).toContain("souhlasu");
    expect(body).not.toContain("GOOGLE_CLIENT_SECRET");
  });

  it("maps an English storefront to English official content, never Czech default", async () => {
    const response = agentDiscoveryResponse(new URL("https://www.humandesignchart.app/llms.txt"));
    expect(response?.headers.get("content-language")).toBe("en");
    const body = await response!.text();
    expect(body).toContain("https://humandesignchart.app/en/calculate");
    expect(body).toContain("https://humandesignchart.app/openapi.json");
    expect(body).not.toContain("Avanito");
  });

  it("exposes OpenAPI 3.1 for the deployed, existing public calculator only", async () => {
    const response = agentDiscoveryResponse(new URL("https://humandesignmapa.cz/openapi.json"));
    expect(response?.status).toBe(200);
    const spec = await response!.json() as any;
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers[0].url).toBe("https://humandesignmapa.cz");
    const tool = spec.paths["/api/gpt/calculate"].post;
    expect(tool.operationId).toBe("calculateHumanDesignChart");
    const schema = tool.requestBody.content["application/json"].schema;
    expect(schema.required).toEqual(["birthDate", "birthTime", "latitude", "longitude"]);
    expect(schema.properties.latitude.minimum).toBe(-90);
    expect(schema.properties.longitude.maximum).toBe(180);
    expect(spec.paths["/api/oauth/callback/google"]).toBeUndefined();
    expect(spec.paths["/api/checkout"]).toBeUndefined();
  });

  it("does not manufacture a result for unknown paths", () => {
    expect(agentDiscoveryResponse(new URL("https://humandesignmapa.cz/mcp"))).toBeNull();
    expect(agentDiscoveryResponse(new URL("https://humandesignmapa.cz/api/private"))).toBeNull();
  });
});
