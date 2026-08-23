# HumanDesignMapa.cz — testovací strategie

Datum: 14. 8. 2026  
Princip: correctness a finanční integrita jsou blocking gates; vizuální polish není náhradou za funkční testy.

## 1. Cíle

Testovací systém musí prokazovat, že:

- stejný vstup vede ke stejné a referenčně správné mapě;
- historické lokální datum a čas jsou jednoznačně převedeny na UTC;
- uživatel může mapu uložit, znovu načíst a najít ji i po novém procesu/deploymentu;
- AI nesmí změnit deterministická fakta ani číst cizí mapu;
- opakovaný payment webhook splní objednávku právě jednou;
- autentizace, role a vlastnictví zdrojů se vynucují na serveru;
- veřejné URL vracejí správné statusy, canonical, hreflang a jazyk;
- release lze zastavit podle objektivních signálů.

## 2. Testovací pyramida

### Unit — rychlé a deterministické

- převod lokálního času + IANA zone na UTC;
- validace neexistujícího/dvojznačného lokálního času;
- převod ekliptikální longitude na bránu/line/color/tone/base;
- typ, autorita, profil, definice, centra, kanály a brány;
- entitlement policy, price/currency převody a affiliate matematika;
- prompt builder a post-generation grounding validator;
- canonical/hreflang URL builder;
- sanitizace HTML, AI inputu a sdíleného payloadu.

### Integration — reálné hranice modulů

- kalkulátor s konkrétní verzí tz databáze a ephemeridy;
- router + test DB pro CRUD map a ownership;
- Stripe/Comgate webhook + DB transakce + entitlement ledger;
- AI router + fake LLM + reálný chart repository;
- auth cookie, CSRF a role middleware;
- sitemap/SSR meta/server 404 kontrakt.

### E2E — klíčové uživatelské cesty

- anonymní kalkulace → základní výsledek → login → uložení → dashboard → detail;
- save → nový browser context → nový server process → mapa stále existuje;
- free limit → transparentní upgrade vysvětlení → checkout start, bez skutečné platby v běžném CI;
- Stripe test-mode checkout/webhook v odděleném nightly prostředí;
- AI výklad z uložené mapy, follow-up historie a selhání modelu;
- partner share → OG preview → partner výpočet → propojení bez úniku birth dat;
- mobile/desktop navigace, sticky prvky, focus, klávesnice a kritické překryvy.

## 3. Golden chart suite

### Minimální dataset

Nejméně 30 referenčních narození:

- Praha, Londýn, New York, Los Angeles, Reykjavík, Dillí, Káthmándú, Adelaide a ostrovní/hranční zóny;
- zimní i letní čas;
- okamžik před a po DST přechodu;
- jarní neexistující lokální čas;
- podzimní dvojznačný lokální čas;
- historické datum před současnými timezone pravidly;
- čas blízko půlnoci a UTC date boundary;
- známé případy blízko hranice brány a linie.

### Golden fixture

Každý záznam obsahuje:

- vstup přesně tak, jak jej zadal uživatel;
- IANA timezone a zvolenou variantu ambiguity;
- očekávaný UTC instant;
- očekávané planetární longitude v toleranci;
- očekávaný typ, strategii, autoritu, profil, definici, centra, kanály a brány;
- zdroj reference, datum ověření, verzi kalkulátoru a tz databáze.

### Tolerance a změnový proces

- diskrétní HD vlastnosti musí souhlasit přesně;
- planetární longitude mají předem schválenou numerickou toleranci;
- změna golden výsledku nesmí být provedena automatickým snapshot update;
- každý update vyžaduje vysvětlení, nezávislou referenci a review.

## 4. Timezone contract tests

Povinné případy:

1. `Europe/Prague` v lednu a červenci;
2. den začátku a konce DST;
3. neexistující lokální čas vrátí validační chybu, ne tiché přepočítání;
4. dvojznačný lokální čas vyžaduje explicitní volbu dřívější/pozdější varianty;
5. quarter/half-hour zone (`Asia/Kathmandu`, `Australia/Adelaide`);
6. historické změny zóny;
7. klientem zaslaný offset není autoritativní;
8. locale a místo nemění výsledek, pokud je UTC instant stejný.

## 5. Payment safety tests

Pro každý podporovaný produkt a provider:

- validní podpis + první event → právě jeden ledger záznam a jedno plnění;
- totožný event 2×, 10× a paralelně → stále právě jedno plnění;
- odlišné event ID se stejným session/payment ID → definované chování bez dvojitého plnění;
- chyba uprostřed transakce → bezpečný retry;
- neplatný podpis → 400 a žádná změna DB;
- chybějící metadata/user → dead-letter/audit stav, ne tiché připsání;
- refund/chargeback → kompenzační entitlement záznam;
- částka, měna a produkt musí odpovídat serverové nabídce;
- affiliate provize se vytvoří právě jednou;
- reconciliation porovná provider stav a lokální ledger.

Stripe CLI testy mají používat fixní test fixtures. Comgate testy používají podepsané uložené payloady; žádný běžný test nesmí kontaktovat ostrou bránu.

## 6. AI reliability a safety tests

### Autoritativní fakta

