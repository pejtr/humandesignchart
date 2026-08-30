/**
 * Database helpers for user_notifications table.
 */

import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { userNotifications, type InsertUserNotification, type UserNotification } from "../drizzle/schema";

export async function createNotification(
  data: Omit<InsertUserNotification, "id" | "isRead" | "createdAt">
): Promise<UserNotification | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userNotifications).values({
    ...data,
    isRead: 0,
  });
  const insertId = (result[0] as unknown as { insertId: number }).insertId;
  const [row] = await db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.id, insertId));
  return row ?? null;
}

export async function getUserNotifications(
  userId: number,
  limit = 30
): Promise<UserNotification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, 0)));
  return result[0]?.count ?? 0;
}

export async function hasDailyTransitNotification(userId: number, pragueDay: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ id: userNotifications.id })
    .from(userNotifications)
    .where(and(
      eq(userNotifications.userId, userId),
      eq(userNotifications.type, "system"),
      sql`JSON_UNQUOTE(JSON_EXTRACT(${userNotifications.data}, '$.dailyTransitDate')) = ${pragueDay}`,
    ))
    .limit(1);
  return Boolean(row);
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(userNotifications)
    .set({ isRead: 1 })
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(userNotifications)
    .set({ isRead: 1 })
    .where(eq(userNotifications.userId, userId));
}
