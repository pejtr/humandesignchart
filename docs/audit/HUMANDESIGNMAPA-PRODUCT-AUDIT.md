# HumanDesignMapa.cz — produktový a technický audit

Datum auditu: 14. 8. 2026  
Auditovaný checkout: `E:\Projects\humandesignchart`, větev `main`, commit `3fe6783`  
Produkční povrch: `https://www.humandesignmapa.cz`  

## Executive summary

Produkt už obsahuje většinu funkčních stavebních kamenů potřebných pro důvěryhodné členství: výpočet mapy, uložené mapy, dashboard, AI výklady a konverzace, tranzity, partnerské porovnání, PDF/plakát, Stripe, Comgate, analytiku, SEO obsah i interní marketingové nástroje. Není proto vhodné stavět další paralelní funkce ani přidávat agresivní prodejní vrstvy.

Před rozšiřováním monetizace je nutné uzavřít čtyři P0 oblasti:

1. výpočet historického času používá odhad časového pásma z longitude a není spolehlivý pro DST ani historické změny;
2. Stripe a Comgate webhooky nemají trvalou idempotenci a opakované doručení může plnění připsat vícekrát;
3. generování AI výkladu přijímá výpočtová fakta z klienta místo autoritativního načtení uložené mapy;
4. hlavní testovací gate je červený a lint gate je momentálně nespustitelný kvůli poškozené instalaci závislosti.

Audit neprokázal aktuální ztrátu uložené mapy po restartu. Na živém účtu byla po novém načtení dostupná jedna uložená mapa a detail `/cs/chart/2`. Ukládání je databázové a dotazy jsou omezené podle `userId`. Chybí však databázová unikátnost, transakční ochrana souběhu a end-to-end restart test, proto nelze dřívější incident považovat za definitivně uzavřený.

## 1. Architektura

| Vrstva | Současný stav |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind, Wouter, tRPC klient; 43 page modulů a lazy loading hlavních rout |
| Backend | Express 4, tRPC 11, modulární routery; 23 doménových routerů |
| Databáze | MySQL přes Drizzle ORM, JSON snapshoty vypočtených map |
| Výpočet | Vlastní Human Design kalkulátor nad `astronomia`/VSOP87 ephemeridami |
| AI | OpenAI-compatible LLM rozhraní, výchozí Gemini 2.5 Flash, klasické a streamované výklady |
| Platby | Stripe Checkout + webhooky, Comgate pro lokální jednorázové platby, kredity, dárky a affiliate provize |
| Provoz | Jeden Express proces servíruje API i Vite build; interní cron publisher běží v procesu |
| Měření | GA4, Meta, Reddit, Sklik a Optimateo/LeadOS; souhlas je respektován na klientu |

Silnou stránkou je přehledné doménové dělení backendu. Slabou stránkou je, že několik kritických garancí zůstává pouze v aplikačním kódu: historické časové pásmo, deduplikace map, idempotence plateb, rate limiting a validace JSON snapshotu.

## 2. Inventář produkčních funkcí

### Veřejná akvizice a vzdělávání

- landing page a bezplatný kalkulátor;
- Human Design test, typy, autorita, brány, cesty a encyklopedie;
- blog, celebrity, I-ťing, andělská čísla a dětský průvodce;
- denní tranzit a veřejné tranzitní stránky;
- ceník, referral landing a sdílené mapy;
- vícejazyčná routovací vrstva.

### Přihlášený produkt

- osobní dashboard a databázově uložené mapy;
- detail mapy, bodygraph, tranzitní překrytí, proměnné a návratové mapy;
- porovnání, composite a partnerská kompatibilita;
- AI výklady, AI průvodce, historie konverzace a hodnocení;
- PDF report, plakát a audio vrstva Marie;
- kreditní, referral, gamifikační a notifikační mechanismy;
- zákaznický portál a affiliate program.

### Interní nástroje

- sociální plánovač chráněný rolí `admin`/`moderator`;
- CRM/Optimateo, ads a UGC nástroje;
- newsletter, push a interní notifikace.

### Platby

- měsíční, roční a lifetime plán;
- jednorázový Blueprint, kredity, dárkové poukazy a digitální doplňky;
- Stripe Checkout a zákaznický portál;
- Comgate integrace pro lokální platby;
- affiliate provize a payout evidence.

## 3. Aktuální datový model

