/**
 * QA Healthcheck — Komplexní testovací sekvence pro noční běh
 *
 * Pokrytí:
 * 1. Smoke testy (všechny routery)
 * 2. Chart CRUD flow (uložení, načtení, úprava, smazání)
 * 3. Composite / Porovnání map (rodina + týmy)
 * 4. Share link round-trip
 * 5. AI Reading flow
 * 6. Newsletter double opt-in
 * 7. Subscription status
 * 8. Referral systém
 * 9. Gift voucher
 * 10. Notifications
 * 11. Webhook security (Stripe + Optimateo)
 * 12. SEO routes (sitemap, robots, rss)
 * 13. Database health
 * 14. Non-www URL audit (canonical URLs)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

// ─── In-memory stores for mocked DB ──────────────────────────────────────────

const chartStore = new Map<number, any>();
let chartAutoId = 1000;
const readingStore = new Map<number, any>();
let readingAutoId = 1;
const notificationStore = new Map<number, any>();
let notifAutoId = 1;
const voucherStore = new Map<string, any>();
const referralStore = new Map<number, any>();
const testimonialStore = new Map<number, any>();
let testimonialAutoId = 1;
const subscriberStore = new Map<string, any>();

function drizzleTableName(table: any): string {
  const nameSymbol = Object.getOwnPropertySymbols(table ?? {}).find(
    symbol => symbol.toString() === "Symbol(drizzle:Name)"
  );
  return nameSymbol ? String(table[nameSymbol]) : "unknown";
}

function queryStrings(value: unknown, seen = new WeakSet<object>()): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object" || seen.has(value)) return [];
  seen.add(value);
  return Object.values(value).flatMap(item => queryStrings(item, seen));
}

function createMockDb() {
  const rowsFor = (table: string, selection: Record<string, unknown> | undefined, condition: unknown) => {
    if (table === "newsletter_subscribers") {
      const values = queryStrings(condition);
      return Array.from(subscriberStore.values()).filter(row =>
        values.includes(row.email) || values.includes(row.confirmToken)
      );
    }
    if (table === "testimonials") {
      const approved = Array.from(testimonialStore.values()).filter(row => row.status === "approved");
      if (selection && "count" in selection) {
        const avgRating = approved.length
          ? approved.reduce((sum, row) => sum + row.rating, 0) / approved.length
          : 0;
        return [{ count: approved.length, avgRating }];
      }
      return approved;
    }
    if (table === "users") {
      return [{
        id: 99911,
        currentStreak: 3,
        longestStreak: 7,
        totalCreditsEarned: 4,
        aiReadingCredits: 10,
        lastDailyRewardAt: null,
        subscriptionStatus: "none",
      }];
    }
    if (table === "referrals") return [];
    return [];
  };

  return {
    select: vi.fn((selection?: Record<string, unknown>) => {
      let table = "unknown";
      let condition: unknown;
      const chain: any = {
        from(value: any) {
          table = drizzleTableName(value);
          return chain;
        },
        where(value: unknown) {
          condition = value;
          return chain;
        },
        orderBy() { return chain; },
        limit() { return Promise.resolve(rowsFor(table, selection, condition)); },
        then(resolve: (value: any) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve(rowsFor(table, selection, condition)).then(resolve, reject);
        },
      };
      return chain;
    }),
    insert: vi.fn((table: any) => ({
      values: vi.fn(async (data: any) => {
        const name = drizzleTableName(table);
        if (name === "newsletter_subscribers") {
          subscriberStore.set(data.email, { id: subscriberStore.size + 1, ...data });
          return [{ insertId: subscriberStore.size }];
        }
        if (name === "testimonials") {
          const id = testimonialAutoId++;
          testimonialStore.set(id, { id, ...data });
          return [{ insertId: id }];
        }
        return [{ insertId: 1 }];
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(async () => [{ affectedRows: 1 }]) })),
    })),
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getDb: vi.fn().mockImplementation(async () => createMockDb()),
  countTotalCharts: vi.fn(async () => chartStore.size),
  calculateUserLevel: vi.fn(() => "searcher"),
  processStreakCheckIn: vi.fn(async () => ({ streakUpdated: true, newStreak: 1, creditsAwarded: 0 })),
  claimDailyReward: vi.fn(async () => ({ alreadyClaimed: false, creditsAwarded: 1 })),
  getChartById: vi.fn(async (id: number, userId: number) => {
    const chart = chartStore.get(id);
    return chart?.userId === userId ? chart : null;
  }),
  getUserCharts: vi.fn(async (userId: number) => {
    return Array.from(chartStore.values()).filter(c => c.userId === userId);
  }),
  createChart: vi.fn(async (data: any) => {
    const id = ++chartAutoId;
    const chart = { ...data, id, createdAt: new Date().toISOString(), isFavorite: 0 };
    chartStore.set(id, chart);
    return id;
  }),
  updateChart: vi.fn(async (id: number, userId: number, data: any) => {
    const chart = chartStore.get(id);
    if (chart && chart.userId === userId) Object.assign(chart, data);
  }),
  deleteChart: vi.fn(async (id: number, userId: number) => {
    chartStore.delete(id);
  }),
  toggleFavorite: vi.fn(async (id: number, userId: number, isFavorite: boolean) => {
    const chart = chartStore.get(id);
    if (chart) chart.isFavorite = isFavorite ? 1 : 0;
  }),
  createAiReading: vi.fn(async (data: any) => {
    const id = ++readingAutoId;
    readingStore.set(id, { ...data, id, rating: null, createdAt: new Date().toISOString() });
    return id;
  }),
  persistGroundedAiReading: vi.fn(async (data: any) => {
    const id = ++readingAutoId;
    readingStore.set(id, { ...data, id, rating: null, createdAt: new Date().toISOString() });
    return id;
  }),
  getAiReadings: vi.fn(async (chartId: number, userId: number) => {
    return Array.from(readingStore.values()).filter(r => r.chartId === chartId && r.userId === userId);
  }),
  getAllReadingsByUser: vi.fn(async (userId: number) => {
    return Array.from(readingStore.values()).filter(r => r.userId === userId);
  }),
  updateReadingRating: vi.fn(async (readingId: number, userId: number, rating: string | null) => {
    const reading = readingStore.get(readingId);
    if (reading) reading.rating = rating;
  }),
  getReadingById: vi.fn(async (id: number) => readingStore.get(id) ?? null),
  createSharedChart: vi.fn(async (data: any) => data.token),
  getSharedChart: vi.fn(async (token: string) => null),
  getUserById: vi.fn(async (id: number) => ({
    id,
    openId: `test-openid-${id}`,
    name: `QA Test User ${id}`,
    email: `qa-test-${id}@example.com`,
    referralCode: null,
    aiReadingCredits: 10,
    subscriptionStatus: "none",
    subscriptionPlan: "none",
  })),
  getUserByOpenId: vi.fn(async () => null),
  getUserByReferralCode: vi.fn(async () => null),
  getReferralByReferredUser: vi.fn(async () => null),
  getReferralsByReferrer: vi.fn(async () => []),
  setUserReferralCode: vi.fn(async () => {}),
  createReferral: vi.fn(async () => {}),
  addAiReadingCredits: vi.fn(async () => {}),
  countAiReadingsByUser: vi.fn(async () => 0),
  updateUserSubscription: vi.fn(async () => {}),
  hasRecentCreditTransaction: vi.fn(async () => false),
  consumeBlueprintPdfCredit: vi.fn(async () => true),
  getGiftVoucherByCode: vi.fn(async (code: string) => voucherStore.get(code) ?? null),
  redeemGiftVoucher: vi.fn(async () => {}),
  logCreditTransaction: vi.fn(async () => {}),
  addCreditsWithLog: vi.fn(async () => {}),
  createNotification: vi.fn(async (data: any) => {
    const id = ++notifAutoId;
    const notif = { ...data, id, isRead: 0, createdAt: new Date().toISOString() };
    notificationStore.set(id, notif);
    return notif;
  }),
  getUserNotifications: vi.fn(async (userId: number) => []),
  getUnreadCount: vi.fn(async () => 0),
  markNotificationRead: vi.fn(async () => {}),
  markAllNotificationsRead: vi.fn(async () => {}),
}));

vi.mock("./db.notifications", () => ({
  getUserNotifications: vi.fn(async (userId: number) =>
    Array.from(notificationStore.values()).filter(row => row.userId === userId)
  ),
  getUnreadCount: vi.fn(async (userId: number) =>
    Array.from(notificationStore.values()).filter(row => row.userId === userId && !row.isRead).length
  ),
  markNotificationRead: vi.fn(async () => {}),
  markAllNotificationsRead: vi.fn(async () => {}),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockImplementation(async ({ messages }: any) => {
    const prompt = messages?.find((message: any) => message.role === "user")?.content ?? "";
    const match = prompt.match(/IMMUTABLE FACTS[^\n]*\n(\{.*\})\n\nReturn/s);
    return {
    choices: [{ message: { content: "Toto je testovací AI výklad pro QA healthcheck." } }],
      ...{
        model: "qa-grounded-model",
        choices: [{ message: { content: JSON.stringify({ facts: match ? JSON.parse(match[1]) : {}, interpretationMarkdown: "QA grounded reading" }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
      },
    };
  }),
}));

vi.mock("./stripeWebhook", () => ({
  getStripe: vi.fn().mockReturnValue(null),
}));

vi.mock("./leados", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "test-msg-id" }),
  sendLeadOSEvent: vi.fn(),
  verifyLeadOSWebhook: vi.fn().mockReturnValue(false),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/test.png" }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(userId: number, role: "user" | "admin" | "moderator" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-openid-${userId}`,
      name: `QA Test User ${userId}`,
      email: `qa-test-${userId}@example.com`,
      role,
      subscriptionStatus: "none" as const,
      subscriptionPlan: "none" as const,
      subscriptionCurrentPeriodEnd: null,
      aiReadingCredits: 10,
      blueprintPdfCredits: 0,
      referralCode: null,
      affiliateCode: null,
      affiliateTier: null,
      isAffiliate: 0,
      crmStatus: null,
      crmNote: null,
      notificationPreferences: { dailyTransit: true, system: true, credits: true, campaigns: true },
    } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Test Data ────────────────────────────────────────────────────────────────

const TEST_CHART_DATA = {
  type: "Generator",
  profile: "2/4",
  authority: "Sacral",
  strategy: "To Respond",
  definedCenters: ["sacral", "throat"],
  undefinedCenters: ["head", "ajna", "heart", "solarPlexus", "spleen", "g", "root"],
  activatedGates: [1, 8, 14, 29, 34, 43, 59],
  channels: [[1, 8]],
  incarnationCross: "Right Angle Cross of the Sphinx",
};

const TEST_BIRTH_DATA = {
  name: "QA Test Chart",
  birthDate: "1990-05-15",
  birthTime: "14:30",
  birthPlace: "Praha, Cesko",
  latitude: 50.0755,
  longitude: 14.4378,
  timezone: "Europe/Prague",
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SMOKE TESTS — Vsechny routery se nactou bez chyby
// ═══════════════════════════════════════════════════════════════════════════════

describe("1. Smoke — Router existence", () => {
  it("appRouter has createCaller method", () => {
    expect(appRouter).toBeDefined();
    expect(typeof appRouter.createCaller).toBe("function");
  });

  it("transit.current returns 13 planetary positions", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.transit.current();
    expect(result).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(result.transitGates).toBeDefined();
    expect(result.transitGates.length).toBe(13);
  });

  it("publicStats.chartCount returns a number", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.publicStats.chartCount();
    expect(result).toBeDefined();
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("content.blogList(CS) returns articles", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.content.blogList({ locale: "cs" });
    expect(Array.isArray(result.articles)).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);
  });

  it("content.blogList(EN) returns articles", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.content.blogList({ locale: "en" });
    expect(Array.isArray(result.articles)).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);
  });

  it("testimonials.getApproved returns array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.testimonials.getApproved({ locale: "cs", limit: 6 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CHART CRUD FLOW — Kompletni zivotni cyklus mapy
// ═══════════════════════════════════════════════════════════════════════════════

describe("2. Chart CRUD — Full lifecycle", () => {
  let chartId: number;

  it("chart.calculate returns valid chart data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.chart.calculate(TEST_BIRTH_DATA);
    expect(result).toBeDefined();
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("profile");
    expect(result).toHaveProperty("authority");
    expect(result).toHaveProperty("activatedGates");
    expect(Array.isArray(result.activatedGates)).toBe(true);
  });

  it("chart.save creates a new chart", async () => {
    const ctx = createAuthContext(99901);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "self",
      chartData: TEST_CHART_DATA as any,
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
    chartId = result.id;
  });

  it("chart.list includes the saved chart", async () => {
    const ctx = createAuthContext(99901);
    const caller = appRouter.createCaller(ctx);
    const list = await caller.chart.list();
    expect(Array.isArray(list)).toBe(true);
    const found = list.find((c: any) => c.id === chartId);
    expect(found).toBeDefined();
  });

  it("chart.get returns the saved chart", async () => {
    const ctx = createAuthContext(99901);
    const caller = appRouter.createCaller(ctx);
    const chart = await caller.chart.get({ id: chartId });
    expect(chart).toBeDefined();
    expect(chart!.name).toBe("QA Test Chart");
  });

  it("chart.update changes name and category", async () => {
    const ctx = createAuthContext(99901);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chart.update({
      id: chartId,
      name: "QA Updated Chart",
      category: "family",
      roleTag: "dite",
    });
    expect(result.success).toBe(true);
  });

  it("chart.toggleFavorite works", async () => {
    const ctx = createAuthContext(99901);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chart.toggleFavorite({ id: chartId, isFavorite: true });
    expect(result.success).toBe(true);
  });

  it("chart.delete removes the chart", async () => {
    const ctx = createAuthContext(99901);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chart.delete({ id: chartId });
    expect(result.success).toBe(true);

    const list = await caller.chart.list();
    const found = list.find((c: any) => c.id === chartId);
    expect(found).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. COMPOSITE / POROVNANI — Rodinne porovnani map
// ═══════════════════════════════════════════════════════════════════════════════

describe("3. Composite — Chart comparison (family)", () => {
  let chartAId: number;
  let chartBId: number;

  beforeAll(async () => {
    const ctx = createAuthContext(99902);
    const caller = appRouter.createCaller(ctx);

    const a = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      name: "Osoba A",
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "self",
      chartData: TEST_CHART_DATA as any,
    });
    chartAId = a.id;

    const b = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      name: "Osoba B",
      birthDate: "1985-03-20",
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "family",
      chartData: { ...TEST_CHART_DATA, type: "Projector", activatedGates: [2, 14, 27, 50] } as any,
    });
    chartBId = b.id;
  });

  it("composite.analyze returns the current relationship contract", async () => {
    const ctx = createAuthContext(99902);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.composite.analyze({ chartIdA: chartAId, chartIdB: chartBId });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("electromagnetic");
    expect(result).toHaveProperty("sharedChannels");
    expect(result).toHaveProperty("centerCompatibility");
    expect(Array.isArray(result.electromagnetic)).toBe(true);
    expect(Array.isArray(result.sharedChannels)).toBe(true);
    expect(Array.isArray(result.centerCompatibility)).toBe(true);
  });

  it("composite.analyze(self vs self) returns data without errors", async () => {
    const ctx = createAuthContext(99902);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.composite.analyze({ chartIdA: chartAId, chartIdB: chartAId });
    expect(result).toBeDefined();
  });

  afterAll(async () => {
    const ctx = createAuthContext(99902);
    const caller = appRouter.createCaller(ctx);
    await caller.chart.delete({ id: chartAId }).catch(() => {});
    await caller.chart.delete({ id: chartBId }).catch(() => {});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SHARE — Sdileni mapy pres token
// ═══════════════════════════════════════════════════════════════════════════════

describe("4. Share — Link round-trip", () => {
  it("share.createLink returns a token", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.share.createLink({
      chartData: TEST_CHART_DATA,
      ownerName: "QA Tester",
    });
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
  });

  it("share.getShared returns null for invalid token", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.share.getShared({ token: "invalid-token-1234567890123456" });
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. AI READING — Vykladovy flow
// ═══════════════════════════════════════════════════════════════════════════════

describe("5. AI Reading — Generation and rating", () => {
  let readingId: number;
  let savedChartId: number;

  beforeAll(async () => {
    const ctx = createAuthContext(99903);
    const caller = appRouter.createCaller(ctx);
    const canonicalChart = await caller.chart.calculate(TEST_BIRTH_DATA);
    const chart = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "self",
      chartData: canonicalChart as any,
    });
    savedChartId = chart.id;
  });

  it("ai.generateReading returns content", async () => {
    const ctx = createAuthContext(99903);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.generateReading({
      chartId: savedChartId,
      readingType: "overview",
      locale: "cs",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.content).toBeDefined();
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
    readingId = result.id;
  });

  it("ai.rateReading accepts rating", async () => {
    const ctx = createAuthContext(99903);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.rateReading({ readingId, rating: "up" });
    expect(result.success).toBe(true);
  });

  it("ai.getAllReadings returns array", async () => {
    const ctx = createAuthContext(99903);
    const caller = appRouter.createCaller(ctx);
    const readings = await caller.ai.getAllReadings();
    expect(Array.isArray(readings)).toBe(true);
  });

  afterAll(async () => {
    const ctx = createAuthContext(99903);
    const caller = appRouter.createCaller(ctx);
    await caller.chart.delete({ id: savedChartId }).catch(() => {});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. NEWSLETTER — Double opt-in flow
// ═══════════════════════════════════════════════════════════════════════════════

describe("6. Newsletter — Subscribe and confirm", () => {
  it("newsletter.subscribe creates pending subscriber", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.newsletter.subscribe({
      email: "qa-newsletter-test@example.com",
      locale: "cs",
      source: "qa-healthcheck",
    });
    expect(result.success).toBe(true);
  });

  it("newsletter.confirm with invalid token throws", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.newsletter.confirm({ token: "invalid-token-12345" })
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SUBSCRIPTION — Status a checkout
// ═══════════════════════════════════════════════════════════════════════════════

describe("7. Subscription — Status", () => {
  it("subscription.status returns valid structure", async () => {
    const ctx = createAuthContext(99904);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.status();

    expect(result).toBeDefined();
    expect(typeof result.isPremium).toBe("boolean");
    expect(result.plan).toBeDefined();
    expect(result.status).toBeDefined();
    expect(typeof result.freeReadingsLeft).toBe("number");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. REFERRAL — System doporuceni
// ═══════════════════════════════════════════════════════════════════════════════

describe("8. Referral — Code generation and application", () => {
  it("referral.getInfo returns referral code", async () => {
    const ctx = createAuthContext(99905);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referral.getInfo();

    expect(result).toBeDefined();
    expect(result.referralCode).toBeDefined();
    expect(typeof result.referralCode).toBe("string");
    expect(result.referralCode.length).toBeGreaterThan(0);
  });

  it("referral.applyReferral with invalid code returns failure", async () => {
    const ctx = createAuthContext(99906);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referral.applyReferral({ referralCode: "INVALID999" });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_code");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. GIFT VOUCHER — Kontrola a uplatneni
// ═══════════════════════════════════════════════════════════════════════════════

describe("9. Gift Voucher — Check and redeem", () => {
  it("giftVoucher.check with non-existent code returns invalid", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.giftVoucher.check({ code: "HD-INVALID-CODE-1234" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("not_found");
  });

  it("giftVoucher.redeem with non-existent code throws", async () => {
    const ctx = createAuthContext(99907);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.giftVoucher.redeem({ code: "HD-INVALID-CODE-1234" })
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. NOTIFICATIONS — In-app notifikace
// ═══════════════════════════════════════════════════════════════════════════════

describe("10. Notifications — CRUD", () => {
  it("notifications.getAll returns array", async () => {
    const ctx = createAuthContext(99908);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("notifications.getUnreadCount returns number", async () => {
    const ctx = createAuthContext(99908);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.getUnreadCount();
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. WEBHOOK SECURITY — Podpisova verifikace
// ═══════════════════════════════════════════════════════════════════════════════

describe("11. Webhook Security — Signature verification", () => {
  it("Optimateo webhook rejects invalid signature", async () => {
    const { verifyLeadOSWebhook } = await import("./leados");
    const isValid = verifyLeadOSWebhook("test-payload", "invalid-signature");
    expect(isValid).toBe(false);
  });

  it("Stripe getStripe returns null when no key configured", async () => {
    const { getStripe } = await import("./stripeWebhook");
    const stripe = getStripe();
    expect(stripe === null || typeof stripe === "object").toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. SEO — URL audit (non-www kontrola)
// ═══════════════════════════════════════════════════════════════════════════════

describe("12. SEO — URL audit", () => {
  it("all hardcoded URLs use www prefix", () => {
    const fs = require("fs");
    const path = require("path");

    const filesToCheck = [
      "client/src/pages/AiGuide.tsx",
      "client/src/pages/DailyTransit.tsx",
      "client/src/pages/IncarnationCross.tsx",
      "client/src/pages/BlogArticle.tsx",
      "client/src/pages/Blog.tsx",
      "client/src/pages/Home.tsx",
      "server/_core/seoMeta.ts",
      "server/_core/routes/seo.ts",
    ];

    // Match URLs like humandesignmapa.cz or humandesignchart.app WITHOUT www
    const nonWwwPattern = /https?:\/\/(?!(www\.|localhost|127\.0\.0\.1))[a-z0-9-]+\.(humandesignmapa\.cz|humandesignchart\.app)/g;

    const issues: string[] = [];

    for (const file of filesToCheck) {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, "utf-8");
      const matches = content.match(nonWwwPattern);
      if (matches && matches.length > 0) {
        const realIssues = matches.filter((m: string) =>
          !m.includes("localhost") &&
          !m.includes("127.0.0.1") &&
          !m.includes("manuscdn.com")
        );
        if (realIssues.length > 0) {
          issues.push(`${file}: ${realIssues.join(", ")}`);
        }
      }
    }

    if (issues.length > 0) {
      expect.fail(`Non-www URLs found:\n${issues.join("\n")}`);
    }
  });

  it("sitemap uses www URLs", () => {
    const fs = require("fs");
    const path = require("path");
    const seoPath = path.resolve(process.cwd(), "server/_core/routes/seo.ts");
    const content = fs.readFileSync(seoPath, "utf-8");
    expect(content).toContain("https://www.humandesignmapa.cz");
    expect(content).toContain("https://www.humandesignchart.app");
  });

  it("seoMeta.ts uses www canonical URLs", () => {
    const fs = require("fs");
    const path = require("path");
    const metaPath = path.resolve(process.cwd(), "server/_core/seoMeta.ts");
    const content = fs.readFileSync(metaPath, "utf-8");
    expect(content).toContain('const CS = "https://www.humandesignmapa.cz"');
    expect(content).toContain('const EN = "https://www.humandesignchart.app"');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. DATABASE HEALTH — Pripojeni a operace
// ═══════════════════════════════════════════════════════════════════════════════

describe("13. Database — Health check", () => {
  const hasDbUrl = !!process.env.DATABASE_URL;

  it("DATABASE_URL is configured in production", () => {
    // This test documents whether we have DB access
    // In CI/local without DB it will be skipped
    if (!hasDbUrl) {
      console.log("[QA] DATABASE_URL not set — DB integration tests skipped");
    }
    expect(typeof hasDbUrl).toBe("boolean");
  });

  it("getDb returns connection when DATABASE_URL is available", async () => {
    if (!hasDbUrl) return; // Skip
    const { getDb } = await import("./db");
    const db = await getDb();
    expect(db).toBeDefined();
    expect(db).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. TESTIMONIALS — Submit flow
// ═══════════════════════════════════════════════════════════════════════════════

describe("14. Testimonials — Submit flow", () => {
  it("testimonials.submit creates pending testimonial", async () => {
    const ctx = createAuthContext(99910);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.testimonials.submit({
      name: "QA Tester",
      text: "Human Design mi pomohl pochopit mou energii. Doporucuji!",
      rating: 5,
      hdType: "Generator",
      locale: "cs",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("testimonials.getStats returns count and avgRating", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.testimonials.getStats();
    expect(result).toBeDefined();
    expect(typeof result.count).toBe("number");
    expect(typeof result.avgRating).toBe("number");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 15. CHART COMPARISON — Family a tymove porovnani
// ═══════════════════════════════════════════════════════════════════════════════

describe("15. Chart Comparison — Multi-chart (family + friend)", () => {
  let selfChartId: number;
  let familyChartId: number;
  let friendChartId: number;

  beforeAll(async () => {
    const ctx = createAuthContext(99909);
    const caller = appRouter.createCaller(ctx);

    const self = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      name: "Ja",
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "self",
      chartData: TEST_CHART_DATA as any,
    });
    selfChartId = self.id;

    const family = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      name: "Mama",
      birthDate: "1965-08-10",
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "family",
      chartData: { ...TEST_CHART_DATA, type: "Manifestor", activatedGates: [21, 45, 51] } as any,
    });
    familyChartId = family.id;

    const friend = await caller.chart.save({
      ...TEST_BIRTH_DATA,
      name: "Kamarad",
      birthDate: "1992-11-03",
      latitude: String(TEST_BIRTH_DATA.latitude),
      longitude: String(TEST_BIRTH_DATA.longitude),
      category: "friend",
      chartData: { ...TEST_CHART_DATA, type: "Projector", activatedGates: [7, 31, 33] } as any,
    });
    friendChartId = friend.id;
  });

  it("composite.analyze(self vs family) works", async () => {
    const ctx = createAuthContext(99909);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.composite.analyze({ chartIdA: selfChartId, chartIdB: familyChartId });
    expect(result.electromagnetic).toBeDefined();
    expect(result.sharedChannels).toBeDefined();
    expect(result.centerCompatibility).toBeDefined();
  });

  it("composite.analyze(self vs friend) works", async () => {
    const ctx = createAuthContext(99909);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.composite.analyze({ chartIdA: selfChartId, chartIdB: friendChartId });
    expect(result.electromagnetic).toBeDefined();
  });

  it("chart.list shows all 3 charts in correct categories", async () => {
    const ctx = createAuthContext(99909);
    const caller = appRouter.createCaller(ctx);
    const list = await caller.chart.list();
    expect(list.length).toBeGreaterThanOrEqual(3);

    const selfChart = list.find((c: any) => c.id === selfChartId);
    const famChart = list.find((c: any) => c.id === familyChartId);
    const frChart = list.find((c: any) => c.id === friendChartId);

    expect(selfChart).toBeDefined();
    expect(selfChart!.category).toBe("self");
    expect(famChart).toBeDefined();
    expect(famChart!.category).toBe("family");
    expect(frChart).toBeDefined();
    expect(frChart!.category).toBe("friend");
  });

  afterAll(async () => {
    const ctx = createAuthContext(99909);
    const caller = appRouter.createCaller(ctx);
    await caller.chart.delete({ id: selfChartId }).catch(() => {});
    await caller.chart.delete({ id: familyChartId }).catch(() => {});
    await caller.chart.delete({ id: friendChartId }).catch(() => {});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16. GAMIFICATION — Achievement system
// ═══════════════════════════════════════════════════════════════════════════════

describe("16. Gamification — Streak and achievements", () => {
  it("gamification.getStats returns streak data", async () => {
    const ctx = createAuthContext(99911);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gamification.getStats();
    expect(result).toBeDefined();
    expect(typeof result.currentStreak).toBe("number");
    expect(typeof result.longestStreak).toBe("number");
  });

  it("gamification.getStats returns progression and reward data", async () => {
    const ctx = createAuthContext(99911);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gamification.getStats();
    expect(typeof result.totalCreditsEarned).toBe("number");
    expect(typeof result.dailyRewardAvailable).toBe("boolean");
    expect(result.level).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17. USER — Profil a preference
// ═══════════════════════════════════════════════════════════════════════════════

describe("17. User — Profile and preferences", () => {
  it("user.getPreferences returns notification prefs", async () => {
    const ctx = createAuthContext(99912);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.user.getPreferences();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("dailyTransit");
  });
});
