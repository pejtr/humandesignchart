import { describe, expect, it } from "vitest";
import { handleDailyAgentMcp } from "../workers/daily-agent-mcp";
import { getAgentDailyChart, buildAgentDailyReading, transitGate } from "../workers/daily-agent-data";

const origin = "https://humandesignchart.app/mcp";
function request(method: string, params: Record<string, unknown> = {}, extra: Record<string, string> = {}) {
  return new Request(origin, {
    method: "POST", headers: {
      "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      ...extra,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

describe("HD daily agent MCP pilot", () => {
  it("uses a stable Prague calendar day, including DST midnight", () => {
    const a = getAgentDailyChart(new Date("2026-07-05T07:00:00Z"));
    const b = getAgentDailyChart(new Date("2026-07-05T21:00:00Z"));
    expect(a).toEqual(b);
    expect(a.date).toBe("2026-07-05");
    expect(a.timestamp).toBe("2026-07-04T22:00:00.000Z");
    expect(a.transitGates).toHaveLength(13);
    expect(a.transitGates.every(t => t.gate >= 1 && t.gate <= 64 && t.line >= 1 && t.line <= 6)).toBe(true);
  });
  it("handles the zodiac wrap around Gate 25", () => {
    expect(transitGate(0)).toEqual({gate: 25, line: 2});
    expect(transitGate(3.875)).toEqual({gate: 17, line: 1});
  });
  it("localizes daily reading and compares only explicit natal gates", () => {
    const now = new Date("2026-11-25T07:00:00Z");
    const g = getAgentDailyChart(now).transitGates[0].gate;
    const cs = buildAgentDailyReading("cs", [g], now);
    expect(cs.personalized).toBe(true);
    expect(cs.reinforcedGates).toContain(g);
    expect(cs.disclaimer).toContain("symbolický");
    expect(buildAgentDailyReading("en", [], now).personalized).toBe(false);
    expect(() => buildAgentDailyReading("en", [65], now)).toThrow();
  });
  it("fails closed by default and rejects foreign Origin", async () => {
    expect((await handleDailyAgentMcp(request("tools/list"), false)).status).toBe(404);
    expect((await handleDailyAgentMcp(request("tools/list", {}, { Origin: "https://evil.example" }), true)).status).toBe(403);
  });
  it("initializes and advertises two read-only tools over fresh HTTP requests", async () => {
    const init = await handleDailyAgentMcp(request("initialize", {
      protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "qa", version: "1" },
    }), true);
    expect(init.status).toBe(200);
    const info = await init.json();
    expect(info.result.serverInfo.name).toBe("human-design-daily");
    const list = await handleDailyAgentMcp(request("tools/list"), true);
    expect(list.status).toBe(200);
    const payload = await list.json();
    expect(payload.result.tools.map((t: {name: string}) => t.name)).toEqual(["get_daily_chart", "get_daily_reading"]);
    expect(payload.result.tools.every((t: {annotations: {readOnlyHint: boolean}}) => t.annotations.readOnlyHint)).toBe(true);
  });
  it("returns current chart data and rejects personal account inputs", async () => {
    const r = await handleDailyAgentMcp(request("tools/call", { name: "get_daily_reading", arguments: { locale: "cs" } }), true);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(JSON.parse(body.result.content[0].text).locale).toBe("cs");
    const bad = await handleDailyAgentMcp(request("tools/call", { name: "get_daily_reading", arguments: { email: "test@example.invalid" } }), true);
    expect((await bad.json()).result.isError).toBe(true);
  });
  it("rejects oversized bodies and batches", async () => {
    const huge = new Request(origin, { method: "POST", body: "x".repeat(8193) });
    expect((await handleDailyAgentMcp(huge, true)).status).toBe(413);
    const batch = new Request(origin, { method: "POST", body: "[]" });
    expect((await handleDailyAgentMcp(batch, true)).status).toBe(400);
  });
});
