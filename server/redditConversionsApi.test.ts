import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

describe("Reddit Conversions API v3", () => {
  it("does not call Reddit when credentials are missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.REDDIT_PIXEL_ID;
    delete process.env.VITE_REDDIT_PIXEL_ID;
    delete process.env.REDDIT_CONVERSION_TOKEN;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    const { sendRedditConversionEvent } = await import("./redditConversionsApi");
    const sent = await sendRedditConversionEvent({ trackingType: "PURCHASE" });

    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a consented purchase with click id and conversion id", async () => {
    process.env.NODE_ENV = "production";
    process.env.REDDIT_PIXEL_ID = "pixel_test";
    process.env.REDDIT_CONVERSION_TOKEN = "token_test";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as typeof fetch;

    const { sendRedditConversionEvent } = await import("./redditConversionsApi");
    const sent = await sendRedditConversionEvent({
      trackingType: "PURCHASE",
      email: "Al.ice+Reddit@Example.com",
      userId: 42,
      clickId: "reddit-click-id",
      conversionId: "cs_test_session",
      value: 188,
      currency: "CZK",
      contentIds: ["monthly"],
    });

    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ads-api.reddit.com/api/v3/pixels/pixel_test/conversion_events");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token_test" });
    const body = JSON.parse(String(init.body));
    expect(body.events[0]).toMatchObject({
      action_source: "WEBSITE",
      click_id: "reddit-click-id",
      type: { tracking_type: "PURCHASE" },
      metadata: { conversion_id: "cs_test_session", value: 188, currency: "CZK" },
    });
    expect(body.events[0].user.email).toMatch(/^[0-9a-f]{64}$/);
    expect(body.events[0].user.email).toBe(
      "ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976",
    );
  });
});

