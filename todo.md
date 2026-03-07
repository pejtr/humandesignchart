# Human Design App - TODO

## Core Infrastructure
- [x] Database schema (users, charts, aiReadings, celebrities)
- [x] Design system (dark cosmic theme, fonts, colors)
- [x] Global layout with Navbar and Footer
- [x] Route setup with lazy loading

## Chart Calculation Engine
- [x] Astronomia ephemeris integration for planetary positions
- [x] Gate calculation from planetary longitude (I Ching wheel mapping)
- [x] Line, Color, Tone, Base calculation
- [x] Type determination (Manifestor, Generator, MG, Projector, Reflector)
- [x] Profile calculation (12 profiles)
- [x] Strategy determination
- [x] Authority determination (7 authorities)
- [x] Definition type (Single, Split, Triple Split, Quadruple Split, None)
- [x] Incarnation Cross calculation (Right Angle, Juxtaposition, Left Angle)
- [x] Variables (Digestion, Environment, Perspective, Awareness)
- [x] Personality (conscious) vs Design (unconscious) calculations
- [x] Design date calculation (88 degrees of Sun arc before birth)
- [x] Verified against reference data (Ra Uru Hu, Einstein)

## Interactive Bodygraph Visualization
- [x] SVG Bodygraph with all 9 centers (proper shapes)
- [x] All 36 channels rendered
- [x] All 64 gates with activation indicators
- [x] Color-coded defined vs undefined centers
- [x] Personality (dark) vs Design (red) activation coloring
- [x] Interactive hover/click handlers
- [x] Circuit highlighting (Individual, Tribal, Collective)
- [x] Responsive design for mobile and desktop

## Birth Data Input & Chart Generation
- [x] Birth date, time, and location input form
- [x] Location search via Nominatim geocoding
- [x] Timezone estimation from longitude
- [x] Chart generation and display

## Landing Page
- [x] Hero section with premium design
- [x] Features showcase grid
- [x] Five types section
- [x] CTA for chart generation

## Chart Results Page
- [x] Full Bodygraph visualization
- [x] Type, Strategy, Authority, Profile display
- [x] Definition type display
- [x] Incarnation Cross display
- [x] Variables display (Digestion, Environment, Perspective, Awareness)
- [x] Planetary activations table (Personality & Design)
- [x] Channels summary
- [x] Centers analysis (defined vs undefined)
- [x] Not-Self and Signature theme display
- [x] Detailed HD content descriptions for each element (from hdContent.ts)
- [x] Gate detail modal with I Ching hexagram

## Detailed HD Content Descriptions
- [x] Content data file created (shared/hdContent.ts)
- [x] Integrate content into chart results page
- [x] Gate detail view with I Ching hexagram
- [x] Channel detail view
- [x] Center detail view (defined/undefined meanings)
- [x] Type detail view
- [x] Profile detail view
- [x] Authority detail view

## User Dashboard & Chart Management
- [x] User authentication (Manus OAuth)
- [x] Dashboard with saved charts overview
- [x] Save charts with name and category
- [x] Delete saved charts with confirmation
- [x] Favorite/unfavorite charts
- [x] Chart organization by category

## LLM-Powered Interpretations
- [x] AI chart analysis with 9 reading types
- [x] Deep insights about type, strategy, profile
- [x] Gate and channel analysis
- [x] Life purpose based on incarnation cross
- [x] Career guidance
- [x] Variables analysis
- [x] AI readings saved to database

## Chart Comparison / Composite Charts
- [x] Two-chart input forms
- [x] Side-by-side Bodygraph display
- [x] Electromagnetic connections detection
- [x] Side-by-side comparison table

## Transit Features
- [x] Current planetary transits calculation
- [x] Transit gates display with planet symbols
- [x] Transit overlay on user's natal chart
- [ ] Daily transit notifications

## PDF Report Export
- [x] Professional PDF layout with chart data
- [ ] Bodygraph visualization in PDF
- [x] Detailed element descriptions

## Advanced Features
- [x] Celebrity chart database (20 celebrities)
- [x] I Ching Oracle with all 64 hexagrams
- [x] Return charts (Saturn, Chiron, Uranus, Solar) - ReturnChart page
- [ ] Gene Keys reference
- [x] Multi-language support (i18n with /cs/ and /en/ subpath routing)

## Premium UI & Polish
- [x] Dark cosmic premium theme
- [x] Responsive design (mobile + desktop)
- [x] Loading states
- [x] Error handling and empty states
- [x] Enhanced animations and micro-interactions (framer-motion)
- [x] Improved Bodygraph visual quality (unique center colors, glow effects, transit rendering)

