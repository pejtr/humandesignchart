import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { chatConversations } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getOrCreateConversation,
  getChatMessages,
  saveChatMessage,
  clearChatHistory
} from "../db/chat";

const MAX_CONVERSATIONS_PER_USER = 10;

export const chatRouter = router({
  /** Get the most recent conversation for the current user (or create one) */
  getOrCreateConversation: protectedProcedure
    .input(z.object({
      chartId: z.number().optional().nullable(),
      locale: z.enum(["cs", "en"]).default("cs")
    }))
    .mutation(async ({ ctx, input }) => {
      return getOrCreateConversation(ctx.user.id, input.chartId ?? null, input.locale);
    }),

  /** Get message history for a conversation */
  getHistory: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const db = await getDb();
      if (!db) return [];
      const conv = await db.select().from(chatConversations)
        .where(and(eq(chatConversations.id, input.conversationId), eq(chatConversations.userId, ctx.user.id)))
        .limit(1);

      if (conv.length === 0) return [];

      return getChatMessages(input.conversationId);
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
      // Verify ownership
      const db = await getDb();
      if (!db) return;
      const conv = await db.select().from(chatConversations)
        .where(and(eq(chatConversations.id, input.conversationId), eq(chatConversations.userId, ctx.user.id)))
        .limit(1);

      if (conv.length === 0) return;

      await saveChatMessage(input.conversationId, ctx.user.id, "user", input.userMessage);
      await saveChatMessage(input.conversationId, ctx.user.id, "assistant", input.assistantMessage);

      return { success: true };
    }),

  /** Clear conversation history (start fresh) */
  clearHistory: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const db = await getDb();
      if (!db) return;
      const conv = await db.select().from(chatConversations)
        .where(and(eq(chatConversations.id, input.conversationId), eq(chatConversations.userId, ctx.user.id)))
        .limit(1);

      if (conv.length === 0) return;

      await clearChatHistory(input.conversationId);
      return { success: true };
    }),

  /** Create a new conversation (for new thread) */
  createConversation: protectedProcedure
    .input(z.object({
      chartId: z.number().optional().nullable(),
      locale: z.enum(["cs", "en"]).default("cs")
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const result = await db.insert(chatConversations).values({
        userId: ctx.user.id,
        chartId: input.chartId ?? null,
        locale: input.locale,
        title: null,
        messageCount: 0,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
      return {
        id: Number(insertId),
        userId: ctx.user.id,
        chartId: input.chartId ?? null,
        locale: input.locale,
        title: null,
        messageCount: 0,
      };
    }),

  /** List all conversations for the current user */
  listConversations: protectedProcedure
    .input(z.object({
      chartId: z.number().optional().nullable(),
      locale: z.enum(["cs", "en"]).default("cs")
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.userId, ctx.user.id),
            eq(chatConversations.locale, input.locale),
            input.chartId ? eq(chatConversations.chartId, input.chartId) : undefined
          )
        )
        .orderBy(desc(chatConversations.lastMessageAt))
        .limit(MAX_CONVERSATIONS_PER_USER);
    }),
});
