import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function savePushSubscription(
  userId: number,
  sub: PushSubscriptionData,
  locale: string = "cs"
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, sub.endpoint)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        locale,
        updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      })
      .where(eq(pushSubscriptions.id, existing[0].id));
  } else {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      locale,
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  }
}

export async function removePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}
