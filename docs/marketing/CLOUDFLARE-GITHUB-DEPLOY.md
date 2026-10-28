# Human Design — GitHub → Cloudflare Pages (safe CI/CD)

## Why GitHub Actions, not native Git integration?
The existing Cloudflare Pages project `humandesignchart-web` is a **Direct Upload** project.
Cloudflare API rejects changing its `source` to GitHub with HTTP 400, code `8000069`
(`You cannot update the source object in a Direct Uploads project`).
Keep this project and its bindings/custom domains unchanged. Do not create a
second production project or try to rebind the domains.

Instead, `.github/workflows/hd-pages-cicd.yml` builds the existing repository
and uploads `dist/public` using `cloudflare/wrangler-action@v4`.

## GitHub repository configuration
Public GitHub **Actions variables** (configured):
- `CLOUDFLARE_ACCOUNT_ID`: identifies the Cloudflare account.
- `HD_OPENAI_ADS_PIXEL_ID`: public frontend pixel identifier, passed during Vite build.
- `HD_PAGES_DEPLOY_ENABLED`: initially `false` (safety gate).

GitHub **Actions secret** (required, not stored in git):
- `CLOUDFLARE_API_TOKEN`: dedicated scoped Cloudflare token with **Account →
  Cloudflare Pages → Edit**, restricted to the correct account. Obtain at
  Cloudflare Dashboard → My Profile → API Tokens → Create Token. Store
  via GitHub → Repository Settings → Secrets and variables → Actions →
  New repository secret. Never paste it into a PR, issue, chat, build log,
  `.env`, or a public `VITE_*` variable.

The existing Cloudflare **Production secrets** remain in Cloudflare; they
are not copied to GitHub. Examples: `OPENAI_CONVERSIONS_API_KEY`,
`OPENROUTER_API_KEY`, `BREVO_API_KEY`,
`PAYGATE_CHECKOUT_API_KEY_HUMAN_DESIGN`.
GitHub's CI build must not request these server-only secrets.

## Safe workflow
1. Push/merge to `main`: install dependencies, check TypeScript,
   run Vitest, build Cloudflare Worker + static assets and upload artifact.
   **No production deployment** while `HD_PAGES_DEPLOY_ENABLED=false`.
2. GitHub Actions → *Human Design | Cloudflare Pages (guarded)* →
   Run workflow → `target=preview`. This deploys to a **preview branch**
   `hd-ci-preview`, not to production.
3. Smoke test pages and the real payment/backend interface, including
   correct Cloudflare D1 bindings, fulfillments and callbacks. A static
   HTTP 200 is not a purchase E2E.
4. Only after review: manually Run workflow → `target=production`.
   Once the entire revenue gate passes, the repo variable
   `HD_PAGES_DEPLOY_ENABLED=true` may enable automatic production
   deployment on eligible `main` pushes.
5. Rollback: use Cloudflare Pages project → Deployments → previous good
   production deployment and select rollback. The last known pre-CI
   production deployment ID at setup was
   `64872600-6449-4b50-a56b-2e9fa5e9c368`, commit
   `9585b2f6f8c0c9c5b5ea8023996285fe464c2b16`.
   Re-check actual current deployment before any rollback.

## Migration model
Commit only source, manifests, build workflow, and **names** of secrets.
When migrating hosting or accounts, provision **new scoped credentials**
in the destination secret store rather than copying secrets through Git.
Audit the existing backend separately: `server/openaiConversionsApi.ts`
uses `process.env`; Cloudflare Pages `workers/pages-api.ts` accesses
`env` bindings. Presence of the conversion API secret in Pages does
not prove that server-confirmed purchases reach OpenAI Ads.
