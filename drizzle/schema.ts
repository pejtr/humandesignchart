import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, float, mysqlEnum, timestamp, text, json, unique, bigint, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const affiliateConversions = mysqlTable("affiliateConversions", {
	id: int().autoincrement().notNull(),
	affiliateUserId: int().notNull(),
	convertedUserId: int().notNull(),
	stripeSubscriptionId: varchar({ length: 64 }),
	amount: float().notNull(),
	commissionRate: float().notNull(),
	commissionAmount: float().notNull(),
	status: mysqlEnum(['pending', 'paid', 'cancelled']).default('pending').notNull(),
	paidAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "affiliateConversions_id" }),
	]);

export const affiliatePayouts = mysqlTable("affiliatePayouts", {
	id: int().autoincrement().notNull(),
	affiliateUserId: int().notNull(),
	amount: float().notNull(),
	paymentMethod: mysqlEnum(['bank_transfer', 'paypal']).default('bank_transfer').notNull(),
	paymentDetails: text(),
	status: mysqlEnum(['requested', 'processing', 'paid', 'rejected']).default('requested').notNull(),
	note: text(),
	processedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "affiliatePayouts_id" }),
	]);

export const aiReadings = mysqlTable("aiReadings", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	chartId: int().notNull(),
	readingType: varchar({ length: 50 }).notNull(),
	content: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	rating: mysqlEnum(['up', 'down']),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "aiReadings_id" }),
	]);

export const celebrities = mysqlTable("celebrities", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	birthDate: varchar({ length: 30 }).notNull(),
	birthTime: varchar({ length: 10 }).notNull(),
	birthPlace: varchar({ length: 500 }).notNull(),
	latitude: varchar({ length: 30 }).notNull(),
	longitude: varchar({ length: 30 }).notNull(),
	timezone: varchar({ length: 100 }).notNull(),
	category: varchar({ length: 100 }),
	imageUrl: text(),
	chartData: json(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "celebrities_id" }),
	]);

export const charts = mysqlTable("charts", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	birthDate: varchar({ length: 30 }).notNull(),
	birthTime: varchar({ length: 10 }).notNull(),
	birthPlace: varchar({ length: 500 }).notNull(),
	latitude: varchar({ length: 30 }).notNull(),
	longitude: varchar({ length: 30 }).notNull(),
	timezone: varchar({ length: 100 }).notNull(),
	category: mysqlEnum(['self', 'family', 'friend', 'client', 'celebrity', 'other']).default('other').notNull(),
	chartData: json(),
	isFavorite: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	roleTag: mysqlEnum(['partner', 'partnerka', 'manzel', 'manzelka', 'sef', 'sefova', 'kolega', 'pritel', 'pritelkyne', 'rodic', 'dite', 'sourozenec', 'kamarad', 'klient', 'mentor', 'jine']).default('jine'),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "charts_id" }),
	]);

export const chatConversations = mysqlTable("chatConversations", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	locale: varchar({ length: 5 }).default('cs').notNull(),
	title: varchar({ length: 255 }),
	messageCount: int().default(0).notNull(),
	lastMessageAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "chatConversations_id" }),
	]);

export const chatMessages = mysqlTable("chatMessages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	userId: int().notNull(),
	role: mysqlEnum(['user', 'assistant']).notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "chatMessages_id" }),
	]);

export const creditTransactions = mysqlTable("creditTransactions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	amount: int().notNull(),
	reason: varchar({ length: 100 }).notNull(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "creditTransactions_id" }),
	]);

export const giftVouchers = mysqlTable("giftVouchers", {
	id: int().autoincrement().notNull(),
	code: varchar({ length: 32 }).notNull(),
	purchasedByUserId: int(),
	redeemedByUserId: int(),
	recipientEmail: varchar({ length: 320 }),
	recipientName: varchar({ length: 255 }),
	senderName: varchar({ length: 255 }),
	personalMessage: text(),
	plan: mysqlEnum(['monthly', 'annual', 'credits']).notNull(),
	creditsAmount: int().default(0).notNull(),
	stripePaymentIntentId: varchar({ length: 64 }),
	isRedeemed: tinyint().default(0).notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	redeemedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "giftVouchers_id" }),
		unique("giftVouchers_code_unique").on(table.code),
	]);

export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 320 }).notNull(),
	locale: varchar({ length: 5 }).default('cs').notNull(),
	source: varchar({ length: 50 }).default('popup').notNull(),
	subscribedAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	unsubscribedAt: timestamp({ mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "newsletter_subscribers_id" }),
		unique("newsletter_subscribers_email_unique").on(table.email),
	]);

