import os

file_path = "server/_core/index.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import
if 'import { handleComgateWebhook }' not in content:
    content = content.replace(
        'import { registerLeadOSWebhook } from "../leadosWebhook";',
        'import { registerLeadOSWebhook } from "../leadosWebhook";\nimport { handleComgateWebhook } from "../comgateWebhook";'
    )

# 2. Add express webhook
if 'app.post("/api/comgate/webhook"' not in content:
    content = content.replace(
        '  // Configure body parser with larger size limit for file uploads\n  app.use(express.json({ limit: "50mb" }));',
        """  // ─── Comgate Webhook ───────────────────────────────────────────────────
  // Comgate sends data via application/x-www-form-urlencoded
  app.post("/api/comgate/webhook", express.urlencoded({ extended: true, limit: "1mb" }), async (req, res, next) => {
    try {
      await handleComgateWebhook(req, res);
    } catch (err) {
      next(err);
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));"""
    )
elif 'app.post("/api/comgate/webhook"' in content:
    pass # Already contains it

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Injections complete")