| Oblast | Hlavní tabulky / pole | Auditní poznámka |
|---|---|---|
| Identity | `users`, `openId`, role, Stripe customer/subscription, kredity | centrální entitlementy jsou v `users`; chybí samostatný entitlement ledger |
| Mapy | `charts`, birth data, místo, timezone, `chartData` JSON | snapshot je praktický, ale není schématicky ani verzí validovaný |
| AI | `aiReadings`, `chatConversations`, `chatMessages` | historie existuje; nejsou uloženy model, tokeny, cena ani verze promptu |
| Sdílení | `sharedCharts`, token, celý `chartData` JSON | je třeba explicitně určit minimalizaci a expiraci citlivých birth dat |
| Platby | Stripe pole v `users`, `creditTransactions`, dárky, affiliate conversions/payouts | chybí `payment_events`/`fulfillments` s unikátním provider event ID |
| Retence | notifications, referrals, gamification, newsletter/push | již existující základ, není důvod jej přepisovat |
| Marketing | social posts/accounts, Optimateo/LeadOS data | správně oddělit od primárního produktového trust path |

V deklaracích tabulek nebyly nalezeny explicitní cizí klíče a u klíčových vztahů ani potřebné indexy. Deduplikace mapy je `select` následovaný `update/insert`; bez DB unikátního klíče může při souběhu vzniknout duplicita.

## 4. Pipeline výpočtu mapy

1. Klient geokóduje místo narození přímým voláním veřejného Nominatim endpointu.
2. Klient odvodí offset jako `Math.round(longitude / 15)` a pošle jej serveru.
3. `chart.calculate` předá offset do `calculateHumanDesignChart`.
4. Kalkulátor vytvoří UTC okamžik odečtením offsetu od lokální hodiny.
5. Ephemerida spočítá osobnostní pozice a iterací najde design date při Slunci přibližně 88° zpět.
6. Výsledek se složí do typu, strategie, autority, profilu, center, kanálů, bran a dalších vlastností.
7. Při uložení se celý výsledek uloží jako JSON snapshot do `charts`.

### Kritická slabina

Longitude není časové pásmo. Odhad selhává na hranicích pásem, při letním čase, historických změnách pravidel a u lokálních výjimek. Stejná logika je duplikovaná minimálně v kalkulátoru, porovnání, embed kalkulátoru a testu. Výsledek může posunout narození o hodinu i více a změnit výpočtová fakta.

### Cílový kontrakt

- klient posílá IANA zone ID, například `Europe/Prague`, ne autoritativní offset;
- server řeší offset pro konkrétní datum a čas z historické tz databáze;
- neexistující nebo dvojznačný lokální čas vyvolá explicitní volbu/varování;
- canonical `ChartCalculationInput` a `ChartResult` mají runtime schema a `calculationVersion`;
- výsledek se porovnává s referenční sadou známých map a externím astronomickým zdrojem v toleranci.

## 5. AI pipeline

### Co funguje

- chráněné procedury, kreditní/členské limity a historie výkladů;
- samostatný AI průvodce načítá primární mapu uživatele z DB;
- otázka a historie se omezují délkou a procházejí základní sanitizací;
- do průvodce se doplňují živé tranzity;
- existuje streamovaná i klasická cesta.

### P0 problém

`ai.generateReading` přijímá `chartId` a generický `chartData` přímo od klienta. Před promptem ani zápisem výkladu neověřuje, že mapa patří přihlášenému uživateli, a nenačítá autoritativní data z DB. Klient tak může změnit typ, profil, autoritu či jiná fakta, případně připsat výklad k cizímu ID.

### Cílový kontrakt

- vstupem je pouze vlastněné `chartId`, typ výkladu a uživatelská otázka;
- fakta se serverově načtou z validovaného snapshotu nebo znovu deterministicky spočítají;
- prompt oddělí neměnná výpočtová fakta od interpretační vrstvy;
- odpověď má strukturovaný výstup, verzi promptu/modelu, latenci a odhad nákladů;
- validační krok odmítne odpověď, která mění typ, profil, autoritu, centra, kanály nebo brány;
- text používá podpůrný jazyk, nejistotu u interpretace a neprezentuje AI jako autoritu či guru.

## 6. Platby a entitlementy

### Co funguje

- produkční Stripe webhook vyžaduje platný podpis;
- fulfillment probíhá serverově z webhooku, ne z návratové URL;
- Stripe lifecycle události upravují stav předplatného;
- checkout používá Stripe Managed Payments;
- produktové ceny a limity jsou centralizované alespoň částečně;
- Comgate webhook a lokální platební cesta existují.

### P0 problém

