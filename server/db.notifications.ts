/**
 * Database helpers for user_notifications table.
 */

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import { userNotifications, type InsertUserNotification, type UserNotification } from "../drizzle/schema";

export async function createNotification(
  data: Omit<InsertUserNotification, "id" | "isRead" | "createdAt">
): Promise<UserNotification | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userNotifications).values({
    ...data,
    isRead: false,
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
  const rows = await db
    .select()
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, false)));
  return rows.length;
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(userNotifications)
    .set({ isRead: true })
    .where(eq(userNotifications.userId, userId));
}
