import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { sendLeadOSEvent } from "./leados";

/** Helper to trigger weekly transit forecast email digests for subscribed users */
export async function processWeeklyTransitDigest() {
  const db = await getDb();
  if (!db) return;

  try {
    const userList = await db.select().from(users).limit(100);

    for (const u of userList) {
      if (!u.email) continue;

      sendLeadOSEvent({
        event: "chart_created",
        data: {
          email: u.email,
          name: u.name,
          tags: ["weekly_transit_digest", "planetary_forecast"],
          campaign: "weekly_transit_nurture",
        },
      });
    }
  } catch (e) {
    console.error("[TransitNewsletter] Digest generation error:", e);
  }
}
