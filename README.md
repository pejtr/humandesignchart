# Human Design App — Production & Development Guide

**Status:** Production live on Manus (humandesignchart.app, humandesignmapa.cz) | Development transitioning to Claude Code

---

## 🎯 Project Overview

Full-stack Human Design chart calculator & AI interpretation platform built with **React 19 + tRPC + Drizzle ORM + Manus OAuth**. Features include:

- **Chart Calculation:** Astronomia ephemeris integration, gate/line/color/tone/base calculations, type/profile/authority determination
- **Interactive Bodygraph:** SVG visualization with 64 gates, 36 channels, 9 centers, personality/design activation coloring
- **AI Interpretations:** 9 reading types (type, strategy, profile, gates, channels, life purpose, career, variables, relationships)
- **Premium Features:** Transit overlays, composite charts, return charts, incarnation cross analysis, daily transits, social scheduler
- **Gamification:** Streak rewards, daily credits, affiliate program (Bronze/Silver/Gold tiers), referral system
- **Monetization:** Stripe payments (88 CZK/month), free tier (5 AI readings), premium tier (unlimited)
- **Multi-language:** Czech (humandesignmapa.cz) + English (humandesignchart.app)
- **CRM Integration:** LeadOS webhook sync, real-time notifications, admin dashboard

---

## 🚀 Production Environment

### Deployment
- **Platform:** Manus (managed Node.js hosting)
- **Domains:** 
  - humandesignmapa.cz (Czech primary)
  - humandesignchart.app (English primary)
  - human-design.manus.space (fallback)
  - humandesign-sjuumjjf.manus.space (auto-generated)
- **Database:** MySQL/TiDB (managed)
- **Storage:** S3 (webdev static assets)
- **Auth:** Manus OAuth (built-in)

### Current Version
Latest checkpoint: `dc049ecc` — Navbar left-aligned, sidebar icons centered when collapsed

### Recent Changes (June 2026)
- ✅ Free AI readings: 1 → **5** (all UI updated)
- ✅ Premium features: Added "Denní & týdenní tranzity na email"
- ✅ Navbar: Content left-aligned (removed center justify)
- ✅ Sidebar: Icons centered when collapsed (icon-only mode)
- ✅ Database: Expanded celebrity database
- ✅ Stripe: Test sandbox created (awaiting user claim)

---

## 📋 Development Workflow

### Setup (Local Development)
```bash
cd /home/ubuntu/humandesign-app
pnpm install
pnpm dev
```

Dev server runs on `http://localhost:3000`

### Database Migrations
```bash
# After schema changes in drizzle/schema.ts
pnpm db:push
```

### Running Tests
```bash
pnpm test
# Current: 202 tests passing
```

### Building for Production
```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
client/
  public/              ← Static assets (robots.txt, sitemap.xml)
  src/
    pages/             ← Feature pages (ChartResult, Dashboard, etc.)
    components/        ← Reusable UI (Navbar, AuthSidebar, DashboardLayout, etc.)
    hooks/             ← Custom hooks (useAuth, useSEO, useNotifications, etc.)
    contexts/          ← React contexts (LanguageContext, ThemeContext)
    lib/               ← tRPC client, utilities
    App.tsx            ← Routes & layout
    main.tsx           ← Providers setup
    index.css          ← Global styles (Tailwind 4, CSS variables, mystical theme)

server/
  routers.ts           ← All tRPC procedures (public + protected)
  db.ts                ← Database query helpers
  routers/             ← Feature-specific routers (leados.ts, etc.)
  _core/               ← Framework (OAuth, context, LLM, storage, etc.)
  security/            ← Prompt sanitizer, rate limiter
  stripeWebhook.ts     ← Stripe event handler
  leadosWebhook.ts     ← LeadOS CRM event handler
  notificationBroadcast.ts ← SSE broadcaster

drizzle/
  schema.ts            ← Database tables (users, charts, aiReadings, etc.)
  migrations/          ← Auto-generated migration files

shared/
  hdContent.ts         ← HD data (types, profiles, authorities, gates, channels, centers)
  blogArticles.ts      ← Blog content (CS)
  blogArticlesEn.ts    ← Blog content (EN)
  notificationTypes.ts ← Notification type definitions

storage/
  index.ts             ← S3 helpers (storagePut, storageGet)

todo.md              ← Feature tracking (110 items, many completed)
```