## Czech Language Localization
- [x] Create Czech translation file for all UI strings
- [x] Translate Navbar, Footer, and layout components
- [x] Translate Home/Landing page
- [x] Translate ChartCalculator page
- [x] Translate ChartResult page
- [x] Translate Dashboard page
- [x] Translate ChartComparison page
- [x] Translate Transits page
- [x] Translate Celebrities page
- [x] Translate IChing page
- [x] Translate HD content descriptions (types, profiles, authorities, centers)
- [x] Translate AI reading prompts to generate Czech responses

## PDF Export
- [x] Client-side PDF generation with jsPDF
- [x] PDF layout with chart data (type, profile, authority, centers, channels, gates, variables)
- [x] Download button on ChartResult page

## Transit Overlay
- [x] Transit overlay on user's natal chart in Bodygraph
- [x] Transit page with user chart selection and Bodygraph overlay

## Tests
- [x] Calculator tests (9 tests - Ra Uru Hu, Einstein, types, planets, profiles, variables, design date, centers, cross)
- [x] Auth logout test
- [x] Transit calculation tests (3 tests)
- [x] Czech i18n translation tests (9 tests)
- [x] Chart calculation via router tests (2 tests)
- [x] Transit line calculation bug fix (clamped to 1-6)

## Light Theme Redesign
- [x] Switch entire theme from dark to light/white background
- [x] Update CSS variables in index.css for light theme
- [x] Update Navbar for light theme
- [x] Update Footer for light theme
- [x] Update Bodygraph SVG colors for light background
- [x] Update all page components for light theme compatibility
- [x] Update cosmic-card, cosmic bg classes for light theme

## Types Graphic Integration
- [x] Upload types graphic to S3 (5 types version generated)
- [x] Integrate graphic into Home page types section

## Czech Language Polish
- [x] Review and improve all Czech translations for natural language
- [x] Ensure humandesign.cz-style Czech terminology throughout

## Loading Animation Enhancement
- [x] Make loading animation bigger and thematic with moving HD Bodygraph/mandala pattern (HDLoader)
- [x] Create SVG type aura icons (TypeAuraIcon component)
- [x] Use type icons on Celebrities page
- [ ] Final Czech language audit — no English text remaining
- [x] Add celebrity photo thumbnails from Wikipedia

## Premium HD Features Implementation
- [x] Research top HD apps for feature list
- [x] Return charts (Solar Return, Saturn Return, Chiron Return, Uranus Opposition)
- [ ] Composite/Partnership charts (electromagnetic connections, compatibility)
- [ ] Advanced interactive Bodygraph (click centers/channels/gates for deep info)
- [x] Transit calendar with daily/weekly/monthly view (TransitCalendar page)
- [ ] Daily HD digest/notification
- [x] Nutrition/Digestion guidance based on Variables (PHS) (VariablesAnalysis page)
- [x] Environment guidance based on Variables (VariablesAnalysis page)
- [x] AI chat guide (conversational HD assistant) (AiGuide page)
- [x] Advanced PDF reports (light theme, multi-page, Czech)
- [x] Chart sharing (public link, social media)
- [x] Complete Gate encyclopedia (64 gates with I Ching) (Encyclopedia page)
- [x] Complete Channel encyclopedia (36 channels with circuit info) (Encyclopedia page)
- [x] Variable/Cognition deep analysis (VariablesAnalysis page with 4 tabs)
- [ ] Dream Rave chart
- [ ] Incarnation Cross deep analysis
- [ ] ahumandesign.cz-inspired presentation style

## Inkarnační Kříž — Detailní Analýza
- [ ] Vytvořit kompletní data pro všechny hlavní Inkarnační kříže (Right Angle, Left Angle, Juxtaposition)
- [ ] Stránka s detailní analýzou kříže — 4 brány, životní poslání, témata, výzvy
- [ ] AI generované čtení kříže pro konkrétní uživatelský chart
- [ ] Propojení ze stránky výsledků chartu
- [ ] Přidat do navigace

## Oprava angličtiny v ChartResult
- [x] Přeložit popisy typů v hdContent.ts do češtiny (TYPE_DESCRIPTIONS)
- [x] Přeložit popisy profilů v hdContent.ts do češtiny (PROFILE_DESCRIPTIONS)
- [x] Přeložit popisy autorit v hdContent.ts do češtiny (AUTHORITY_DESCRIPTIONS)
- [x] Přeložit názvy bran (gate names) do češtiny (GATE_DESCRIPTIONS)
- [x] Přidat CENTER_DESCRIPTIONS export (oprava chyby chybějícího exportu)
- [x] CENTER_DESCRIPTIONS přidan do hdContent.ts s českými popisy všech 9 center
- [ ] Přeložit inkarnační kříž sekci do češtiny
- [x] Přidat tlačítko pro stažení AI rozboru (.txt)

