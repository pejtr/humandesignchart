import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

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