---

## 🔑 Key Features Implementation

### Chart Calculation
- **File:** `server/db.ts` (calculateChart function)
- **Engine:** Astronomia.js ephemeris + custom gate mapping
- **Verified against:** Ra Uru Hu, Albert Einstein charts

### AI Interpretations (Streaming)
- **File:** `server/routers.ts` (askGuide, getAiReading procedures)
- **Method:** SSE streaming with token-by-token output
- **Sanitization:** Prompt injection prevention in `server/security/promptSanitizer.ts`
- **Rate Limiting:** Max 30 calls/hour/user

### Premium Subscription
- **File:** `server/stripeWebhook.ts`
- **Model:** Monthly (88 CZK) or annual (888 CZK)
- **Free Tier:** 5 AI readings, basic features
- **Premium:** Unlimited readings, transits, composite charts, social scheduler
- **Affiliate:** 20–25% commission per tier

### Gamification
- **Daily Streak:** Check-in reward (0.1 credit)
- **Affiliate Program:** Bronze (20%), Silver (22%), Gold (25%)
- **Referral:** 1 credit per referred user who registers
- **Files:** `server/routers.ts` (gamification.*, affiliate.* procedures)

### Real-time Notifications
- **Transport:** SSE (EventSource) + in-memory broadcaster
- **Triggers:** LeadOS CRM events, new campaigns, subscription updates
- **File:** `server/notificationBroadcast.ts`
- **UI:** NotificationBell component with dropdown panel

### Multi-language
- **Routing:** `/cs/` and `/en/` subpath prefixes
- **i18n:** LanguageContext + locale detection
- **Files:** `client/src/contexts/LanguageContext.tsx`, `shared/blogArticles*.ts`

---

## 🛠 Environment Variables

### Required (Auto-injected by Manus)
```
DATABASE_URL              # MySQL/TiDB connection
JWT_SECRET                # Session signing key
VITE_APP_ID               # Manus OAuth app ID
OAUTH_SERVER_URL          # Manus OAuth backend
VITE_OAUTH_PORTAL_URL     # Manus login portal
OWNER_OPEN_ID, OWNER_NAME # Owner identity
BUILT_IN_FORGE_API_URL    # Manus built-in APIs
BUILT_IN_FORGE_API_KEY    # Bearer token (server-side)
VITE_FRONTEND_FORGE_API_KEY # Bearer token (frontend)
```

### Optional (Stripe, LeadOS, etc.)
```
STRIPE_SECRET_KEY         # Stripe API key
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing secret
LEADOS_API_KEY            # LeadOS CRM API key
LEADOS_WEBHOOK_SECRET     # LeadOS webhook signing secret
```

---

## 🧪 Testing

### Test Coverage
- **Unit:** Chart calculation, auth, gamification, affiliate tiers
- **Integration:** Stripe webhook, LeadOS webhook, tRPC procedures
- **E2E:** Share links, blog SEO, notification system

### Running Specific Tests
```bash
pnpm test -- server/auth.logout.test.ts
pnpm test -- --grep "gamification"
```

### Current Stats
- **202 tests passing** (all green)
- **0 TypeScript errors**
- **Key areas:** Calculations, auth, payments, CRM, notifications

---

## 📊 Database Schema

### Core Tables
- **users** — OAuth identity, subscription, gamification stats, CRM sync
- **charts** — Saved birth data, calculated chart, roleTag (relationship type)
- **aiReadings** — Streaming AI interpretations, ratings, type
- **sharedCharts** — Public share tokens, expiration
- **celebrities** — Pre-calculated celebrity charts (20+ entries)
- **affiliateConversions** — Affiliate commission tracking
- **creditTransactions** — Audit log for credit changes
- **userNotifications** — Real-time notification queue
- **chatConversations** — AI Guide persistent chat history
- **chatMessages** — Individual messages per conversation

### Recent Migrations
- 0010: roleTag enum (partner/spouse/boss/friend/client/etc.)
- 0011: CRM sync fields (crmStatus, crmNote, crmUpdatedAt)
- 0012: Notification system (user_notifications table)

