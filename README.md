# Human Design

Produkční webová aplikace pro výpočet Human Design map, osobní výklady, tranzity, partnerské porovnání a prémiové reporty.

- Produkce CZ: https://www.humandesignmapa.cz
- Produkce EN: https://www.humandesignchart.app
- Deployment: Railway, automaticky z větve `main`

## Aktuální produkt

- výpočet mapy a interaktivní Bodygraph,
- automatické ukládání map přihlášeným uživatelům,
- AI výklady včetně Luny a denních tranzitů,
- osobní dashboard, historie výkladů, profily a poznámky,
- partnerská kompatibilita a PDF reporty,
- průvodkyně **Marie** s vlastní konzistentní vizuální identitou,
- admin/moderátor plánovač sociálních sítí a příprava affiliate influencerů,
- CZ/EN lokalizace, responzivní navigace a SEO obsah včetně andělských čísel,
- GA4 měření se souhlasem a připravené Sklik konverzní události,
- Stripe Checkout a webhooky pro jednorázové produkty i členství.

## Monetizace

Aktuální produktový žebřík:

| Produkt                   | Cena CZK | Úloha                              |
| ------------------------- | -------: | ---------------------------------- |
| Mapa + 1 AI výklad        |   zdarma | získání registrace a první hodnoty |
| Balíček 5 AI výkladů      |    77 Kč | nízkoprahový první nákup           |
| Premium měsíčně           |   188 Kč | opakovaný příjem                   |
| Premium ročně             | 1 188 Kč | hlavní členská nabídka             |
| Doživotní Premium         | 2 888 Kč | vyšší jednorázová hodnota          |
| Human Design Blueprint    |   390 Kč | hlavní jednorázový report          |
| Partnerský doplněk        |   190 Kč | order bump                         |
| Upgrade na roční členství |   798 Kč | post-purchase upsell               |

Apple Pay a Google Pay se zobrazí přes Stripe podle zařízení a nastavení Stripe účtu. Comgate je plánovaný pro české jednorázové platby po dokončení obchodního napojení.

## Technologie

- React 19, TypeScript, Vite, Tailwind CSS 4
- Express, tRPC 11, Zod
- Drizzle ORM + MySQL
- Stripe
- Vitest + TypeScript compiler
- Railway

## Lokální spuštění

Požadavky: Node.js 20+, pnpm a dostupná MySQL databáze.

```bash
pnpm install
pnpm dev
```

Aplikace standardně běží na `http://localhost:3000`.

## Ověření změn

```bash
pnpm check
pnpm test
pnpm build
```

Pro rizikové změny používejte nejdříve cílené testy a potom celý sanity gate. Build musí projít před pushnutím do `main`.

## Databáze

```bash
pnpm db:push
```

Migrace jsou v `drizzle/`. Produkční migrace spouštějte vědomě před funkcemi, které nové sloupce vyžadují. Poslední produktové migrace přidávají roli moderátora, sociální Stories a kredity Blueprint PDF.

## Důležité proměnné prostředí

### Základ

- `DATABASE_URL`
- `JWT_SECRET`
- OAuth proměnné používané v `server/_core`
- `OWNER_OPEN_ID`

### Platby

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- veřejný Stripe klíč pro klienta

### Analytika a akvizice

- GA4 measurement ID
- `VITE_SEZNAM_SEM_ID` pro Sklik retargeting a konverze

### Integrace

- `LEADOS_API_KEY`
- `LEADOS_WEBHOOK_SECRET`
- přístupové údaje sociálních sítí až po schválení publikačního toku

Nikdy necommitujte tajné klíče ani produkční tokeny.

## Struktura

- `client/` — stránky, komponenty, design a klientská analytika
- `server/` — API, auth, AI, platby, sociální sítě a bezpečnost
- `drizzle/` — schéma a migrace
- `shared/` — sdílené typy a obsah
- `docs/` — provozní a produktová dokumentace
- `todo.md` — detailní backlog; níže je aktuální exekuční priorita

## Aktuální změny

- nový živý Nexus hero efekt s rotující sítí, aurorou a pulzujícím jádrem,
- průvodkyně přejmenována na Marii napříč produktem,
- samostatná editorial fotografie Marie pro landing page,
- nekonečný automatický pás dalších projektů bez scrollbaru,
- nové a lépe centrované náhledy projektů Katastr Online a Čajovny Praha,
- respektování systémového nastavení `prefers-reduced-motion`.

## Prioritní TODO

### P0 — první tržby

- [ ] Doplnit `VITE_SEZNAM_SEM_ID` a ověřit Sklik pixel v produkci.
- [ ] Udělat reálný nízkohodnotový Stripe nákup, webhook, refund a kontrolu přidělení produktu.
- [ ] Označit klíčové GA4 události jako konverze a ověřit celý funnel.
- [ ] Spustit Sklik test za 300–500 Kč na Blueprint; retargeting až po vytvoření dostatečného publika.
- [ ] Dokončit údaje a webhook Comgate po potvrzení smlouvy.

### P1 — konverze a retence

- [ ] Týdenní osobní e-mail s tranzity a jedním praktickým doporučením.
- [ ] A/B test hero nabídky a checkoutu Blueprintu.
- [ ] Dokončit navazující konverzaci Marie s bezpečně omezenou pamětí kontextu.
- [ ] Přidat měsíční energetický kalendář a důležitá upozornění.
- [ ] Dokončit měření kohort: registrace → první výklad → checkout → opakovaný nákup.

### P2 — růst

- [ ] Aktivovat affiliate sekci pro schválené influencery včetně UTM a provizí.
- [ ] Napojit LeadOS na lead nurturing a win-back scénáře.
- [ ] Připravit pravidelnou obsahovou sérii „Denní poselství Marie“.
- [ ] Rozšířit rodinné profily a měsíční partnerský report.

### P3 — technický dluh

- [ ] Rozdělit největší klientské chunky a sledovat Core Web Vitals.
- [ ] Přidat E2E test OAuth, auto-save a Stripe checkoutu.
- [ ] Pravidelně ověřovat sitemapu a indexaci v Google Search Console.
- [ ] Doplnit produkční healthcheck a alerty na chyby webhooků.

## Nasazení

1. Zkontrolovat `git diff` a cizí rozpracované změny.
2. Spustit minimálně `pnpm check` a `pnpm build`.
3. Commitnout pouze zamýšlený rozsah a pushnout `main`.
4. Počkat na terminální stav Railway `SUCCESS`.
5. Ověřit runtime logy, HTTP odpověď a hlavní uživatelský tok na produkční doméně.
