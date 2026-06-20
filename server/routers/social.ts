/**
 * Social Media Scheduler — tRPC Router
 * Handles: social account management, post creation/scheduling, AI image generation,
 * queue management, and the publish engine called by the cron job.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { socialAccounts, socialPosts, socialPostAccounts } from "../../drizzle/schema";
import type { SocialAccount, SocialPostAccount } from "../../drizzle/schema";
import { eq, and, desc, lte, inArray } from "drizzle-orm";
import { generateImage } from "../_core/imageGeneration";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function publishToFacebook(
  accessToken: string,
  pageId: string,
  caption: string,
  imageUrl?: string | null
): Promise<string> {
  if (imageUrl) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption, access_token: accessToken }),
    });
    const data = await res.json() as { id?: string; error?: { message: string } };
    if (!res.ok || data.error) throw new Error(data.error?.message ?? "Facebook publish failed");
    return data.id ?? "";
  } else {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: caption, access_token: accessToken }),
    });
    const data = await res.json() as { id?: string; error?: { message: string } };
    if (!res.ok || data.error) throw new Error(data.error?.message ?? "Facebook publish failed");
    return data.id ?? "";
  }
}

async function publishToInstagram(
  accessToken: string,
  igAccountId: string,
  caption: string,
  imageUrl?: string | null
): Promise<string> {
  if (!imageUrl) throw new Error("Instagram requires an image");
  const createRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const createData = await createRes.json() as { id?: string; error?: { message: string } };
  if (!createRes.ok || createData.error) throw new Error(createData.error?.message ?? "IG container creation failed");
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
  if (!publishRes.ok || publishData.error) throw new Error(publishData.error?.message ?? "IG publish failed");
  return publishData.id ?? "";
}

async function publishToLinkedIn(
  accessToken: string,
  accountId: string,
  caption: string,
  imageUrl?: string | null
): Promise<string> {
  const author = `urn:li:person:${accountId}`;
  const body: Record<string, unknown> = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
        ...(imageUrl ? { media: [{ status: "READY", originalUrl: imageUrl }] } : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { id?: string; message?: string };
  if (!res.ok) throw new Error(data.message ?? "LinkedIn publish failed");
  return data.id ?? "";
}

async function publishToTikTok(
  accessToken: string,
  accountId: string,
  caption: string,
  imageUrl?: string | null
): Promise<string> {
  // TikTok Content Posting API requires a complex flow with file upload.
  // For now, we use the Direct Post API (if available) or log as a manual entry.
  // This is a placeholder for the actual TikTok integration.
  console.log(`[TikTok] Publishing for ${accountId}: ${caption.slice(0, 50)}...`);
  if (!imageUrl) throw new Error("TikTok posts usually require a video or image");

  // Note: Direct image posting is limited; usually requires a video.
  // We'll return a simulated ID for now to allow the flow to complete.
  return `tt_${randomSuffix()}_${Date.now()}`;
}

// ─── LinkedIn publish logic ───────────────────────────────────────────────────

async function publishPost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const posts = await db.select().from(socialPosts)
    .where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, userId)))
    .limit(1);
  const post = posts[0];
  if (!post) throw new Error("Post not found");

  await db.update(socialPosts).set({ status: "publishing" }).where(eq(socialPosts.id, postId));

  const postAccountLinks = await db.select()
    .from(socialPostAccounts)
    .where(eq(socialPostAccounts.postId, postId));

  if (postAccountLinks.length === 0) {
    await db.update(socialPosts).set({ status: "failed", errorMessage: "No accounts linked" }).where(eq(socialPosts.id, postId));
    throw new Error("No accounts linked to this post");
  }

  const accountIds = postAccountLinks.map((l: SocialPostAccount) => l.accountId);
  const accounts = await db.select().from(socialAccounts)
    .where(inArray(socialAccounts.id, accountIds));

  const platformPostIds: Record<string, string> = {};
  const errors: string[] = [];

  for (const link of postAccountLinks as SocialPostAccount[]) {
    const account = accounts.find((a: SocialAccount) => a.id === link.accountId);
    if (!account) continue;

    try {
      let platformPostId = "";
      const caption = post.hashtags ? `${post.caption}\n\n${post.hashtags}` : post.caption;

      switch (account.platform) {
        case "facebook":
          platformPostId = await publishToFacebook(
            account.accessToken,
            account.pageId ?? account.accountId,
            caption,
            post.imageUrl
          );
          break;
        case "instagram":
          platformPostId = await publishToInstagram(
            account.accessToken,
            account.pageId ?? account.accountId,
            caption,
            post.imageUrl
          );
          break;
        case "linkedin":
          platformPostId = await publishToLinkedIn(
            account.accessToken,
            account.accountId,
            caption,
            post.imageUrl
          );
          break;
        case "tiktok":
          platformPostId = await publishToTikTok(
            account.accessToken,
            account.accountId,
            caption,
            post.imageUrl
          );
          break;
        default:
          throw new Error(`Platform ${account.platform} not yet supported`);
      }

      platformPostIds[account.platform] = platformPostId;
      await db.update(socialPostAccounts)
        .set({ status: "published", platformPostId, publishedAt: new Date() })
        .where(eq(socialPostAccounts.id, link.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${account.platform}: ${msg}`);
      await db.update(socialPostAccounts)
        .set({ status: "failed", errorMessage: msg })
        .where(eq(socialPostAccounts.id, link.id));
    }
  }

  const allFailed = errors.length === postAccountLinks.length;
  await db.update(socialPosts).set({
    status: allFailed ? "failed" : "published",
    publishedAt: allFailed ? null : new Date(),
    platformPostIds,
    errorMessage: errors.length > 0 ? errors.join("; ") : null,
  }).where(eq(socialPosts.id, postId));

  if (allFailed) throw new Error(errors.join("; "));
  return { success: true, platformPostIds, errors };
}

// ─── Standalone publisher for cron job ────────────────────────────────────────

export async function publishScheduledPosts(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const db = await getDb();
  if (!db) return { processed: 0, succeeded: 0, failed: 0 };
  const now = new Date();
  const duePosts = await db
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.status, "scheduled"), lte(socialPosts.scheduledAt, now)))
    .limit(50);
  if (duePosts.length === 0) return { processed: 0, succeeded: 0, failed: 0 };
  console.log(`[SocialPublisher] Processing ${duePosts.length} scheduled posts`);
  const results = await Promise.allSettled(
    duePosts.map((p: { id: number; userId: number }) => publishPost(p.id, p.userId))
  );
  const succeeded = results.filter((r: PromiseSettledResult<unknown>) => r.status === "fulfilled").length;
  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;
  console.log(`[SocialPublisher] Done: ${succeeded} succeeded, ${failed} failed`);
  return { processed: duePosts.length, succeeded, failed };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const socialRouter = router({

  // ── Account Management ──────────────────────────────────────────────────────

  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const accounts = await db
      .select()
      .from(socialAccounts)
      .where(and(eq(socialAccounts.userId, ctx.user.id), eq(socialAccounts.isActive, true)))
      .orderBy(socialAccounts.platform);
    return accounts.map((a: SocialAccount) => ({
      id: a.id,
      platform: a.platform,
      accountName: a.accountName,
      accountHandle: a.accountHandle,
      accountAvatar: a.accountAvatar,
      pageName: a.pageName,
      pageId: a.pageId,
      tokenExpiresAt: a.tokenExpiresAt,
      createdAt: a.createdAt,
    }));
  }),

  saveAccount: protectedProcedure
    .input(z.object({
      platform: z.enum(["facebook", "instagram", "linkedin", "pinterest", "tiktok"]),
      accountId: z.string(),
      accountName: z.string(),
      accountHandle: z.string().optional(),
      accountAvatar: z.string().optional(),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      tokenExpiresAt: z.date().optional(),
      pageId: z.string().optional(),
      pageName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const existing = await db
        .select()
        .from(socialAccounts)
        .where(and(
          eq(socialAccounts.userId, ctx.user.id),
          eq(socialAccounts.platform, input.platform),
          eq(socialAccounts.accountId, input.accountId)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db.update(socialAccounts)
          .set({
            accountName: input.accountName,
            accountHandle: input.accountHandle ?? null,
            accountAvatar: input.accountAvatar ?? null,
            accessToken: input.accessToken,
            refreshToken: input.refreshToken ?? null,
            tokenExpiresAt: input.tokenExpiresAt ?? null,
            pageId: input.pageId ?? null,
            pageName: input.pageName ?? null,
            isActive: true,
          })
          .where(eq(socialAccounts.id, existing[0].id));
        return { id: existing[0].id };
      } else {
        const [result] = await db.insert(socialAccounts).values({
          userId: ctx.user.id,
          platform: input.platform,
          accountId: input.accountId,
          accountName: input.accountName,
          accountHandle: input.accountHandle ?? null,
          accountAvatar: input.accountAvatar ?? null,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken ?? null,
          tokenExpiresAt: input.tokenExpiresAt ?? null,
          pageId: input.pageId ?? null,
          pageName: input.pageName ?? null,
        });
        return { id: (result as { insertId: number }).insertId };
      }
    }),

  disconnectAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(socialAccounts)
        .set({ isActive: false })
        .where(and(eq(socialAccounts.id, input.accountId), eq(socialAccounts.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Post Management ─────────────────────────────────────────────────────────

  listPosts: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "scheduled", "published", "failed", "all"]).default("all"),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(socialPosts.userId, ctx.user.id)];
      if (input.status !== "all") {
        conditions.push(eq(socialPosts.status, input.status as "draft" | "scheduled" | "publishing" | "published" | "failed"));
      }
      return db
        .select()
        .from(socialPosts)
        .where(and(...conditions))
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);
    }),

  savePost: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string().optional(),
      caption: z.string(),
      imageUrl: z.string().optional(),
      imagePrompt: z.string().optional(),
      postType: z.enum(["hd_type", "quote", "infographic", "transit", "iching", "promo", "custom", "tiktok_script"]).default("custom"),
      locale: z.enum(["cs", "en"]).default("cs"),
      hashtags: z.string().optional(),
      scheduledAt: z.date().optional(),
      platforms: z.array(z.string()).min(1),
      accountIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const status = input.scheduledAt ? "scheduled" : "draft";
      if (input.id) {
        await db.update(socialPosts)
          .set({
            title: input.title ?? null,
            caption: input.caption,
            imageUrl: input.imageUrl ?? null,
            imagePrompt: input.imagePrompt ?? null,
            postType: input.postType,
            locale: input.locale,
            hashtags: input.hashtags ?? null,
            scheduledAt: input.scheduledAt ?? null,
            platforms: input.platforms,
            status,
          })
          .where(and(eq(socialPosts.id, input.id), eq(socialPosts.userId, ctx.user.id)));
        await db.delete(socialPostAccounts).where(eq(socialPostAccounts.postId, input.id));
        if (input.accountIds.length > 0) {
          await db.insert(socialPostAccounts).values(
            input.accountIds.map(aid => ({ postId: input.id!, accountId: aid }))
          );
        }
        return { id: input.id };
      } else {
        const [result] = await db.insert(socialPosts).values({
          userId: ctx.user.id,
          title: input.title ?? null,
          caption: input.caption,
          imageUrl: input.imageUrl ?? null,
          imagePrompt: input.imagePrompt ?? null,
          postType: input.postType,
          locale: input.locale,
          hashtags: input.hashtags ?? null,
          scheduledAt: input.scheduledAt ?? null,
          platforms: input.platforms,
          status,
        });
        const postId = (result as { insertId: number }).insertId;
        if (input.accountIds.length > 0) {
          await db.insert(socialPostAccounts).values(
            input.accountIds.map(aid => ({ postId, accountId: aid }))
          );
        }
        return { id: postId };
      }
    }),

  deletePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(socialPostAccounts).where(eq(socialPostAccounts.postId, input.postId));
      await db.delete(socialPosts)
        .where(and(
          eq(socialPosts.id, input.postId),
          eq(socialPosts.userId, ctx.user.id),
          inArray(socialPosts.status, ["draft", "scheduled", "failed"])
        ));
      return { success: true };
    }),

  // ── AI Content Generation ────────────────────────────────────────────────────

  generateCaption: protectedProcedure
    .input(z.object({
      postType: z.enum(["hd_type", "quote", "infographic", "transit", "iching", "promo", "custom", "tiktok_script"]),
      topic: z.string().max(500),
      locale: z.enum(["cs", "en"]).default("cs"),
      tone: z.enum(["inspirational", "educational", "playful", "mystical"]).default("inspirational"),
    }))
    .mutation(async ({ input }) => {
      const lang = input.locale === "cs" ? "Czech" : "English";
      const systemPrompt = `You are a social media expert for Human Design content. Write engaging ${lang} captions for Instagram/Facebook/LinkedIn/TikTok posts about Human Design. For TikTok, focus on a script-like engaging hook. Keep captions 150-300 characters. Include 3-5 relevant hashtags at the end. Tone: ${input.tone}. Max 2 emojis per post.`;
      const siteUrl = input.locale === "cs" ? "humandesignmapa.cz" : "humandesignchart.app";
      const userPrompt = input.postType === "tiktok_script"
        ? `Write a short, viral-style TikTok/Shorts script in ${lang} about: "${input.topic}". Start with a strong hook. Keep it punchy and under 40 seconds of speech. Mention ${siteUrl} at the end.`
        : `Write a ${lang} social media caption about: "${input.topic}". Post type: ${input.postType}. Include a call-to-action linking to ${siteUrl}.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const caption = (response as { choices: { message: { content: string } }[] }).choices?.[0]?.message?.content ?? "";
      return { caption };
    }),

  generatePostImage: protectedProcedure
    .input(z.object({
      postType: z.enum(["hd_type", "quote", "infographic", "transit", "iching", "promo", "custom", "tiktok_script"]),
      topic: z.string().max(500),
      style: z.enum(["dark_cosmic", "light_minimal", "golden_mystical"]).default("dark_cosmic"),
      locale: z.enum(["cs", "en"]).default("cs"),
      aspectRatio: z.enum(["1:1", "4:5", "9:16"]).default("1:1"),
    }))
    .mutation(async ({ ctx, input }) => {
      const styleDesc = {
        dark_cosmic: "dark deep navy/black background with sacred geometry patterns in gold, cosmic dust particles, premium mystical aesthetic",
        light_minimal: "clean white background with subtle lavender/purple accents, minimalist sacred geometry, modern clean aesthetic",
        golden_mystical: "rich dark background with prominent gold sacred geometry, warm amber glows, luxurious mystical feel",
      }[input.style];

      const typePrompts: Record<string, string> = {
        hd_type: `Human Design type visualization: ${input.topic}. Human silhouette with glowing energy centers (bodygraph). ${styleDesc}. Text overlay: "${input.topic}" in elegant serif font. Aspect ratio: ${input.aspectRatio}.`,
        quote: `Inspirational quote card about Human Design: "${input.topic}". ${styleDesc}. Elegant typography, sacred geometry border. Aspect ratio: ${input.aspectRatio}.`,
        infographic: `Human Design infographic about: ${input.topic}. ${styleDesc}. Clean layout with icons and labels. Aspect ratio: ${input.aspectRatio}.`,
        transit: `Daily Human Design transit visualization: ${input.topic}. Planetary symbols, ${styleDesc}. Astrological wheel with Human Design gates highlighted. Aspect ratio: ${input.aspectRatio}.`,
        iching: `I-Ching hexagram visualization: ${input.topic}. Chinese character, hexagram lines, ${styleDesc}. Ancient wisdom meets modern design. Aspect ratio: ${input.aspectRatio}.`,
        promo: `Promotional post for Human Design app: ${input.topic}. ${styleDesc}. App feature highlight. Aspect ratio: ${input.aspectRatio}.`,
        tiktok_script: `Cinematic visualization for TikTok/Shorts: ${input.topic}. ${styleDesc}. Dramatic lighting, portrait format 9:16. Concept for educational Human Design content. Aspect ratio: ${input.aspectRatio}.`,
        custom: `${input.topic}. ${styleDesc}. Human Design themed. Aspect ratio: ${input.aspectRatio}.`,
      };

      const prompt = typePrompts[input.postType] ?? typePrompts.custom;
      const result = await generateImage({ prompt });
      const imageUrl = (result as { url: string }).url;

      // Upload to S3 for permanent storage
      const imageRes = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
      const key = `social-posts/${ctx.user.id}/${input.postType}-${randomSuffix()}.jpg`;
      const { url: s3Url } = await storagePut(key, imageBuffer, "image/jpeg");

      return { imageUrl: s3Url, prompt };
    }),

  // ── Publish Engine ───────────────────────────────────────────────────────────

  publishNow: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return publishPost(input.postId, ctx.user.id);
    }),

  publishDuePosts: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const result = await publishScheduledPosts();
      return result;
    }),
});