## Footer Partner Links
- [x] Přidat sekci "Další projekty" do footeru s odkazy: cajovny-praha.cz, katastr-online.cz, akcni-letenky.com
- [x] Přidat do footeru další projekty: do-italie.cz, amulets.cz, ohorai.com
- [x] Přeložit názvy inkarnačního kříže do češtiny (Levý/Pravý Úhlový Kříž, Juxtapoziční Kříž) v ChartResult i PDF
- [ ] Opravit PDF generování — česká diakritika (háčky/čárky) se zobrazuje špatně
- [ ] Přeložit inkarnační kříž do češtiny (Left Angle Cross → Levý Úhlový Kříž atd.)
- [x] Odstranit Ohorai z footeru
- [x] Opravit PDF — přepsáno na HTML print přístup (správná čeština, zalamování textu)

## Inkarnační Kříž — Detailní stránka s AI
- [ ] Server procedure pro AI výklad inkarnačního kříže (životní poslání, témata, výzvy, praktické rady)
- [ ] Stránka IncarnationCrossDetail s krásným UI a AI čtením
- [ ] Propojit z ChartResult — kliknutí na kříž otevře detailní stránku
- [ ] Přidat do navigace

## UI Redesign & AI Fix
- [x] Odstranit "Ahoj!" oslovení z AI výkladů (server/routers.ts)
- [x] Přepracovat Home stránku dle referenčního designu (hero, 5 ikon výhod, 5 typů s aurami, statistiky populace)

## Sdílení mapy & OG meta
- [x] DB tabulka shared_charts (token, chartData, expiresAt)
- [x] Server procedure: createShareToken, getSharedChart
- [x] Tlačítko "Sdílet mapu" na ChartResult stránce
- [x] Veřejná stránka /shared/:token zobrazující sdílený chart
- [x] OG meta description v češtině v index.html

## Velká implementace — všechna vylepšení
- [x] SEO: Dedikované stránky pro 5 typů (/types/generator, /types/manifesting-generator, /types/projector, /types/manifestor, /types/reflector) s CTA nahoru
- [x] SEO: JSON-LD structured data
- [x] SEO: sitemap.xml + robots.txt
- [ ] Mobilní hamburger navigace
- [ ] Page transition animace
- [ ] Dark mode přepínač
- [x] Blog sekce se starter články
- [ ] Onboarding flow pro nové uživatele

## SEO & Share Tests
- [x] Share link creation test (token generation)
- [x] Share link retrieval test (create + get)
- [x] Non-existent share token returns null
- [x] Sitemap.xml endpoint test (all pages included)
- [x] Robots.txt endpoint test (correct directives)

## Blog sekce — SEO články
- [x] Blog data model (static articles in shared/blogArticles.ts)
- [x] Server tRPC procedures for blog (list, getBySlug)
- [x] Blog list page (/blog) with article cards, categories, reading time
- [x] Blog article detail page (/blog/:slug) with full content, SEO meta, JSON-LD
- [x] 10 Czech SEO articles (types, strategies, authorities, profiles, centers, channels)
- [x] Blog integration into Navbar, Footer, sitemap.xml
- [x] Blog CTA on Home page
- [x] Blog tests (list, detail, SEO)

## Mobilní hamburger menu
- [x] Hamburger tlačítko v Navbar (viditelné pouze na mobile)
- [x] Slide-in drawer menu s kompletní navigací
- [x] Zavření menu kliknutím mimo nebo na křížek
- [x] Animace otevření/zavření

## Onboarding flow po výpočtu mapy
- [x] Onboarding modal/overlay po přesměrování na ChartResult
- [x] 3 kroky: "Váš typ", "Vaše autorita", "AI výklad"
- [x] Přeskočit / Další tlačítka
- [x] Uložit do localStorage (nezobrazovat znovu)

## Inkarnační kříž — detailní stránka s AI
- [ ] Stránka /cross/:crossName s detailní analýzou
- [ ] 4 brány kříže s popisem
- [ ] AI-generovaný výklad životního poslání
- [ ] Propojení z ChartResult (kliknutí na kříž)
- [ ] Přidat do navigace/sitemapy

## Hero pozadí animace
- [x] CSS keyframe animace pro barevné orby (pohyb, pulzování, rotace)
- [x] Plynná smyčka bez trhání
- [x] Respektovat prefers-reduced-motion

## Bug fix — AI výklad selector
- [x] Po spuštění AI výkladu zůstanou tlačítka výběru typu výkladu vždy viditelná