Není evidováno zpracování provider event ID. Opakované `checkout.session.completed` nebo opakovaná Comgate notifikace `PAID` mohou znovu připsat kredity, PDF, voucher nebo affiliate provizi. Webhook delivery je z principu at-least-once, takže nejde o hypotetickou okrajovou situaci.

### Další rizika

- některé jednorázové platby přímo zapisují dlouhodobý subscription stav;
- chybí viditelná refund/chargeback kompenzace a reconciliation job;
- `amountCzk` se používá i při jiné měně;
- checkout konfigurace může při neúplném Comgate nastavení skončit fallbackem bez reálné transakce;
- entitlementy jsou rozptýlené mezi `users`, služby a webhooky.

### Cílový kontrakt

Nové tabulky `paymentEvents` a `entitlementLedger` s unikátním `(provider, eventId)`, transakčním claimem události, explicitním stavem plnění, kompenzačními záznamy pro refundy a bezpečným replayem.

## 7. Analytics a observabilita

### Existující stav

- GA4 s consent-aware inicializací;
- Meta Pixel/CAPI, Reddit Pixel/CAPI a Sklik;
- Optimateo tracker s kompatibilním aliasem LeadOS;
- A/B event helper;
- klient sbírá Web Vitals.

### Mezery

- chybí jednotná produktová taxonomie celého funnelu (`chart_started`, `chart_generated`, `result_viewed`, `chart_saved`, `ai_reading_started/completed/failed`, `checkout_started`, `purchase_completed`);
- Web Vitals se pouze vypíší do stdout a nejsou trvale agregované;
- nejsou evidované LLM tokeny, cena, latence, provider/model/prompt version;
- chybí dashboard chyb výpočtu, save failure, webhook replay, payment mismatch a AI grounding failure;
- nebyl ověřen alerting ani distribuovaný tracing.

Bez této vrstvy nelze bezpečně optimalizovat monetizaci: nepoznáme, zda problém vzniká v trafficu, dokončení kalkulace, aktivaci, důvěře nebo checkoutu.

## 8. SEO a organický růst

### Ověřeno na produkci

- `/cs/`, `/en/`, `/sitemap.xml` a `/robots.txt` vrací 200;
- sitemap obsahuje lokalizované alternativy a nemá zjevné duplicity;
- česká veřejná stránka má canonical;
- obsahové clustery blogu, typů a andělských čísel existují.

### Nálezy

- `buildSeoHead` odvozuje alternativu z canonical URL, která už obsahuje locale, a poté přidává `/en` znovu. Výsledkem jsou URL typu `/en/cs/...` nebo `/en/en/...`;
- anglická stránka na českém hostu vrací chybné `<html lang="cs">` a nekonzistentní hreflang;
- náhodná neexistující URL `/cs/does-not-exist` vrací SPA s HTTP 200 — soft 404;
- root `/` vrací generický HTML shell a spoléhá na klientský redirect;
- apex doména se z auditního prostředí nepodařila přeložit; `www` funguje. DNS/redirect je nutné ověřit u poskytovatele;
- `dangerouslySetInnerHTML` nad regex rendererem blogu/andělských čísel není bezpečný pro budoucí editovatelný nebo importovaný obsah;
- chybí explicitní CSP a kompletní sada bezpečnostních hlaviček.

SEO opravy patří do P1: ovlivňují důvěryhodnost a organický růst, ale nemají přednost před správností výpočtu a finanční integritou.

## 9. Testy a současný quality gate

| Kontrola | Výsledek |
|---|---|
| `pnpm check` | PASS |
| `pnpm build` | PASS; několik JS chunků má přibližně 685–943 kB |
| `pnpm test` | FAIL; 257 testů prošlo, 15 selhalo, 1 byl přeskočen |
| `pnpm lint` | BLOCKED; lokální `minimatch` instalaci chybí `assert-valid-pattern.js` |
| živý smoke test | PASS pro dashboard, chart detail, pricing, AI guide a calculate v přihlášené session |

Všech 15 testovacích selhání je soustředěno v `server/qa-healthcheck.test.ts`: drift mocků a očekávání u public stats, blogu, testimonials, composite/share, newsletteru, referral, gift, notifications a gamification. To neznamená 15 potvrzených produkčních regresí, ale znamená to, že release gate neposkytuje důvěryhodný signál.

Chybí zejména:

- zlaté mapy a externí astronomické porovnání;
- DST, historické timezone, neexistující/dvojznačné lokální časy a date-boundary testy;
- replay/idempotency testy Stripe a Comgate webhooků;
- AI grounding testy, které zakazují změnu deterministických faktů;
- E2E cesta anonymní kalkulace → login → save → reload/restart → detail;
- SEO kontrakty pro status, canonical, hreflang a `lang`;
- test bezdrátové ochrany admin/staff rout a IDOR mutací.

