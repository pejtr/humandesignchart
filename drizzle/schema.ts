import { int, bigint, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, float } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "none"]).default("none").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["monthly", "annual", "none"]).default("none").notNull(),
  subscriptionCurrentPeriodEnd: timestamp("subscriptionCurrentPeriodEnd"),
  aiReadingCredits: int("aiReadingCredits").default(0).notNull(),
  referralCode: varchar("referralCode", { length: 16 }).unique(),
  // Gamification
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastLoginDate: varchar("lastLoginDate", { length: 10 }), // YYYY-MM-DD
  lastDailyRewardAt: timestamp("lastDailyRewardAt"),
  level: mysqlEnum("level", ["searcher", "awakened", "initiated", "guide", "master"]).default("searcher").notNull(),
  totalCreditsEarned: int("totalCreditsEarned").default(0).notNull(),
  // Affiliate
  isAffiliate: boolean("isAffiliate").default(false).notNull(),
  affiliateCode: varchar("affiliateCode", { length: 16 }).unique(),
  affiliateTier: mysqlEnum("affiliateTier", ["bronze", "silver", "gold"]).default("bronze").notNull(),
  affiliateTotalEarned: float("affiliateTotalEarned").default(0).notNull(),
  affiliatePendingPayout: float("affiliatePendingPayout").default(0).notNull(),
  // LeadOS CRM sync
  crmStatus: varchar("crm_status", { length: 32 }),
  crmNote: text("crm_note"),
  crmUpdatedAt: bigint("crm_updated_at", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const charts = mysqlTable("charts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: varchar("birthDate", { length: 30 }).notNull(),
  birthTime: varchar("birthTime", { length: 10 }).notNull(),
  birthPlace: varchar("birthPlace", { length: 500 }).notNull(),
  latitude: varchar("latitude", { length: 30 }).notNull(),
  longitude: varchar("longitude", { length: 30 }).notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["self", "family", "friend", "client", "celebrity", "other"]).default("other").notNull(),
  roleTag: mysqlEnum("roleTag", ["partner", "partnerka", "manzel", "manzelka", "sef", "sefova", "kolega", "pritel", "pritelkyne", "rodic", "dite", "sourozenec", "kamarad", "klient", "mentor", "jine"]).default("jine"),
  chartData: json("chartData"),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const celebrities = mysqlTable("celebrities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: varchar("birthDate", { length: 30 }).notNull(),
  birthTime: varchar("birthTime", { length: 10 }).notNull(),
  birthPlace: varchar("birthPlace", { length: 500 }).notNull(),
  latitude: varchar("latitude", { length: 30 }).notNull(),
  longitude: varchar("longitude", { length: 30 }).notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  imageUrl: text("imageUrl"),
  chartData: json("chartData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aiReadings = mysqlTable("aiReadings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chartId: int("chartId").notNull(),
  readingType: varchar("readingType", { length: 50 }).notNull(),
  content: text("content"),
  rating: mysqlEnum("rating", ["up", "down"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sharedCharts = mysqlTable("sharedCharts", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  chartData: json("chartData").notNull(),
  ownerName: varchar("ownerName", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const giftVouchers = mysqlTable("giftVouchers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  purchasedByUserId: int("purchasedByUserId"),
  redeemedByUserId: int("redeemedByUserId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientName: varchar("recipientName", { length: 255 }),
  senderName: varchar("senderName", { length: 255 }),
  personalMessage: text("personalMessage"),
  plan: mysqlEnum("plan", ["monthly", "annual", "credits"]).notNull(),
  creditsAmount: int("creditsAmount").default(0).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 64 }),
  isRedeemed: boolean("isRedeemed").default(false).notNull(),
  expiresAt: timestamp("expiresAt"),
  redeemedAt: timestamp("redeemedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 16 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  referrerCredited: boolean("referrerCredited").default(false).notNull(),
  referredCredited: boolean("referredCredited").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// ─── Gamification ─────────────────────────────────────────────────────────────

export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // positive = earned, negative = spent
  reason: varchar("reason", { length: 100 }).notNull(), // 'daily_reward', 'streak_bonus', 'referral', 'affiliate', 'reading_spent', 'registration', 'share'
  metadata: json("metadata"), // extra context (e.g. streakDay, affiliateConversionId)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Affiliate ────────────────────────────────────────────────────────────────

export const affiliateConversions = mysqlTable("affiliateConversions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateUserId: int("affiliateUserId").notNull(),
  convertedUserId: int("convertedUserId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  amount: float("amount").notNull(), // subscription amount in CZK
  commissionRate: float("commissionRate").notNull(), // 0.20 = 20%
  commissionAmount: float("commissionAmount").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const affiliatePayouts = mysqlTable("affiliatePayouts", {
  id: int("id").autoincrement().primaryKey(),
  affiliateUserId: int("affiliateUserId").notNull(),
  amount: float("amount").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "paypal"]).default("bank_transfer").notNull(),
  paymentDetails: text("paymentDetails"), // IBAN or PayPal email (encrypted at app level)
  status: mysqlEnum("status", ["requested", "processing", "paid", "rejected"]).default("requested").notNull(),
  note: text("note"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Social Media Scheduler ──────────────────────────────────────────────────

export const socialAccounts = mysqlTable("socialAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram", "linkedin", "pinterest"]).notNull(),
  accountId: varchar("accountId", { length: 128 }).notNull(),   // platform user/page ID
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountHandle: varchar("accountHandle", { length: 128 }),
  accountAvatar: text("accountAvatar"),
  accessToken: text("accessToken").notNull(),                   // encrypted OAuth token
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  pageId: varchar("pageId", { length: 128 }),                   // FB page / IG business account
  pageName: varchar("pageName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const socialPosts = mysqlTable("socialPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),                     // internal label
  caption: text("caption").notNull(),                           // post text/caption
  imageUrl: text("imageUrl"),                                   // S3 URL of generated image
  imagePrompt: text("imagePrompt"),                             // AI prompt used to generate image
  postType: mysqlEnum("postType", ["hd_type", "quote", "infographic", "transit", "iching", "promo", "custom"]).default("custom").notNull(),
  locale: mysqlEnum("locale", ["cs", "en"]).default("cs").notNull(),
  hashtags: text("hashtags"),                                   // space-separated hashtags
  scheduledAt: timestamp("scheduledAt"),                        // null = draft
  publishedAt: timestamp("publishedAt"),                        // null = not yet published
  status: mysqlEnum("status", ["draft", "scheduled", "publishing", "published", "failed"]).default("draft").notNull(),
  errorMessage: text("errorMessage"),
  platforms: json("platforms").notNull(),                       // string[] of platform names
  platformPostIds: json("platformPostIds"),                     // { facebook: 'xxx', instagram: 'yyy' }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const socialPostAccounts = mysqlTable("socialPostAccounts", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  accountId: int("accountId").notNull(),
  status: mysqlEnum("status", ["pending", "published", "failed"]).default("pending").notNull(),
  platformPostId: varchar("platformPostId", { length: 255 }),
  errorMessage: text("errorMessage"),
  publishedAt: timestamp("publishedAt"),
});

// ─── AI Chat Conversations (persistent memory for logged-in users) ───────────
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  locale: varchar("locale", { length: 5 }).default("cs").notNull(),
  title: varchar("title", { length: 255 }),
  messageCount: int("messageCount").default(0).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Chart = typeof charts.$inferSelect;
export type InsertChart = typeof charts.$inferInsert;
export type Celebrity = typeof celebrities.$inferSelect;
export type InsertCelebrity = typeof celebrities.$inferInsert;
export type AiReading = typeof aiReadings.$inferSelect;
export type InsertAiReading = typeof aiReadings.$inferInsert;
export type SharedChart = typeof sharedCharts.$inferSelect;
export type InsertSharedChart = typeof sharedCharts.$inferInsert;
export type GiftVoucher = typeof giftVouchers.$inferSelect;
export type InsertGiftVoucher = typeof giftVouchers.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type InsertAffiliateConversion = typeof affiliateConversions.$inferInsert;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type InsertAffiliatePayout = typeof affiliatePayouts.$inferInsert;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;
export type SocialPostAccount = typeof socialPostAccounts.$inferSelect;
export type InsertSocialPostAccount = typeof socialPostAccounts.$inferInsert;

// ─── Newsletter Subscribers ──────────────────────────────────────────────────
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  locale: varchar("locale", { length: 5 }).default("cs").notNull(),
  source: varchar("source", { length: 50 }).default("popup").notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// ─── User Notifications ───────────────────────────────────────────────────────
export const userNotifications = mysqlTable("user_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),           // null = broadcast to all users
  type: mysqlEnum("type", ["crm_status", "campaign", "system", "credit", "achievement"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: json("data"),                        // arbitrary payload (e.g. { oldStatus, newStatus, campaignName })
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;
