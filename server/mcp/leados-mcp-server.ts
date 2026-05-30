/**
 * MCP Server — HDM ↔ LeadOS Bridge
 *
 * Exposes HDM data as MCP tools so LeadOS (or any MCP-compatible AI agent)
 * can call them directly via stdio transport.
 *
 * Usage:
 *   npx ts-node server/mcp/leados-mcp-server.ts
 *   or compile and run: node dist/mcp/leados-mcp-server.js
 *
 * Tools exposed:
 *   - get_hdm_stats       → HDM app statistics (users, subscriptions, revenue)
 *   - get_hdm_leads       → New HDM users as CRM leads
 *   - sync_lead_status    → Update CRM status of a user in HDM DB
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return mysql.createConnection(url);
}

// ─── MCP Server setup ─────────────────────────────────────────────────────────

const server = new Server(
  { name: "hdm-leados-bridge", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ─── tools/list ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_hdm_stats",
      description:
        "Vrátí statistiky HDM aplikace: počet uživatelů, aktivní předplatné, příjmy. / Returns HDM app statistics: user count, active subscriptions, revenue.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "get_hdm_leads",
      description:
        "Vrátí seznam nových HDM uživatelů jako potenciální leady pro LeadOS CRM. / Returns new HDM users as potential leads for LeadOS CRM.",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number",
            description: "Max počet leadů (default 50) / Max number of leads (default 50)",
          },
          since: {
            type: "string",
            description:
              "ISO datum od kdy (default posledních 7 dní) / ISO date from (default last 7 days)",
          },
        },
        required: [],
      },
    },
    {
      name: "sync_lead_status",
      description:
        "Aktualizuje CRM status uživatele v HDM databázi. / Updates the CRM status of a user in the HDM database.",
      inputSchema: {
        type: "object" as const,
        properties: {
          userId: { type: "number", description: "HDM user ID" },
          crmStatus: {
            type: "string",
            enum: ["new", "contacted", "interested", "converted"],
            description: "CRM pipeline status",
          },
          note: {
            type: "string",
            description: "Optional CRM note / Volitelná poznámka",
          },
        },
        required: ["userId", "crmStatus"],
      },
    },
  ],
}));

// ─── tools/call ───────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_hdm_stats") {
      const conn = await getConnection();
      try {
        const [[userRow]] = await conn.execute<any[]>(
          "SELECT COUNT(*) AS total FROM users"
        );
        const [[subRow]] = await conn.execute<any[]>(
          "SELECT COUNT(*) AS active FROM users WHERE subscriptionStatus = 'active'"
        );
        const [[chartRow]] = await conn.execute<any[]>(
          "SELECT COUNT(*) AS total FROM charts"
        );
        const [[readingRow]] = await conn.execute<any[]>(
          "SELECT COUNT(*) AS total FROM aiReadings"
        );

        const stats = {
          totalUsers: userRow.total,
          activeSubscriptions: subRow.active,
          totalCharts: chartRow.total,
          totalAiReadings: readingRow.total,
          timestamp: new Date().toISOString(),
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }],
        };
      } finally {
        await conn.end();
      }
    }

    if (name === "get_hdm_leads") {
      const limit = (args?.limit as number) ?? 50;
      const since = args?.since
        ? new Date(args.since as string)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const conn = await getConnection();
      try {
        const [rows] = await conn.execute<any[]>(
          `SELECT id, name, email, subscriptionStatus, subscriptionPlan,
                  aiReadingCredits, crmStatus, createdAt, lastSignedIn
           FROM users
           WHERE createdAt >= ?
           ORDER BY createdAt DESC
           LIMIT ?`,
          [since, limit]
        );

        const leads = rows.map((u: any) => ({
          userId: u.id,
          name: u.name,
          email: u.email,
          subscriptionStatus: u.subscriptionStatus,
          subscriptionPlan: u.subscriptionPlan,
          aiCredits: u.aiReadingCredits,
          crmStatus: u.crmStatus ?? "new",
          registeredAt: u.createdAt,
          lastSeen: u.lastSignedIn,
          score: u.subscriptionStatus === "active" ? 100 : u.aiReadingCredits > 0 ? 65 : 45,
          tags: [
            "hdm",
            u.subscriptionStatus === "active" ? "premium_user" : "free_user",
          ],
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ leads, total: leads.length, since: since.toISOString() }, null, 2),
            },
          ],
        };
      } finally {
        await conn.end();
      }
    }

    if (name === "sync_lead_status") {
      const userId = args?.userId as number;
      const crmStatus = args?.crmStatus as string;
      const note = (args?.note as string) ?? null;

      if (!userId || !crmStatus) {
        return {
          content: [{ type: "text" as const, text: "Error: userId and crmStatus are required" }],
          isError: true,
        };
      }

      const conn = await getConnection();
      try {
        await conn.execute(
          "UPDATE users SET crm_status = ?, crm_note = ?, crm_updated_at = ? WHERE id = ?",
          [crmStatus, note, Date.now(), userId]
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                userId,
                crmStatus,
                note,
                updatedAt: new Date().toISOString(),
              }),
            },
          ],
        };
      } finally {
        await conn.end();
      }
    }

    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[HDM MCP] LeadOS bridge server running on stdio");
}

main().catch((err) => {
  console.error("[HDM MCP] Fatal error:", err);
  process.exit(1);
});
