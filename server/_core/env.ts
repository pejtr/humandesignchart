export const ENV = {
  // Stable identifier embedded in session tokens. Must be non-empty so that
  // verifySession accepts the cookie; the exact value is not security-sensitive.
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "humandesignmapa",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Payment providers. Secrets are configured in Railway, never in source control.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeEnablePaypal: process.env.STRIPE_ENABLE_PAYPAL === "true",
  comgateMerchantId: process.env.COMGATE_MERCHANT_ID ?? "",
  comgateSecret: process.env.COMGATE_SECRET ?? "",
  comgateTestMode: process.env.COMGATE_TEST_MODE !== "false", // Default to true for safety
  // ─── Google OAuth (sign-in) ──────────────────────────────────────────
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // ─── Google Ads API (read-only reporting; admin-only) ────────────────
  googleAdsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
  googleAdsClientId: process.env.GOOGLE_ADS_CLIENT_ID ?? "",
  googleAdsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "",
  googleAdsRefreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN ?? "",
  googleAdsCustomerId: process.env.GOOGLE_ADS_CUSTOMER_ID ?? "",
  googleAdsLoginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? "",
  googleAdsApiVersion: process.env.GOOGLE_ADS_API_VERSION ?? "v18",
  // ─── LLM: Google Gemini via OpenAI-compatible endpoint ───────────────
  // Set GEMINI_API_KEY in the deploy environment. Override base URL/model
  // with LLM_BASE_URL / LLM_MODEL to use any other OpenAI-compatible provider.
  llmBaseUrl:
    process.env.LLM_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai",
  llmApiKey: process.env.GEMINI_API_KEY ?? process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",
  // Legacy object-storage proxy (used only by owner-side social image tooling)
  forgeApiUrl: process.env.STORAGE_API_URL ?? "",
  forgeApiKey: process.env.STORAGE_API_KEY ?? "",
  leadosApiKey: process.env.LEADOS_API_KEY ?? "",
  leadosWebhookSecret: process.env.LEADOS_WEBHOOK_SECRET ?? "",
};
