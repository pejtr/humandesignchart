export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
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