Podrobný návrh je v `docs/testing/TEST-STRATEGY.md`.

## 10. Security a soukromí

### Silné stránky

- chráněné tRPC procedury a role `staff`/`admin` na serveru;
- saved-chart read/update/delete dotazy obsahují `userId`;
- Stripe podpis je v produkci povinný;
- body parser má rozumné limity a Express neposílá `x-powered-by`;
- základní security headers existují.

### Rizika

- session cookie používá `SameSite=None`; audit nenalezl explicitní CSRF token pro mutace;
- OAuth state je podepsaný a časově omezený, ale stateless, není jednorázově spotřebovaný ani pevně svázaný s browser session;
- birth data a jejich přesnost jsou citlivé osobní údaje; chybí dohledaná self-service export/delete cesta a jasná retenční politika;
- AI rate limit je pouze v paměti jednoho procesu;
- HTML renderery mohou při budoucím dynamickém obsahu otevřít stored XSS;
- chybí CSP/HSTS a formalizovaný secrets/rotation runbook;
- AI vstup z klienta porušuje boundary důvěry i vlastnictví mapy.

## 11. P0–P3 matice

| Priorita | Nález | Dopad | Důkaz | Doporučení |
|---|---|---|---|---|
| P0 | Historický čas odvozený z longitude | chybná mapa a ztráta důvěry | klient `Math.round(longitude / 15)`, server odečítá offset | IANA timezone na serveru, DST validace, fixture suite |
| P0 | Neidempotentní payment fulfillment | dvojité kredity/reporty/provize | webhooky nemají event ledger | transakční event claim + unikátní event ID + replay testy |
| P0 | AI přijímá klientská výpočtová fakta | nepodložený nebo cizí výklad | `ai.generateReading(chartId, chartData)` | load by owned `chartId`, runtime schema, grounding validator |
| P0 | Release test gate je červený | nelze bezpečně vydávat | 15 fail v QA healthchecku; lint blokovaný | opravit fixture/mock drift, lockfile/install a zavést blocking CI |
| P1 | Saved-chart integrita není v DB garantovaná | duplicity, obtížná diagnostika incidentu | select-then-insert bez unique/transaction | unique klíč/idempotency key, audit log, restart E2E |
| P1 | Soft 404 a chybné hreflang/lang | horší indexace a duplicitní signály | produkční HTTP/meta kontrola | server route manifest, 404/noindex, canonical locale builder |
| P1 | Slabá observabilita | pomalá detekce chyb a slepá optimalizace | vitals pouze stdout, žádné LLM/payment KPI | strukturované eventy, error tracking, funnel dashboard |
| P1 | CSRF/OAuth replay/privacy mezery | account a privacy riziko | SameSite None, stateless state, bez delete flow | CSRF kontrakt, one-time state, export/delete/retence |
| P1 | Chybí refund/reconciliation workflow | nesoulad peněz a přístupů | žádný ledger/kompenzace | refund eventy, denní reconciliation report |
| P2 | Velké lazy chunks | pomalejší první interakce na slabších zařízeních | build 685–943 kB | bundle profiling, jemnější code split, odložit interní moduly |
| P2 | Výpočet/typy JSON bez verze | obtížné migrace a regresní audit | generický JSON snapshot | runtime schema + `calculationVersion` |
| P2 | AI bez cost/quality metrik | neřiditelné marže a kvalita | bez model/token/prompt metadata | telemetry, model routing, cache a eval dataset |
| P2 | Nekonzistentní positioning a interpretační tón | nižší důvěra | prompt copy používá autoritativní/guru styl | evidence-first tone guide a copy audit |
| P3 | Další premium funkce a upsells | riziko odvádění od core value | produkt jich má již mnoho | až po retenci, funnel datech a trust gates |

## 12. Doporučené fáze a release gates

### Fáze 0 — audit a zmrazení scope (tento dokument)

Výstup: inventář, P0–P3, testovací strategie, žádná nová monetizační vrstva.

### Fáze 1 — correctness a finanční integrita

- serverová historická timezone pipeline;
- canonical runtime schémata a `calculationVersion`;
- payment event/entitlement ledger a replay-safe fulfillment;
- AI pouze z vlastněné autoritativní mapy;
- opravený test/lint gate.

Exit criteria: zelený check/build/lint/test, zlaté mapy, payment replay 1× fulfillment, AI nemění deterministická fakta.

