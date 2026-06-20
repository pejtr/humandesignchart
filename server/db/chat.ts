import { eq, and, desc, sql } from "drizzle-orm";
import { chatConversations, chatMessages, InsertChatConversation, InsertChatMessage } from "../../drizzle/schema";
import { getDb } from "./index";

export async function getOrCreateConversation(userId: number, chartId: number | null, locale: string = 'cs') {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Try to find an existing active conversation for this user and chart
    let conversation = await db.select().from(chatConversations)
        .where(
            and(
                eq(chatConversations.userId, userId),
                chartId ? eq(chatConversations.chartId, chartId) : sql`${chatConversations.chartId} IS NULL`,
                eq(chatConversations.locale, locale)
            )
        )
        .orderBy(desc(chatConversations.lastMessageAt))
        .limit(1);

    if (conversation.length > 0) {
        return conversation[0];
    }

    // Create new conversation if none exists
    const newConversation: InsertChatConversation = {
        userId,
        chartId,
        locale,
        messageCount: 0,
        lastMessageAt: new Date().toISOString(),
    };

    const result = await db.insert(chatConversations).values(newConversation);
    const id = result[0].insertId;

    return { ...newConversation, id };
}

export async function getChatMessages(conversationId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db.select().from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(chatMessages.createdAt);
}

export async function saveChatMessage(conversationId: number, userId: number, role: 'user' | 'assistant', content: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const newMessage: InsertChatMessage = {
        conversationId,
        userId,
        role,
        content,
    };

    await db.insert(chatMessages).values(newMessage);

    // Update conversation stats
    await db.update(chatConversations)
        .set({
            messageCount: sql`${chatConversations.messageCount} + 1`,
            lastMessageAt: new Date().toISOString(),
        })
        .where(eq(chatConversations.id, conversationId));
}

export async function clearChatHistory(conversationId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(chatMessages).where(eq(chatMessages.conversationId, conversationId));

    await db.update(chatConversations)
        .set({
            messageCount: 0,
            lastMessageAt: new Date().toISOString(),
        })
        .where(eq(chatConversations.id, conversationId));
}
