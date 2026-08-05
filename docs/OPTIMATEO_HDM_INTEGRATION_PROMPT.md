# Prompt pro vlákno OPTIMATEO: propojení s Human Design Mapa

Zkopíruj do vlákna OPTIMATEO následující prompt:

```text
Pracuj v repozitáři E:\!CLAUDECODE\OPTIVIO a dodrž tamní AGENTS.md. Nejdřív proveď read-only audit aktuální větve, worktree a existujících API/tRPC route. Nic neslučuj přímo do main; vytvoř feature branch a PR.

Cíl: z www.optimateo.com udělat kanonický přijímací CRM/analytics hub pro Human Design Mapu. Human Design klient je v E:\Projects\humandesignchart a je nově připraven na tento kontrakt:

1. Bearer API pod https://www.optimateo.com/api/external:
   GET /analytics
   GET /leads?status=&limit=&offset=
   GET /leads/:id
   PUT /leads/:id
   GET /email-sequences
   GET /orders?limit=&offset=
   POST /events

2. Univerzální ingest:
   POST https://www.optimateo.com/api/ingest
   header x-project-key: proj_hdm
   JSON: { eventType, visitorId, sessionId, pageUrl, path, referrer, deviceType, utmSource, utmMedium, utmCampaign, metadata }

3. Zpětný webhook do Human Design:
   POST https://www.humandesignmapa.cz/api/optimateo/webhook
   header x-optimateo-signature: sha256=<HMAC_SHA256(rawBody, OPTIMATEO_WEBHOOK_SECRET)>
   eventy: new_lead, lead_status_changed, new_order, quiz_completed, new_campaign

4. Autentizace a bezpečnost:
   OPTIMATEO_API_KEY jako Bearer token, konstantní čas porovnání klíče, rate limit, Zod validace, audit log bez PII/secrets, CORS pouze tam, kde je nutný pro /api/ingest.
   OPTIMATEO_WEBHOOK_SECRET nikdy neposílat do browseru ani commitovat.
   /api/external není stejné jako existující chráněné tRPC leados.*; vytvoř adaptér nad aktuálním datovým modelem, ne duplicitní mock data.

5. MCP:
   Ověř a připoj stdio server z E:\Projects\humandesignchart\server\mcp\leados-mcp-server.ts pod názvem hdm-optimateo-bridge.
   Exponované tools: get_hdm_stats, get_hdm_leads, sync_lead_status.
   MCP proces potřebuje pouze DATABASE_URL Human Designu; nevystavuj databázi přes veřejný HTTP endpoint.

6. Kompatibilita:
   Pokud v Optimateo existují staré /api/hub nebo LeadOS názvy, ponech dočasné aliasy, ale kanonické nové URL a UI označ jako Optimateo.

7. Ověření:
   Přidej kontraktní testy pro všech 7 external endpointů, ingest a HMAC webhook.
   Proveď typecheck, relevantní Vitest testy a build.
   Nakonec dej tabulku endpoint -> status -> důkaz a přesný seznam Railway proměnných, které mám nastavit. Neoznač integraci za hotovou bez živého testu proti www.optimateo.com.

Human Design strana používá nové proměnné OPTIMATEO_EXTERNAL_API_URL, OPTIMATEO_API_KEY a OPTIMATEO_WEBHOOK_SECRET, ale zatím zachovává fallback na LEADOS_API_KEY/LEADOS_WEBHOOK_SECRET. Po ověření produkce navrhni termín odstranění legacy aliasů.
```

