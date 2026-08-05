import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { buildSeoHead } from "./seoMeta";

/** Extract locale from URL path, or return "cs" as default. */
function extractLocale(url: string): string {
  const seg = url.split("/").filter(Boolean)[0];
  return seg === "en" ? "en" : "cs";
}

/** Should we inject SEO meta tags for this URL? */
function shouldInjectSeo(url: string): boolean {
  if (url.startsWith("/api/")) return false;
  if (url.startsWith("/assets/")) return false;
  if (url.startsWith("/shared/")) return false;
  if (url.startsWith("/embed/")) return false;
  if (url === "/sitemap.xml" || url === "/robots.txt" || url === "/rss.xml") return false;
  if (url === "/favicon.svg" || url === "/favicon.ico" || url === "/manifest.json") return false;
  if (url.startsWith("/images/")) return false;
  if (url.startsWith("/sw.js")) return false;
  return true;
}

/** Inject route-specific SEO meta tags into the HTML template. */
function injectSeo(template: string, url: string): string {
  if (!template.includes("<!--SEO_META-->")) return template;
  if (!shouldInjectSeo(url)) return template;

  const locale = extractLocale(url);
  const seoHead = buildSeoHead(locale, url);
  if (!seoHead) return template;

  return template.replace("<!--SEO_META-->", seoHead);
}

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
          template = template.replace("<!--SEO_META-->", ogHtml);
        }
      } else {
        // Inject route-specific SEO meta tags
        template = injectSeo(template, url);
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
      } else if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));

  // Missing versioned assets must be a real 404. Returning the SPA HTML here
  // makes browsers try to parse index.html as JavaScript after a deployment.
  app.use("/assets", (_req, res) => {
    res
      .status(404)
      .set({
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      })
      .send("Asset not found");
  });

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
          template = template.replace("<!--SEO_META-->", ogHtml);
        }
      } else {
        // Inject route-specific SEO meta tags
        template = injectSeo(template, url);
      }

      res
        .status(200)
        .set({
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        })
        .end(template);
    } catch (e) {
      console.error("Error serving index.html:", e);
      res.status(500).send("Internal Server Error");
    }
  });
}
