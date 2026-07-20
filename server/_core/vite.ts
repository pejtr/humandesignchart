import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      if (url.startsWith("/shared/") || url.startsWith("/en/shared/") || url.startsWith("/cs/shared/")) {
        const parts = url.split("/");
        const token = parts[parts.length - 1]; // last part is token
        if (token && token.length > 5) {
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          const ogHtml = `
            <meta property="og:image" content="${baseUrl}/api/og/shared/${token}" />
            <meta property="og:title" content="Human Design Rozbor" />
            <meta property="og:description" content="Podívejte se na moji detailní Human Design mapu." />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Human Design Rozbor" />
            <meta name="twitter:image" content="${baseUrl}/api/og/shared/${token}" />
          `;
          template = template.replace(/<head>/i, `<head>\n${ogHtml}`);
        }
      }

      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // Vite's hashed assets are immutable and should not be revalidated on every visit.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res) => {
    try {
      let template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");

      const url = req.originalUrl;
      if (url.startsWith("/shared/") || url.startsWith("/en/shared/") || url.startsWith("/cs/shared/")) {
        const parts = url.split("/");
        const token = parts[parts.length - 1];
        if (token && token.length > 5) {
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          const ogHtml = `
            <meta property="og:image" content="${baseUrl}/api/og/shared/${token}" />
            <meta property="og:title" content="Human Design Rozbor" />
            <meta property="og:description" content="Podívejte se na moji detailní Human Design mapu." />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Human Design Rozbor" />
            <meta name="twitter:image" content="${baseUrl}/api/og/shared/${token}" />
          `;
          template = template.replace(/<head>/i, `<head>\n${ogHtml}`);
        }
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.error("Error serving index.html:", e);
      res.status(500).send("Internal Server Error");
    }
  });
}