export const referrals = mysqlTable("referrals", {
	id: int().autoincrement().notNull(),
	referrerId: int().notNull(),
	referredUserId: int().notNull(),
	referralCode: varchar({ length: 16 }).notNull(),
	status: mysqlEnum(['pending', 'completed']).default('pending').notNull(),
	referrerCredited: tinyint().default(0).notNull(),
	referredCredited: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	completedAt: timestamp({ mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "referrals_id" }),
		unique("referrals_referredUserId_unique").on(table.referredUserId),
	]);

export const sharedCharts = mysqlTable("sharedCharts", {
	id: int().autoincrement().notNull(),
	token: varchar({ length: 64 }).notNull(),
	chartData: json().notNull(),
	ownerName: varchar({ length: 255 }),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "sharedCharts_id" }),
		unique("sharedCharts_token_unique").on(table.token),
	]);

export const socialAccounts = mysqlTable("socialAccounts", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	platform: mysqlEnum(['facebook', 'instagram', 'linkedin', 'pinterest']).notNull(),
	accountId: varchar({ length: 128 }).notNull(),
	accountName: varchar({ length: 255 }).notNull(),
	accountHandle: varchar({ length: 128 }),
	accountAvatar: text(),
	accessToken: text().notNull(),
	refreshToken: text(),
	tokenExpiresAt: timestamp({ mode: 'string' }),
	pageId: varchar({ length: 128 }),
	pageName: varchar({ length: 255 }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "socialAccounts_id" }),
	]);

export const socialPostAccounts = mysqlTable("socialPostAccounts", {
	id: int().autoincrement().notNull(),
	postId: int().notNull(),
	accountId: int().notNull(),
	status: mysqlEnum(['pending', 'published', 'failed']).default('pending').notNull(),
	platformPostId: varchar({ length: 255 }),
	errorMessage: text(),
	publishedAt: timestamp({ mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "socialPostAccounts_id" }),
	]);

export const socialPosts = mysqlTable("socialPosts", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }),
	caption: text().notNull(),
	imageUrl: text(),
	imagePrompt: text(),
	postType: mysqlEnum(['hd_type', 'quote', 'infographic', 'transit', 'iching', 'promo', 'custom']).default('custom').notNull(),
	locale: mysqlEnum(['cs', 'en']).default('cs').notNull(),
	hashtags: text(),
	scheduledAt: timestamp({ mode: 'string' }),
	publishedAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['draft', 'scheduled', 'publishing', 'published', 'failed']).default('draft').notNull(),
	errorMessage: text(),
	platforms: json().notNull(),
	platformPostIds: json(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "socialPosts_id" }),
	]);

export const userNotifications = mysqlTable("user_notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	type: mysqlEnum(['crm_status', 'campaign', 'system', 'credit', 'achievement']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	data: json(),
	isRead: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "user_notifications_id" }),
	]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user', 'admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	stripeCustomerId: varchar({ length: 64 }),
	stripeSubscriptionId: varchar({ length: 64 }),
	subscriptionStatus: mysqlEnum(['active', 'canceled', 'past_due', 'trialing', 'none']).default('none').notNull(),
	subscriptionPlan: mysqlEnum(['monthly', 'annual', 'none']).default('none').notNull(),
	subscriptionCurrentPeriodEnd: timestamp({ mode: 'string' }),
	aiReadingCredits: int().default(0).notNull(),
	referralCode: varchar({ length: 16 }),
	currentStreak: int().default(0).notNull(),
	longestStreak: int().default(0).notNull(),
	lastLoginDate: varchar({ length: 10 }),
	lastDailyRewardAt: timestamp({ mode: 'string' }),
	level: mysqlEnum(['searcher', 'awakened', 'initiated', 'guide', 'master']).default('searcher').notNull(),
	totalCreditsEarned: int().default(0).notNull(),
	isAffiliate: tinyint().default(0).notNull(),
	affiliateCode: varchar({ length: 16 }),
	affiliateTier: mysqlEnum(['bronze', 'silver', 'gold']).default('bronze').notNull(),
	affiliateTotalEarned: float().notNull(),
	affiliatePendingPayout: float().notNull(),
	crmStatus: varchar("crm_status", { length: 32 }),
	crmNote: text("crm_note"),
	crmUpdatedAt: bigint("crm_updated_at", { mode: "number" }),
	notificationPrefs: json("notification_prefs"),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "users_id" }),
		unique("users_openId_unique").on(table.openId),
		unique("users_referralCode_unique").on(table.referralCode),
		unique("users_affiliateCode_unique").on(table.affiliateCode),
	]);