- router přijímá pouze vlastněné `chartId`;
- cizí nebo neexistující `chartId` vrací jednotnou not-found odpověď;
- klientský pokus změnit typ/profil/autoritu není součástí API kontraktu;
- post-validator porovná všechny deterministické vlastnosti s mapou;
- výstup s rozporem se nezapíše jako úspěšný a nestrhne kredit bez kompenzace.

### Eval dataset

- alespoň 50 reprezentativních otázek v češtině a 20 v angličtině;
- rubriky: factual consistency, praktická užitečnost, tón, nejistota, bezpečnost, absence guru/diagnostických tvrzení;
- adversarial prompt injection, žádost o cizí data a manipulace s historií;
- model/prompt upgrade musí projít regresním prahem před rolloutem.

### Failure paths

- timeout, provider 429/5xx, nevalidní structured output, přerušený stream;
- retry je omezený a měřený;
- kredit a UI stav zůstávají konzistentní;
- log neobsahuje celé birth data ani celý prompt.

## 7. Data persistence, auth a security

- chart CRUD testovat proti skutečné izolované MySQL DB, ne pouze mocku;
- unikátní save/idempotency key testovat paralelním zápisem;
- update/delete/get vždy s owner a non-owner uživatelem;
- shared token vrací jen minimální povolený payload a po expiraci nefunguje;
- session cookie flags, CSRF, OAuth state one-time use a redirect allowlist;
- admin/staff routy testovat z pohledu guest/user/moderator/admin;
- export účtu a smazání účtu včetně navázaných osobních dat;
- HTML sanitizace s běžnými XSS payloady;
- dependency a secret scan jako CI gate.

## 8. SEO contract tests

Pro každou veřejnou route z jednoho centrálního manifestu ověřit:

- 200 pouze pro existující obsah;
- neexistující stránka 404 a `noindex`;
- přesně jeden self canonical;
- konzistentní `html lang`, canonical host a locale path;
- reciproční `cs`, `en` a `x-default` hreflang bez dvojitého locale;
- URL v sitemap vrací 200 a není blokovaná robots;
- OG image je 200, správný content type a absolutní URL;
- privátní stránky nejsou v sitemap a mají odpovídající robots/meta pravidla.

## 9. Analytics contract

Jednotná schema-versioned taxonomie:

- `chart_started`
- `chart_generated`
- `chart_generation_failed`
- `result_viewed`
- `chart_save_started/completed/failed`
- `ai_reading_started/completed/failed`
- `checkout_started`
- `purchase_completed/refunded`
- `activation_completed`

Test ověří jméno eventu, povinná pole, consent gate, deduplication ID a zákaz posílání birth time/place, emailu či celého chart JSON do marketingové analytiky.

## 10. Performance a accessibility

- bundle budget pro vstupní veřejnou route a kalkulátor;
- LCP/INP/CLS budget v mobilním profilu;
- kalkulační a save API latency percentily;
- AI streaming first-token time;
- keyboard-only dokončení kalkulátoru a checkout startu;
- modal focus trap, kontrast, názvy prvků a minimální tap target;
- viewporty: 360, 390, 768, 1024, 1280, 1440 a zoom 200 %.

## 11. CI a release gates

### Každý pull request

1. reproducible install z lockfile;
2. TypeScript check včetně testů;
3. lint;
4. unit + integration testy;
5. build;
6. kritické E2E proti ephemeral DB;
7. dependency/secret scan;
8. SEO contract a accessibility smoke.

### Nightly

- plná golden chart suite a nezávislé reference;
- Stripe test-mode end-to-end a webhook replay;
- AI eval dataset na aktuálním modelu;
- sitemap crawl, broken links, OG a locale matice;
- delší mobile/performance běh.

### Release je blokován, pokud

- selže jediný P0 correctness nebo payment test;
- je test vynechán bez časově omezené výjimky;
- vznikne nový high/critical security nález;
- migrace nemá rollback/forward recovery test;
- produkční smoke test po deployi neprojde.

## 12. Produkční smoke a rollback

Po každém deployi automaticky ověřit:

1. health endpoint, homepage, kalkulátor, login callback a dashboard;
2. testovací mapu s fixním očekávaným výsledkem;
3. save + read téže mapy;
4. AI provider health bez placeného full výkladu;
5. Stripe webhook endpoint signature behavior;
6. canonical/hreflang/404;
7. error rate, DB connection, latency a asset 404.

Rollback musí být připraven před deployem. Databázové migrace pro ledger a unikátní klíče musí být nejprve zpětně kompatibilní, poté teprve zapnuté feature flagem.

## 13. Okamžitý nápravný backlog testů

1. opravit poškozenou instalaci/lockfile tak, aby `pnpm lint` běžel;
2. opravit drift `server/qa-healthcheck.test.ts` podle současného router kontraktu;
3. zahrnout testy do TypeScript checku nebo přidat samostatný test tsconfig;
4. přidat timezone unit/fixture suite před změnou produkčního převodu;
5. přidat payment event ledger integration a replay testy před migrací;
6. přidat AI ownership/grounding testy před změnou API;
7. přidat persistence restart E2E;
8. přidat SEO contract crawler;
9. vytvořit minimální post-deploy smoke job s jasným rollback signálem.
