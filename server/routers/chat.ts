import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { chatConversations, chatMessages } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

const MAX_MESSAGES_PER_CONVERSATION = 100;
const MAX_CONVERSATIONS_PER_USER = 10;

export const chatRouter = router({
  /** Get the most recent conversation for the current user (or create one) */
  getOrCreateConversation: protectedProcedure
    .input(z.object({ locale: z.enum(["cs", "en"]).default("cs") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Find most recent conversation
      const existing = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.userId, ctx.user.id), eq(chatConversations.locale, input.locale)))
        .orderBy(desc(chatConversations.lastMessageAt))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new conversation
      const result = await db.insert(chatConversations).values({
        userId: ctx.user.id,
        locale: input.locale,
        title: null,
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      });
      const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
      return {
        id: Number(insertId),
        userId: ctx.user.id,
        locale: input.locale,
        title: null,
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };
    }),

  /** Get message history for a conversation */
  getHistory: protectedProcedure
    .input(z.object({ conversationId: z.number(), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Verify ownership
      const conv = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.id, input.conversationId), eq(chatConversations.userId, ctx.user.id)))
        .limit(1);
      if (conv.length === 0) return [];

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.conversationId))
        .orderBy(asc(chatMessages.createdAt))
        .limit(input.limit);

      return messages;
    }),

  /** Save a message pair (user + assistant) to the conversation */
  saveMessages: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      userMessage: z.string().max(5000),
      assistantMessage: z.string().max(10000),
      locale: z.enum(["cs", "en"]).default("cs"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return;

      // Verify ownership
      const conv = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.id, input.conversationId), eq(chatConversations.userId, ctx.user.id)))
        .limit(1);
      if (conv.length === 0) return;

      const now = new Date();

      // Insert user message
      await db.insert(chatMessages).values({
        conversationId: input.conversationId,
        userId: ctx.user.id,
        role: "user",
        content: input.userMessage,
        createdAt: now,
      });

      // Insert assistant message
      await db.insert(chatMessages).values({
        conversationId: input.conversationId,
        userId: ctx.user.id,
        role: "assistant",
        content: input.assistantMessage,
        createdAt: new Date(now.getTime() + 1),
      });

      // Auto-generate title from first user message if not set
      const currentConv = conv[0];
      const newTitle = !currentConv.title
        ? input.userMessage.slice(0, 60) + (input.userMessage.length > 60 ? "…" : "")
        : currentConv.title;

      // Update conversation stats
      await db.update(chatConversations)
        .set({
          messageCount: (currentConv.messageCount || 0) + 2,
          lastMessageAt: now,
          title: newTitle,
        })
        .where(eq(chatConversations.id, input.conversationId));

      // Prune old messages if over limit
      const allMessages = await db
        .select({ id: chatMessages.id })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.conversationId))
        .orderBy(asc(chatMessages.createdAt));

      if (allMessages.length > MAX_MESSAGES_PER_CONVERSATION) {
        const toDelete = allMessages.slice(0, allMessages.length - MAX_MESSAGES_PER_CONVERSATION);
        for (const msg of toDelete) {
          await db.delete(chatMessages).where(eq(chatMessages.id, msg.id));
        }
      }

      return { success: true };
    }),

  /** Clear conversation history (start fresh) */
  clearHistory: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return;

      // Verify ownership
      const conv = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.id, input.conversationId), eq(chatConversations.userId, ctx.user.id)))
        .limit(1);
      if (conv.length === 0) return;

      await db.delete(chatMessages).where(eq(chatMessages.conversationId, input.conversationId));
      await db.update(chatConversations)
        .set({ messageCount: 0, title: null, lastMessageAt: new Date() })
        .where(eq(chatConversations.id, input.conversationId));

      return { success: true };
    }),

  /** Create a new conversation (for new thread) */
  createConversation: protectedProcedure
    .input(z.object({ locale: z.enum(["cs", "en"]).default("cs") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const result = await db.insert(chatConversations).values({
        userId: ctx.user.id,
        locale: input.locale,
        title: null,
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      });
      const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
      return {
        id: Number(insertId),
        userId: ctx.user.id,
        locale: input.locale,
        title: null,
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };
    }),

  /** List all conversations for the current user */
  listConversations: protectedProcedure
    .input(z.object({ locale: z.enum(["cs", "en"]).default("cs") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.userId, ctx.user.id), eq(chatConversations.locale, input.locale)))
        .orderBy(desc(chatConversations.lastMessageAt))
        .limit(MAX_CONVERSATIONS_PER_USER);
    }),
});
