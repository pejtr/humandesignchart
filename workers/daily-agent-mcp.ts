import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getAgentDailyChart, buildAgentDailyReading } from "./daily-agent-data";

const origins = new Set([
  "https://humandesignmapa.cz", "https://www.humandesignmapa.cz",
  "https://humandesignchart.app", "https://www.humandesignchart.app",
]);
const chartArgs = z.object({}).strict();
const readingArgs = z.object({
  locale: z.enum(["cs", "en"]).default("en"),
  natalGates: z.array(z.number().int().min(1).max(64)).max(64).default([]),
}).strict();
const MAX_BODY = 8192;

const tools = [
  {
    name: "get_daily_chart",
    description: "Get today's public Human Design transit chart at midnight Europe/Prague. No birth details or user account needed.",
    inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_daily_reading",
    description: "Get today's symbolic themes and optional comparison with natal gates the user already chose to share. No birth dates, account lookups or email addresses. Not medical, financial or predictive advice.",
    inputSchema: {
      type: "object" as const, additionalProperties: false,
      properties: {
        locale: { type: "string", enum: ["cs", "en"], default: "en" },
        natalGates: { type: "array", maxItems: 64, items: { type: "integer", minimum: 1, maximum: 64 } },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

function errorResponse(status: number, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id: null, error: { code, message } }, {
    status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

async function boundedJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) throw new RangeError("Body too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new RangeError("Body too large"); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}

/** Stateless, read-only MCP pilot. No D1, user cookies, model provider, email or payment dependencies. */
export async function handleDailyAgentMcp(request: Request, enabled: boolean): Promise<Response> {
  if (!enabled) return errorResponse(404, -32000, "MCP_NOT_ENABLED");
  const origin = request.headers.get("origin");
  if (origin && !origins.has(origin)) return errorResponse(403, -32000, "Origin not allowed");
  if (request.method !== "POST") {
    const response = errorResponse(405, -32000, "Stateless MCP accepts POST");
    response.headers.set("Allow", "POST");
    return response;
  }
  let parsedBody: unknown;
  try { parsedBody = await boundedJson(request); }
  catch (error) {
    return error instanceof RangeError ? errorResponse(413, -32000, "Request too large") :
      errorResponse(400, -32700, "Invalid JSON");
  }
  // One request at a time; no batching amplification on the public pilot.
  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return errorResponse(400, -32600, "Expected one JSON-RPC message");
  }

  const server = new Server({ name: "human-design-daily", version: "0.1.0" }, {
    capabilities: { tools: {} },
  });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    try {
      let value: unknown;
      if (params.name === "get_daily_chart") {
        chartArgs.parse(params.arguments ?? {});
        value = getAgentDailyChart();
      } else if (params.name === "get_daily_reading") {
        const args = readingArgs.parse(params.arguments ?? {});
        value = buildAgentDailyReading(args.locale, args.natalGates);
      } else {
        return { isError: true, content: [{ type: "text", text: "Unknown tool" }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(value) }] };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Invalid arguments or daily chart unavailable" }] };
    }
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody });
    const headers = new Headers(response.headers);
    headers.set("cache-control", "no-store");
    headers.set("x-robots-tag", "noindex");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return errorResponse(500, -32603, "MCP unavailable");
  } finally { await server.close(); }
}