## Streaming AI výkladu + uložení + hodnocení
- [x] Streaming AI výkladu (token po tokenu) přes SSE endpoint
- [x] Uložení AI výkladu k uložené mapě v dashboardu (auto-save po dokončení streamu)
- [x] Hodnocení výkladu palcem nahoru/dolů
- [x] DB tabulka ai_readings (chartId, type, content, rating)
- [x] Abort controller pro přerušení streamu při změně typu výkladu

## Dashboard — Moje výklady + sdílení
- [x] Server procedure: getAllReadingsByUser (všechny výklady uživatele s info o mapě)
- [x] Server procedure: getReadingsByChart (výklady pro konkrétní mapu)
- [x] Záložka "Moje výklady" v dashboardu (seznam výkladů s typem, datem, hodnocením)
- [x] Kliknutí na výklad otevře detail s plným textem (rozbalit/sbalit)
- [x] Sdílení AI výkladu — tlačítko "Sdílet" vedle thumbs up/down (ChartResult + Dashboard)
- [x] Vylepšený dashboard — záložky "Moje mapy" a "Moje výklady"

## Denní tranzit na dashboardu
- [ ] Server procedure: getDailyTransit (aktuální planetární pozice + aktivované brány)
- [ ] Server procedure: getPersonalizedTransit (porovnání tranzitů s uživatelovou mapou)
- [ ] AI interpretace denního tranzitu pro konkrétní typ/profil uživatele
- [ ] DailyTransit widget na dashboardu (planetární pozice, aktivované brány, AI výklad)
- [ ] Bodygraph s tranzitním overlayem na dashboardu
- [ ] Zvýraznění "aktivovaných" kanálů (tranzit + natal = definovaný kanál)
- [ ] Datum a čas poslední aktualizace tranzitů
- [ ] Tlačítko pro refresh tranzitů
- [ ] Integrace do navigace dashboardu
- [ ] Testy pro personalizovaný tranzit

## Blog — navigace a náhledové obrázky
- [ ] Blog jako samostatné tlačítko v hlavní navigaci (vedle Encyklopedie)
- [ ] Odstranit Blog z "Prozkoumat" dropdown menu
- [ ] Přidat náhledové obrázky (coverImage) ke každému článku v blogArticles.ts
- [ ] Zobrazit náhledové obrázky v kartičkách na Blog stránce

## Blog — navigace a náhledové obrázky
- [x] Blog přesunut jako samostatné tlačítko v hlavní navigaci
- [x] Unsplash cover obrázky přidány ke všem 10 článkům
- [x] Blog list stránka zobrazuje obrázky (featured + grid)
- [x] BlogArticle stránka zobrazuje cover obrázek v záhlaví

## AI Guide stránka — redesign
- [x] Spirituální pozadí s ambientní animací (orby, částice, sacred geometry)
- [x] Levý panel s profilem uživatele (typ, strategie, autorita, profil, definice, centra, kanály)

## i18n Infrastructure & English Localization
- [x] Create English translation file (shared/i18n/en.ts)
- [x] Update useTranslation hook with language detection from URL
- [x] Create LanguageContext provider
- [x] Implement subpath routing (/cs/ and /en/ prefixes)
- [x] Root / redirect based on browser language preference
- [x] Translate Landing page (Home.tsx) to English
- [x] Translate Calculator page to English
- [x] Translate Chart Result page to English
- [x] Translate 5 Type pages to English
- [x] Add language switcher component in Navbar
- [x] Add hreflang tags to all pages (index.html + sitemap.xml)
- [x] Update sitemap.xml with bilingual URLs and hreflang alternates
- [x] Update OG meta tags for English pages
- [x] English AI Guide prompts (SSE + askGuide procedure)

## Blog Articles — English Translation (30 articles)
- [x] Translate all 10 existing Czech blog articles to English
- [x] Add 20 new English blog articles with long-tail SEO keywords
- [x] Add bilingual blog routing (/cs/blog vs /en/blog)
- [x] English blog articles in blogArticles.ts with lang field

## AI Guide — English Prompts
- [x] Translate all 9 AI reading type prompts to English
- [x] Language-aware prompt selection (EN/CS based on locale)
- [x] English system prompt for AI guide chat

## AI Guide Page — Visual Enhancement
- [x] Spiritual background with ambient animation (orbs, particles, mandala rings, star particles)
- [x] Left panel with user HD profile data (type, strategy, authority, profile, centers, channels)
- [x] Responsive layout: profile panel + chat area

## Cover Images for EN Blog Articles
- [x] Add Unsplash cover images to all 30 English blog articles (included in generation)

## PWA Support
- [x] PWA manifest.json with app metadata and icons
- [x] Service Worker for offline caching
- [x] Web app installable on mobile devices

## Encyclopedia & Dashboard — English Translation
- [x] Translate Encyclopedia page to English (locale-aware)
- [x] Translate Dashboard page to English (locale-aware)