---

## 🎨 Design System

### Theme
- **Default:** Light mode (white/purple cosmic)
- **Dark Mode:** Switchable (localStorage persisted)
- **Colors:** OKLCH format (CSS variables in `index.css`)
- **Typography:** Inter (sans) + Cormorant Garamond (serif)
- **Radius:** 0.625rem (customizable via CSS vars)

### Components
- **Pre-built:** DashboardLayout, AIChatBox, Map (Google Maps proxy), Navbar, AuthSidebar
- **shadcn/ui:** Button, Card, Dialog, Dropdown, Tooltip, etc.
- **Animations:** Framer Motion, Tailwind transitions, CSS keyframes

---

## 🚨 Known Issues & TODOs

### In Progress (Claude Code)
- [ ] HD Guru profile selector (dropdown to switch between saved charts)
- [ ] Persistent chat history (DB storage + load on mount)
- [ ] Notification preferences (user control per notification type)
- [ ] Prompt injection prevention (rate limiter + sanitizer) ✅ **Done**
- [ ] Gene Keys reference integration
- [ ] Dream Rave chart calculation

### Completed Recently
- ✅ Navbar left-alignment (June 3)
- ✅ Sidebar icon centering (June 3)
- ✅ Free readings: 5 (June 3)
- ✅ Premium transits email feature (June 3)
- ✅ Stripe sandbox setup (May 7)
- ✅ LeadOS CRM full integration (May 30)
- ✅ Real-time notifications (May 31)
- ✅ CRM Dashboard with D3 force graph (May 31)
- ✅ Role compatibility analysis (May 30)
- ✅ Prompt injection prevention (June 3)

---

## 📱 Mobile & Responsive

- **Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Mobile Nav:** Hamburger menu (Navbar) + bottom navigation (MobileBottomNav)
- **Sidebar:** Hidden on mobile, 56px collapsed / 200px expanded on lg+
- **Bodygraph:** Responsive SVG scaling
- **Forms:** Full-width on mobile, constrained on desktop

---

## 🔐 Security

### Authentication
- Manus OAuth (built-in, no manual setup)
- Session cookies (JWT signed with JWT_SECRET)
- Protected procedures via `protectedProcedure`
- Admin-only access via `ctx.user.role === 'admin'`

### Input Validation
- Zod schemas on all tRPC inputs
- Prompt injection sanitization (stripInjectionPatterns, max length)
- Rate limiting (30 LLM calls/hour/user)
- Webhook signature verification (HMAC-SHA256 for Stripe + LeadOS)

### Data Protection
- S3 file storage (non-enumerable paths with random suffixes)
- Database encryption at rest (managed by Manus)
- GDPR cookie consent banner

---

## 🚀 Deployment & Publishing

### Current Status
- **Production:** Live on humandesignchart.app + humandesignmapa.cz
- **Hosting:** Manus managed (click Publish button in UI)
- **CI/CD:** Git sync (user_github remote)

### Publishing Workflow
1. Make changes locally (or in Claude Code)
2. Run tests: `pnpm test`
3. Create checkpoint via Manus UI (or `webdev_save_checkpoint` in Manus agent)
4. Click **Publish** button in Management UI
5. Changes live in ~2 minutes

### Rollback
- Use `webdev_rollback_checkpoint` to restore previous version
- Database data is NOT rolled back (schema-only)

---

## 📞 Support & Contacts

### For Manus Platform Issues
→ https://help.manus.im

### For Business Logic / Feature Requests
→ Contact project owner (PejtrView)

### For Development (Claude Code)
- Read this README first
- Check todo.md for current tasks
- Run `pnpm test` before committing
- Ensure TypeScript has 0 errors

---

## 📚 References

- **HD Theory:** Ra Uru Hu, humandesign.cz
- **Calculations:** Astronomia.js, ephemeris data
- **Frontend:** React 19, Tailwind 4, shadcn/ui
- **Backend:** Express 4, tRPC 11, Drizzle ORM
- **Payments:** Stripe API
- **CRM:** LeadOS webhook integration
- **Hosting:** Manus (Node.js managed platform)

---

**Last Updated:** June 3, 2026 | **Version:** dc049ecc | **Status:** Production Live ✅