### Fáze 2 — reliability, security a trust

- DB unikátnost a audit save flow;
- E2E restart persistence;
- error tracking, funnel a LLM/payment telemetry;
- CSRF/OAuth state hardening, privacy export/delete;
- SEO canonical/hreflang/404 a sanitizace obsahu.

Exit criteria: zelené kritické E2E, alerting na P0/P1, žádné high security nálezy, validní SEO contract.

### Fáze 3 — retence

- aktivace dashboardu kolem jedné osobní mapy;
- kvalitní denní/týdenní guidance, historie a journaling;
- měřit návrat D1/D7/D30, užitečnost AI a dokončení klíčových cest.

Exit criteria: prokázaná opakovaná hodnota a segmenty, které se vracejí bez agresivních pobídek.

### Fáze 4 — organický růst

- obsah z reálných dotazů uživatelů;
- SEO clustery s kalkulátorem jako praktickým nástrojem;
- referral sdílení s korektním OG preview a privacy-safe payloadem.

### Fáze 5 — jemná monetizace

- transparentní členství prodávající kontinuitu, historii a hlubší praktické vedení;
- žádné countdowny, falešná aktivita, fake scarcity ani paywall před základním výsledkem;
- cenu a nabídku testovat až nad spolehlivým funnel měřením.

## 13. Soubory pravděpodobné k úpravě

### P0 timezone a výpočet

- `client/src/pages/ChartCalculator.tsx`
- `client/src/pages/ChartComparison.tsx`
- `client/src/pages/EmbedCalculator.tsx`
- `client/src/pages/HumanDesignTest.tsx`
- `client/src/lib/chartDraft.ts`
- `server/routers/chart.ts`
- `server/humandesign/calculator.ts`
- `server/humandesign/ephemeris.ts`
- `shared/types.ts`
- nový `server/humandesign/timezone.ts`
- nové fixture/test soubory pod `server/humandesign/`

### P0 platby

- `drizzle/schema.ts`
- nová Drizzle migrace
- `server/stripeWebhook.ts`
- `server/comgateWebhook.ts`
- `server/routers/subscription.ts`
- `server/services/payment.ts`
- nové integration/replay testy

### P0 AI

- `server/routers/ai.ts`
- `server/_core/routes/aiStream.ts`
- `server/ai/prompts.ts`
- `server/_core/llm.ts`
- `server/db/charts.ts`
- `shared/types.ts`
- nové grounding/eval testy

### Test gate, reliability a SEO

- `server/qa-healthcheck.test.ts`
- `package.json`, `pnpm-lock.yaml`, případně `pnpm-workspace.yaml`
- CI workflow pod `.github/workflows/`
- `server/db/charts.ts`, `drizzle/schema.ts` a migrace
- `server/_core/seoMeta.ts`
- `server/_core/vite.ts`
- `server/_core/index.ts`
- `client/src/App.tsx`
- `client/src/pages/NotFound.tsx`
- `client/src/pages/BlogArticle.tsx`
- `client/src/pages/AndelskaCislaDetail.tsx`
- analytické hooky v `client/src/hooks/`

## 14. Co již existuje a nesmí se znovu stavět

- funkční výpočetní engine a ephemerida — opravit vstupní časovou normalizaci a ověřit, ne přepsat od nuly;
- databázové ukládání map a user-scoped CRUD — doplnit integritní garance;
- osobní dashboard a načítání uložených map;
- AI průvodce s databázovou historií;
- klasické a streamované AI výklady;
- tranzity, partner/composite, PDF a plakát;
- Stripe Checkout, Stripe Customer Portal a Comgate adaptér;
- kreditní, gift, affiliate a gamifikační základy;
- GA4, Meta, Reddit, Sklik a Optimateo měření;
- sitemap, robots, OG routes a rozsáhlý obsahový základ;
- staff social scheduler, CRM a ads nástroje.

Pravidlo pro další práci: rozšířit pouze jednu autoritativní implementaci každé schopnosti. Nevytvářet další paralelní dashboard, druhý entitlement systém, druhý chart model ani další promo overlay.

## Omezení auditu

- nebyla provedena skutečná platba ani refund;
- nebyl simulován reálný restart produkční DB/služby;
- nebyly dostupné agregované produkční logy, Stripe event history ani metriky databáze;
- astronomický výsledek ještě nebyl porovnán s nezávislou referenční sadou;
- produkční smoke test ověřil pouze bezpečné read-only cesty v existující přihlášené session;
- změny aplikační logiky ani deployment nejsou součástí této auditní fáze.
