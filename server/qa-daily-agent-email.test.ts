import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDailyEmail, dailyEmailMessage } from "../workers/daily-agent-email";
import { deliverDailyBatch } from "../workers/daily-agent-email-cron";
import { getSessionUser } from "../workers/googleOAuth";

vi.mock("../workers/googleOAuth", () => ({ getSessionUser: vi.fn() }));
const now = new Date("2026-11-25T07:15:00Z");
const token = "a".repeat(64);
const user = {id: 7, email: "seed@example.invalid"};
const base = "https://humandesignchart.app/api/daily-agent/email/";
function prefsRequest(body: unknown, origin = "https://humandesignchart.app") {
  return new Request(base+"preferences", {method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify(body)});
}
function dbFixture(enabled = true) {
  let claimed = false;
  const writes: {sql: string; args: unknown[]}[] = [];
  const db = {prepare(sql: string) {
    let args: unknown[] = [];
    const stmt = {
      bind(...v: unknown[]) { args = v; return stmt; },
      async first() { return {user_id: 7, email:user.email, locale:"en", enabled: enabled ? 1 : 0, unsubscribe_token:token}; },
      async all() { return {results: [{user_id:7}]}; },
      async run() {
        writes.push({sql,args});
        if (sql.startsWith("INSERT OR IGNORE INTO hd_daily_delivery")) {
          const changes = claimed ? 0 : 1;
          claimed = true;
          return {success:true,meta:{changes}};
        }
        return {success:true,meta:{changes:1}};
      },
    };
    return stmt;
  }};
  return {db,writes};
}
beforeEach(() => { vi.resetAllMocks(); vi.mocked(getSessionUser).mockResolvedValue(user as any); });

describe("Cloudflare daily opt-in service", () => {
  it("requires a session, same origin and explicit consent, never accepts email or birth data", async () => {
    const {db,writes} = dbFixture();
    const env = {HD_DAILY_EMAIL_DB:db,HD_DAILY_EMAIL_ENABLED:"true"};
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    expect((await handleDailyEmail(prefsRequest({enabled:true,locale:"en",consent:true}),env)).status).toBe(401);
    expect((await handleDailyEmail(prefsRequest({enabled:true,locale:"en",consent:true},"https://evil.example"),env)).status).toBe(403);
    expect((await handleDailyEmail(prefsRequest({enabled:true,locale:"en",consent:false}),env)).status).toBe(403);
    expect((await handleDailyEmail(prefsRequest({enabled:true,locale:"en",consent:true,email:"other@example.invalid"}),env)).status).toBe(400);
    expect(writes).toHaveLength(0);
  });
  it("stores explicit consent for only verified session identity", async () => {
    const {db,writes} = dbFixture();
    const env = {HD_DAILY_EMAIL_DB:db,HD_DAILY_EMAIL_ENABLED:"true"};
    const res = await handleDailyEmail(prefsRequest({enabled:true,locale:"cs",consent:true}),env);
    expect(res.status).toBe(200);
    expect(writes[0].args.slice(0,3)).toEqual([7,user.email,"cs"]);
    expect(writes[0].args[4]).toBe("daily-transit-service-v1");
  });
  it("allows disabling while service is off; opt-out GET never modifies a subscription", async () => {
    const {db,writes} = dbFixture();
    const env = {HD_DAILY_EMAIL_DB:db};
    expect((await handleDailyEmail(prefsRequest({enabled:true,locale:"en",consent:true}),env)).status).toBe(403);
    const url = base+"unsubscribe?token="+token;
    expect((await handleDailyEmail(new Request(url),env)).status).toBe(200);
    expect(writes).toHaveLength(0);
    expect((await handleDailyEmail(new Request(url,{method:"POST"}),env)).status).toBe(200);
    expect(writes[0].args).toEqual([token]);
    expect((await handleDailyEmail(prefsRequest({enabled:false,locale:"en",consent:false}),env)).status).toBe(200);
  });
  it("generates same-day symbolic service mail, no marketing and working opt-out link", () => {
    const mail = dailyEmailMessage("en",token,now);
    expect(mail.subject).toContain("2026-11-25");
    expect(mail.textContent).toContain("symbolic");
    expect(mail.textContent).toContain("unsubscribe?token="+token);
    expect(mail.textContent).not.toContain("utm_campaign");
  });
});

