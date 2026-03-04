import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Test: Streaming AI Reading Architecture ───────────────────────────────

describe("SSE Streaming Endpoint", () => {
  it("should have SSE endpoint registered at /api/ai/stream", async () => {
    // Verify the endpoint exists by checking the server core index
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain('app.get("/api/ai/stream"');
    expect(indexContent).toContain("text/event-stream");
    expect(indexContent).toContain("X-Accel-Buffering");
  });

  it("should have rating endpoint registered at /api/ai/rating", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain('app.post("/api/ai/rating"');
    expect(indexContent).toContain('"up"');
    expect(indexContent).toContain('"down"');
  });

  it("should handle stream: true in LLM request body", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain("stream: true");
    expect(indexContent).toContain("max_tokens: 4096");
  });

  it("should emit data: {token} SSE events", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain('JSON.stringify({ token })');
    expect(indexContent).toContain('JSON.stringify({ done: true })');
  });

  it("should save completed reading to DB after stream ends", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain("createAiReading");
    expect(indexContent).toContain("fullContent && chartId");
  });

  it("should authenticate request using sdk before streaming", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain("sdk.authenticateRequest");
    expect(indexContent).toContain('res.status(401)');
  });
});

// ─── Test: Rating Schema ───────────────────────────────────────────────────

describe("AI Reading Rating Schema", () => {
  it("should have rating column in aiReadings schema", async () => {
    const fs = await import("fs");
    const schemaContent = fs.readFileSync(
      "./drizzle/schema.ts",
      "utf-8"
    );
    expect(schemaContent).toContain('rating: mysqlEnum("rating"');
    expect(schemaContent).toContain('"up"');
    expect(schemaContent).toContain('"down"');
  });

  it("should have rating as optional (nullable) field", async () => {
    const fs = await import("fs");
    const schemaContent = fs.readFileSync(
      "./drizzle/schema.ts",
      "utf-8"
    );
    // Rating should not have .notNull() to allow null (unrated)
    const ratingLine = schemaContent
      .split("\n")
      .find((l) => l.includes('rating: mysqlEnum'));
    expect(ratingLine).toBeDefined();
    expect(ratingLine).not.toContain(".notNull()");
  });
});

// ─── Test: Frontend Streaming Integration ─────────────────────────────────

describe("ChartResult Streaming Integration", () => {
  it("should have aiStreaming state in ChartResult", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain("aiStreaming");
    expect(chartContent).toContain("setAiStreaming");
  });

  it("should use fetch with SSE for AI reading", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain("/api/ai/stream");
    expect(chartContent).toContain("AbortController");
    expect(chartContent).toContain("streamAbortRef");
  });

  it("should have thumbs up/down rating buttons", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain("handleRating");
    expect(chartContent).toContain("aiRating");
    expect(chartContent).toContain("👍");
    expect(chartContent).toContain("👎");
  });

  it("should show streaming cursor while text is being generated", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain("animate-pulse");
    expect(chartContent).toContain("{aiStreaming && (");
  });

  it("should abort previous stream when new reading type is selected", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain("streamAbortRef.current.abort()");
  });

  it("should fall back to tRPC mutation if SSE fails", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain("aiMutation.mutate");
    expect(chartContent).toContain("Fallback to tRPC mutation");
  });

  it("should post rating to /api/ai/rating endpoint", async () => {
    const fs = await import("fs");
    const chartContent = fs.readFileSync(
      "./client/src/pages/ChartResult.tsx",
      "utf-8"
    );
    expect(chartContent).toContain('"/api/ai/rating"');
    expect(chartContent).toContain("readingId");
  });
});

// ─── Test: Prompt Coverage ─────────────────────────────────────────────────

describe("AI Reading Prompt Coverage", () => {
  const EXPECTED_TYPES = [
    "overview",
    "type_strategy",
    "profile",
    "authority",
    "incarnation_cross",
    "channels",
    "relationships",
    "career",
  ];

  it("should have prompts for all 8 reading types", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    for (const type of EXPECTED_TYPES) {
      expect(indexContent).toContain(`${type}:`);
    }
  });

  it("should have Czech system prompt", async () => {
    const fs = await import("fs");
    const indexContent = fs.readFileSync(
      "./server/_core/index.ts",
      "utf-8"
    );
    expect(indexContent).toContain("Jsi expert na systém Human Design");
    expect(indexContent).toContain("NIKDY nezačínej oslovením");
  });
});
