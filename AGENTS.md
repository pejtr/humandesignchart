# AGENTS.md

## 🔧 Local Setup
- `pnpm install` → installs all dependencies
- `pnpm dev` → starts dev server at http://localhost:3000 (Node.js + React 19 + Tailwind 4)

## 🗄️ Database
- Migrations: `pnpm db:push` (run after schema changes in `drizzle/schema.ts`)
- Test database: `pnpm test` (202 tests passing; use `pnpm test -- <file>` or `--grep "<pattern>"` for focused runs)

## 🚀 Production
- Build: `pnpm build` → outputs to `dist/`
- Start: `pnpm start` (production mode, serves `dist/index.js`)
- Deploy: Make changes → run tests → create checkpoint in Manus UI → click **Publish** (changes live in ~2 minutes)

## ⚙️ Environment Variables
- **Required (auto-injected by Manus):**  
  `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_KEY`
- **Optional (Stripe/LeadOS):**  
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LEADOS_API_KEY`, `LEADOS_WEBHOOK_SECRET`

## 📂 Project Structure
- `client/`: React 19 + Tailwind 4 + shadcn/ui components (pages, components, hooks)
- `server/`: Express 4 + tRPC 11 + Drizzle ORM (routers, db helpers, security)
- `drizzle/`: `schema.ts` (core tables: users, charts, aiReadings), `migrations/` (auto-generated)
- `shared/`: HD data (`hdContent.ts`), blog articles, notification types

## 🛠️ Key Commands
- `pnpm check` → TypeScript typecheck (`tsc --noEmit`)
- `pnpm format` → Prettier formatting (`prettier --write .`)
- `pnpm db:push` → Generate + migrate DB schema (requires `drizzle-kit`)
- `pnpm test -- --grep "gamification"` → Run tests matching "gamification" in file names

## 📌 Critical Notes
- **Monorepo structure:** `client/` (frontend) and `server/` (backend) share root `package.json`
- **Deployment safety:** Database schema changes require `pnpm db:push`; data persists through rollbacks (`webdev_rollback_checkpoint`)
- **Testing priority:** Always run `pnpm test` before committing; 0 TypeScript errors required
- **Environment loading:** Manus auto-injects required env vars; verify via `pnpm run check` if issues arise

(End of file - 15 lines)