import type { Express } from "express";
import { getChartById } from "../../db";
import type { HumanDesignChartData } from "@shared/types";

export function registerPassRoutes(app: Express) {
  // ─── Digital HD Wallet Pass Image Endpoint ─────────────────────────────
  app.get("/api/pass/:chartId", async (req, res) => {
    try {
      const chartId = parseInt(req.params.chartId, 10);
      if (isNaN(chartId)) {
        res.status(400).send("Invalid chart ID");
        return;
      }

      const chart = await getChartById(chartId);
      if (!chart) {
        res.status(404).send("Chart not found");
        return;
      }

      const chartData = chart.chartData as unknown as HumanDesignChartData;
      const name = chart.name || "Human Design Card";
      const type = chartData?.type || "Generator";
      const profile = chartData?.profile || "1/3";
      const authority = chartData?.authority || "Emotional";
      const cross = chartData?.incarnationCross?.name || "Right Angle Cross";

      // Render high-resolution Wallet Pass Card SVG
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="960" viewBox="0 0 600 960">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f0926" />
              <stop offset="50%" stop-color="#1e1040" />
              <stop offset="100%" stop-color="#2a0845" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#f59e0b" />
              <stop offset="50%" stop-color="#fbbf24" />
              <stop offset="100%" stop-color="#d97706" />
            </linearGradient>
          </defs>

          <!-- Outer Card Container -->
          <rect width="600" height="960" rx="36" fill="url(#bgGrad)" />
          <rect x="12" y="12" width="576" height="936" rx="28" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-opacity="0.4" />

          <!-- Header Logo & Brand -->
          <text x="300" y="70" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#fbbf24" letter-spacing="4">HUMAN DESIGN MAPA</text>
          <text x="300" y="90" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#9ca3af" letter-spacing="2">OFFICIAL ENERGETIC PASS</text>

          <!-- Divider -->
          <line x1="60" y1="120" x2="540" y2="120" stroke="#fbbf24" stroke-width="1" stroke-opacity="0.2" />

          <!-- Sacred Geometry Center Motif -->
          <circle cx="300" cy="270" r="110" fill="none" stroke="#8b5cf6" stroke-width="1" stroke-opacity="0.25" />
          <circle cx="300" cy="270" r="85" fill="none" stroke="#f59e0b" stroke-width="1" stroke-opacity="0.25" />
          <circle cx="300" cy="270" r="60" fill="#8b5cf6" fill-opacity="0.1" stroke="#ec4899" stroke-width="1" stroke-opacity="0.3" />

          <!-- User Name -->
          <text x="300" y="430" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="bold" fill="#ffffff">${escapeXml(name)}</text>

          <!-- Type Badge -->
          <rect x="150" y="460" width="300" height="44" rx="22" fill="#8b5cf6" fill-opacity="0.2" stroke="#8b5cf6" stroke-width="1.5" />
          <text x="300" y="488" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#a78bfa">${escapeXml(type)}</text>

          <!-- Details Grid -->
          <!-- Row 1: Profile & Authority -->
          <rect x="60" y="540" width="225" height="100" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08" />
          <text x="80" y="570" font-family="sans-serif" font-size="11" font-weight="600" fill="#9ca3af" letter-spacing="1">PROFIL</text>
          <text x="80" y="605" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${escapeXml(profile)}</text>

          <rect x="315" y="540" width="225" height="100" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08" />
          <text x="335" y="570" font-family="sans-serif" font-size="11" font-weight="600" fill="#9ca3af" letter-spacing="1">AUTORITA</text>
          <text x="335" y="605" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">${escapeXml(authority)}</text>

          <!-- Row 2: Incarnation Cross -->
          <rect x="60" y="660" width="480" height="90" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08" />
          <text x="80" y="690" font-family="sans-serif" font-size="11" font-weight="600" fill="#9ca3af" letter-spacing="1">INKARNAČNÍ KŘÍŽ</text>
          <text x="80" y="725" font-family="sans-serif" font-size="16" font-weight="bold" fill="#fbbf24">${escapeXml(cross)}</text>

          <!-- Footer Verification -->
          <rect x="60" y="780" width="480" height="120" rx="20" fill="#000000" fill-opacity="0.3" stroke="#8b5cf6" stroke-opacity="0.2" />
          <text x="300" y="825" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">VERIFIED DIGITAL ENERGETIC BLUEPRINT</text>
          <text x="300" y="850" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#34d399">✓ ACTIVE HD PASS</text>
          <text x="300" y="875" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#6b7280">https://www.humandesignmapa.cz</text>
        </svg>
      `;

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(svg);
    } catch (err) {
      console.error("[HD Pass] Error generating pass:", err);
      res.status(500).send("Internal Server Error");
    }
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