describe("Daily delivery cron safety", () => {
  it("does not send while disabled or outside local delivery window", async () => {
    const {db,writes} = dbFixture();
    const send = vi.fn() as unknown as typeof fetch;
    const env = {HD_DAILY_EMAIL_DB:db,BREVO_API_KEY:"fixture",BREVO_SENDER_EMAIL:"seed@example.invalid"};
    expect((await deliverDailyBatch(env,now,send)).status).toBe("DISABLED");
    expect((await deliverDailyBatch({...env,HD_DAILY_EMAIL_ENABLED:"true"},new Date("2026-11-25T01:00:00Z"),send)).status).toBe("OUTSIDE_WINDOW");
    expect(writes).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });
  it("claims once per user/day, applies durable cap and records provider acceptance", async () => {
    const {db,writes} = dbFixture();
    const send = vi.fn(async () => new Response("{}",{status:201}));
    const env = {HD_DAILY_EMAIL_DB:db,HD_DAILY_EMAIL_ENABLED:"true",BREVO_API_KEY:"fixture",BREVO_SENDER_EMAIL:"seed@example.invalid"};
    expect((await deliverDailyBatch(env,now,send as unknown as typeof fetch)).sent).toBe(1);
    expect((await deliverDailyBatch(env,now,send as unknown as typeof fetch)).sent).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    expect(writes[0].sql).toContain("< 80");
    expect(writes.some(w=>w.args[0]==="SENT")).toBe(true);
  });
  it("rechecks opt-out and does not retry ambiguous provider requests", async () => {
    const off = dbFixture(false);
    const send = vi.fn(async () => {throw new Error("timeout");});
    const env = {HD_DAILY_EMAIL_ENABLED:"true",BREVO_API_KEY:"fixture",BREVO_SENDER_EMAIL:"seed@example.invalid"};
    await deliverDailyBatch({...env,HD_DAILY_EMAIL_DB:off.db},now,send as unknown as typeof fetch);
    expect(send).not.toHaveBeenCalled();
    expect(off.writes.some(w=>w.args[0]==="CANCELLED")).toBe(true);
    const on = dbFixture();
    await deliverDailyBatch({...env,HD_DAILY_EMAIL_DB:on.db},now,send as unknown as typeof fetch);
    await deliverDailyBatch({...env,HD_DAILY_EMAIL_DB:on.db},now,send as unknown as typeof fetch);
    expect(send).toHaveBeenCalledTimes(1);
    expect(on.writes.some(w=>w.args[0]==="UNKNOWN")).toBe(true);
  });
});


describe("Daily email full service flow with real SQLite and a simulated Brevo provider", () => {
  it("preserves old links for the same mailbox, stops sending after opt-out, and isolates changed addresses", async () => {
    const sqlite = new DatabaseSync(":memory:");
    try {
      sqlite.exec(readFileSync("migrations/daily-agent/0001_daily_delivery.sql", "utf8"));
      const db = { prepare(sql: string) {
        const statement = sqlite.prepare(sql);
        let args: any[] = [];
        const adapter = {
          bind(...values: any[]) { args = values; return adapter; },
          async first() { return statement.get(...args); },
          async all() { return { results: statement.all(...args) }; },
          async run() { return { success: true, meta: { changes: Number(statement.run(...args).changes) } }; },
        };
        return adapter;
      }};
      const env = {HD_DAILY_EMAIL_DB:db,HD_DAILY_EMAIL_ENABLED:"true",BREVO_API_KEY:"fixture",BREVO_SENDER_EMAIL:"sender@example.invalid"};
      const enable = () => handleDailyEmail(prefsRequest({enabled:true,locale:"en",consent:true}),env);
      const disable = () => handleDailyEmail(prefsRequest({enabled:false,locale:"en",consent:false}),env);
      const preference = () => sqlite.prepare("SELECT * FROM hd_daily_preferences WHERE user_id=7").get()!;
      expect((await enable()).status).toBe(200);
      const original = String(preference().unsubscribe_token);
      const send = vi.fn(async (_url: string, init: RequestInit) => {
        const payload = JSON.parse(String(init.body));
        expect(payload.to).toEqual([{email:user.email}]);
        expect(payload.textContent).toContain("unsubscribe?token="+original);
        return Response.json({messageId:"fixture-message"},{status:201});
      });
      expect((await deliverDailyBatch(env,now,send as unknown as typeof fetch)).sent).toBe(1);
      expect((await deliverDailyBatch(env,now,send as unknown as typeof fetch)).sent).toBe(0);
      expect(send).toHaveBeenCalledTimes(1);
      expect((await disable()).status).toBe(200);
      expect((await enable()).status).toBe(200);
      expect(preference().unsubscribe_token).toBe(original);
      const oldLink = base+"unsubscribe?token="+original;
      expect((await handleDailyEmail(new Request(oldLink),env)).status).toBe(200);
      expect(preference().enabled).toBe(1);
      expect((await handleDailyEmail(new Request(oldLink,{method:"POST"}),env)).status).toBe(200);
      expect(preference().enabled).toBe(0);
      expect((await deliverDailyBatch(env,new Date("2026-11-26T07:15:00Z"),send as unknown as typeof fetch)).sent).toBe(0);
      expect(send).toHaveBeenCalledTimes(1);
      vi.mocked(getSessionUser).mockResolvedValue({id:7,email:"changed@example.invalid"} as any);
      expect((await enable()).status).toBe(200);
      expect(preference().unsubscribe_token).not.toBe(original);
      await handleDailyEmail(new Request(oldLink,{method:"POST"}),env);
      expect(preference().enabled).toBe(1);
      expect(preference().email).toBe("changed@example.invalid");
    } finally { sqlite.close(); }
  });
});
