export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  category: "typy" | "strategie" | "autorita" | "profil" | "centra" | "zaklady" | "vztahy";
  categoryLabel: string;
  readingTime: number; // minutes
  publishedAt: string; // ISO date
  updatedAt: string;
  coverColor: string; // tailwind bg class
  coverIcon: string; // lucide icon name
  coverImage?: string; // URL to cover image
  tags: string[];
  content: string; // markdown
}

export const BLOG_CATEGORIES = [
  { key: "zaklady", label: "Základy HD", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "typy", label: "Typy", color: "bg-violet-100 text-violet-800 border-violet-200" },
  { key: "strategie", label: "Strategie", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "autorita", label: "Autorita", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "profil", label: "Profil", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { key: "centra", label: "Centra", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "vztahy", label: "Vztahy", color: "bg-pink-100 text-pink-800 border-pink-200" },
] as const;

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "co-je-human-design",
    title: "Co je Human Design? Kompletní průvodce pro začátečníky",
    metaTitle: "Co je Human Design? Kompletní průvodce pro začátečníky | 2026",
    metaDescription: "Zjistěte, co je Human Design systém, jak funguje a jak vám může pomoci lépe porozumět sobě. Kompletní průvodce pro začátečníky v češtině.",
    excerpt: "Human Design je revoluční systém sebepoznání, který kombinuje astrologii, I-Ťing, kabalu, čakrový systém a kvantovou fyziku. Zjistěte, jak vám může pomoci žít autentičtěji.",
    category: "zaklady",
    categoryLabel: "Základy HD",
    readingTime: 8,
    publishedAt: "2026-01-15",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-amber-50 to-orange-50",
    coverIcon: "Compass",
    coverImage: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80",
    tags: ["human design", "základy", "sebepoznání", "začátečníci"],
    content: `## Co je Human Design?

Human Design je unikátní systém sebepoznání, který vznikl v roce 1987, když kanadský fyzik **Ra Uru Hu** (vlastním jménem Robert Alan Krakower) zažil mystický zážitek na španělském ostrově Ibiza. Během osmi dní a nocí přijal informace, které později formuloval do komplexního systému mapujícího lidskou energetiku.

Systém kombinuje poznatky z několika starověkých i moderních disciplín:

- **Astrologie** — planetární pozice v okamžiku narození
- **I-Ťing** — starověký čínský systém 64 hexagramů
- **Kabala** — mystická tradice Stromu života
- **Čakrový systém** — hinduistická tradice energetických center
- **Kvantová fyzika** — moderní vědecké poznatky o neutrinech

## Jak Human Design funguje?

Na základě přesného data, času a místa narození se vypočítá vaše osobní **energetická mapa** (bodygraph). Tato mapa ukazuje:

**Váš typ** — existuje 5 základních typů (Manifestor, Generátor, Manifestující Generátor, Projektor a Reflektor), z nichž každý má svou jedinečnou strategii pro správné rozhodování.

**Vaši autoritu** — vnitřní kompas, který vám říká, jak dělat správná rozhodnutí. Může to být sakrální odezva, emocionální vlna, intuice sleziny nebo jiný mechanismus.

**Váš profil** — kombinace dvou čísel (např. 4/6), která popisuje vaši životní roli a způsob, jakým se učíte a interagujete se světem.

**Vaše definovaná a nedefinovaná centra** — 9 energetických center v těle, která určují, kde máte konzistentní energii a kde jste otevření vlivům okolí.

## Proč je Human Design užitečný?

Hlavní přínos Human Design spočívá v tom, že vám pomáhá:

1. **Porozumět své energii** — zjistíte, kdy a jak máte energii k dispozici
2. **Dělat správná rozhodnutí** — naučíte se používat svou vnitřní autoritu
3. **Přestat se srovnávat** — pochopíte, že každý typ funguje jinak
4. **Zlepšit vztahy** — porozumíte dynamice mezi různými typy
5. **Najít správnou práci** — zjistíte, jaký typ práce vám vyhovuje

## Jak začít s Human Design?

Prvním krokem je nechat si **vypočítat svou mapu**. K tomu potřebujete přesné datum, čas a místo narození. Čím přesnější čas, tím přesnější mapa — ideálně z rodného listu.

Po výpočtu mapy se zaměřte na tři základní informace:
- **Váš typ** a jeho strategie
- **Vaše autorita** pro rozhodování
- **Váš profil** pro pochopení životní role

Human Design není víra ani dogma — je to experiment. Ra Uru Hu vždy říkal: „Nevěřte mi, vyzkoušejte si to sami." Nejlepší způsob, jak ověřit platnost systému, je žít podle své strategie a autority po dobu alespoň 3-6 měsíců a pozorovat, co se změní.`,
  },
  {
    slug: "5-typu-human-design",
    title: "5 typů v Human Design: Který jste vy?",
    metaTitle: "5 typů v Human Design: Generátor, Projektor, Manifestor, Reflektor | Průvodce",
    metaDescription: "Poznejte všech 5 typů v Human Design — Generátor, Manifestující Generátor, Projektor, Manifestor a Reflektor. Zjistěte svůj typ a strategii.",
    excerpt: "V Human Design existuje 5 základních typů, z nichž každý má svou unikátní energetiku, strategii a roli ve světě. Zjistěte, který typ jste vy a jak žít v souladu se svou přirozeností.",
    category: "typy",
    categoryLabel: "Typy",
    readingTime: 10,
    publishedAt: "2026-01-20",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-violet-50 to-purple-50",
    coverIcon: "Users",
    coverImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    tags: ["typy", "generátor", "projektor", "manifestor", "reflektor"],
    content: `## Pět typů v Human Design

Typ je nejzákladnější informací ve vašem Human Design chartu. Určuje, jak vaše aura interaguje se světem a jaká je vaše správná strategie pro rozhodování. Existuje 5 typů:

## 1. Generátor (37% populace)

Generátoři jsou **životní silou planety**. Mají konzistentní přístup k sakrální energii, která jim dává obrovskou vytrvalost a pracovní kapacitu.

**Strategie:** Reagovat na život — čekat na podněty z okolí a reagovat na ně svým sakrálním centrem (pocit „aha" nebo „ne-e").

**Signatura:** Uspokojení — když Generátor dělá správnou práci, cítí hluboké uspokojení.

**Ne-self téma:** Frustrace — když iniciuje místo reagování nebo dělá špatnou práci.

Generátoři by měli čekat, až se jim něco ukáže, a pak reagovat. Neměli by iniciovat — to je role Manifestora. Když Generátor najde práci, která ho opravdu baví, je neúnavný.

## 2. Manifestující Generátor (33% populace)

Manifestující Generátoři jsou **hybridní typ** kombinující energii Generátora s průrazností Manifestora. Jsou nejrychlejší ze všech typů.

**Strategie:** Reagovat a informovat — nejprve reagují na podněty, pak informují okolí o svých záměrech.

**Signatura:** Uspokojení a mír.

**Ne-self téma:** Frustrace a hněv.

MG jsou multi-talentovaní lidé, kteří často dělají více věcí najednou. Přeskakují kroky a nacházejí zkratky. Je pro ně důležité naučit se informovat ostatní o tom, co dělají.

## 3. Projektor (20% populace)

Projektoři jsou **přirození průvodci a vůdci** nové éry. Nemají sakrální energii, ale mají unikátní schopnost vidět do systémů a lidí.

**Strategie:** Čekat na pozvání — pro důležitá životní rozhodnutí (práce, vztahy, bydlení) čekat na uznání a pozvání.

**Signatura:** Úspěch.

**Ne-self téma:** Hořkost — když dávají nevyžádané rady nebo nejsou uznáni.

Projektoři potřebují studovat systémy a lidi. Když jsou pozváni a uznáni, jejich moudrost je neocenitelná. Důležité je, aby nepracovali jako Generátoři — potřebují více odpočinku.

## 4. Manifestor (9% populace)

Manifestoři jsou **jediný typ, který může skutečně iniciovat**. Mají uzavřenou auru, která jim dává nezávislost.

**Strategie:** Informovat před akcí — ne žádat o svolení, ale dát ostatním vědět, co se chystají udělat.

**Signatura:** Mír.

**Ne-self téma:** Hněv — když jsou omezováni nebo kontrolováni.

Manifestoři jsou katalyzátoři změn. Přicházejí, spouštějí procesy a jdou dál. Jejich největší výzvou je naučit se informovat okolí, protože jejich uzavřená aura může vyvolávat strach u ostatních.

## 5. Reflektor (1% populace)

Reflektoři jsou **nejřidší typ** — tvoří pouhé 1% populace. Nemají žádné definované centrum, což z nich dělá dokonalé zrcadlo prostředí.

**Strategie:** Čekat na lunární cyklus — před důležitými rozhodnutími čekat 28 dní.

**Signatura:** Překvapení.

**Ne-self téma:** Zklamání.

Reflektoři jsou extrémně citliví na energie kolem sebe. Dokáží přesně odrážet zdraví komunity. Pro ně je klíčové najít správné prostředí a lidi.

## Jak zjistit svůj typ?

K zjištění svého typu potřebujete přesné datum, čas a místo narození. Typ se vypočítá na základě toho, která centra ve vašem bodygraphu jsou definovaná (obarvená) a která jsou otevřená (bílá).`,
  },
  {
    slug: "strategie-v-human-design",
    title: "Strategie v Human Design: Klíč ke správným rozhodnutím",
    metaTitle: "Strategie v Human Design: Reagovat, Informovat, Čekat na pozvání | Průvodce",
    metaDescription: "Naučte se svou strategii v Human Design. Reagovat, informovat, čekat na pozvání nebo lunární cyklus — klíč ke správným životním rozhodnutím.",
    excerpt: "Strategie je nejdůležitější praktický nástroj v Human Design. Říká vám, jak správně interagovat se světem a dělat rozhodnutí, která jsou v souladu s vaší přirozeností.",
    category: "strategie",
    categoryLabel: "Strategie",
    readingTime: 7,
    publishedAt: "2026-01-25",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
    coverIcon: "Target",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    tags: ["strategie", "rozhodování", "reagovat", "informovat", "pozvání"],
    content: `## Co je strategie v Human Design?

Strategie je praktický návod, jak správně interagovat se světem na základě vašeho typu. Je to nejdůležitější informace, kterou můžete z Human Design získat, protože přímo ovlivňuje kvalitu vašeho každodenního života.

Když žijete podle své strategie, zažíváte svou **signaturu** — pozitivní pocit, který signalizuje, že jste na správné cestě. Když strategii ignorujete, zažíváte **ne-self téma** — negativní pocit, který vás upozorňuje na odklon od vaší přirozenosti.

## Reagovat — strategie Generátora a MG

Pro Generátory a Manifestující Generátory (70% populace) je strategie **reagovat na život**. To znamená:

- **Neiniciovat** — nespouštět věci z hlavy, ale čekat na podněty z okolí
- **Naslouchat sakrální odezvě** — vnitřní pocit „aha/uhm" (ano) nebo „ne-e/uh-uh" (ne)
- **Dávat si otázky typu ano/ne** — sakrální centrum reaguje na jednoduché otázky

Prakticky to vypadá tak, že Generátor čeká, až se mu něco ukáže — nabídka práce, pozvání na schůzku, příležitost. Pak naslouchá svému sakrálnímu centru. Pokud cítí vzrušení a energii, je to „ano". Pokud cítí stažení, je to „ne".

**Příklad:** Místo toho, abyste aktivně hledali novou práci, dejte vědět okolí, že jste otevření novým příležitostem, a pak reagujte na to, co přijde.

## Informovat — strategie Manifestora

Manifestoři mají strategii **informovat před akcí**. To neznamená žádat o svolení — znamená to dát ostatním vědět, co se chystáte udělat.

Proč? Protože Manifestoři mají uzavřenou auru, která může vyvolávat odpor u ostatních. Když informují, snižují tento odpor a vytvářejí prostor pro hladký průběh svých iniciativ.

**Příklad:** Místo toho, abyste prostě odešli z práce, řeknete: „Chystám se odejít z práce a začít podnikat." Nežádáte o svolení — informujete.

## Čekat na pozvání — strategie Projektora

Projektoři mají strategii **čekat na pozvání** pro důležitá životní rozhodnutí — práci, vztahy, bydlení, velké životní změny.

To neznamená, že Projektor nemůže nic dělat. Může studovat, připravovat se, rozvíjet své dovednosti. Ale pro velká rozhodnutí by měl čekat, až bude uznán a pozván.

**Důležité:** Pozvání musí být skutečné a formální. „Pojď k nám pracovat" je pozvání. „Měl bys zkusit..." není pozvání.

**Příklad:** Projektor studuje koučink a buduje si reputaci. Když ho někdo osloví s nabídkou spolupráce — to je pozvání, na které čekal.

## Čekat na lunární cyklus — strategie Reflektora

Reflektoři mají nejdelší strategii — **čekat celý lunární cyklus** (přibližně 28 dní) před důležitými rozhodnutími.

Protože Reflektoři nemají žádné definované centrum, jejich zkušenost se mění den ode dne podle toho, jak Měsíc prochází jejich bodygraphem. Teprve po celém cyklu mají kompletní obraz.

**Příklad:** Reflektor dostane nabídku nové práce. Místo okamžité odpovědi si řekne: „Potřebuji měsíc na rozmyšlenou." Během 28 dní pozoruje, jak se cítí v různých dnech, a na konci cyklu má jasno.

## Jak začít žít podle strategie?

Začněte pomalu. Nevyžadujte od sebe dokonalost. Experiment se strategií je proces, který trvá měsíce až roky. Ra Uru Hu doporučoval minimálně **7 let dekondicionování** — ale první výsledky uvidíte mnohem dříve.

Nejdůležitější je všímat si, kdy zažíváte svou signaturu (uspokojení, mír, úspěch, překvapení) a kdy ne-self téma (frustrace, hněv, hořkost, zklamání). To vám ukáže, kde jste na správné cestě a kde ne.`,
  },
  {
    slug: "autorita-v-human-design",
    title: "Autorita v Human Design: Jak dělat správná rozhodnutí",
    metaTitle: "Autorita v Human Design: Emocionální, Sakrální, Slezinová | Průvodce rozhodování",
    metaDescription: "Zjistěte svou autoritu v Human Design — emocionální, sakrální, slezinovou, ego, self nebo lunární. Naučte se dělat rozhodnutí v souladu se svou přirozeností.",
    excerpt: "Autorita v Human Design určuje váš vnitřní rozhodovací mechanismus. Není to mysl — je to tělesná inteligence, která vám říká, co je pro vás správné.",
    category: "autorita",
    categoryLabel: "Autorita",
    readingTime: 9,
    publishedAt: "2026-02-01",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
    coverIcon: "Brain",
    coverImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80",
    tags: ["autorita", "rozhodování", "emocionální", "sakrální", "slezina"],
    content: `## Co je autorita v Human Design?

Autorita je váš vnitřní rozhodovací mechanismus — říká vám, **jak** dělat rozhodnutí. Zatímco strategie říká **kdy** a **jakým způsobem** interagovat se světem, autorita říká, jak poznat, co je pro vás správné.

Klíčový princip: **Mysl není autorita.** Mysl je skvělý nástroj pro analýzu, učení a komunikaci, ale není spolehlivým průvodcem pro osobní rozhodnutí. Autorita je vždy tělesná — je to inteligence vašeho těla.

## Emocionální autorita (Solar Plexus)

Nejčastější autorita — má ji přibližně **50% populace**. Pokud máte definované emocionální centrum (Solar Plexus), je to vaše autorita bez ohledu na cokoliv jiného.

**Jak funguje:** Emocionální autorita pracuje ve vlnách. Nikdy nedělejte důležitá rozhodnutí v emocionálním vrcholu (nadšení) ani v údolí (smutek). Čekejte, až se vlna uklidní a dosáhnete **emocionální jasnosti**.

**Praktický tip:** Když vás něco nadchne, řekněte si: „Přespím to." Počkejte alespoň přes noc, ideálně několik dní. Pokud po odeznění emoční vlny stále cítíte, že je to správné, je to vaše odpověď.

**Mantra:** „V tomto okamžiku nemám pravdu. Pravda se odhalí časem."

## Sakrální autorita

Druhou nejčastější autoritu mají **Generátoři a MG bez definovaného emocionálního centra**. Sakrální centrum komunikuje prostřednictvím zvuků a pocitů.

**Jak funguje:** Sakrální centrum reaguje na podněty zvuky — „aha/uhm" (ano) nebo „uh-uh/ne-e" (ne). Je to okamžitá, instinktivní reakce, která přichází z břicha.

**Praktický tip:** Nechte se ptát otázkami typu ano/ne. Sakrální centrum reaguje na konkrétní podněty, ne na abstraktní myšlenky. „Chceš jít na tu schůzku?" je lepší než „Co si myslíš o té schůzce?"

**Mantra:** „Moje tělo ví. Naslouchám svému sakrálnímu zvuku."

## Slezinová (splenická) autorita

Tuto autoritu mají lidé s **definovanou slezinou, ale bez definovaného emocionálního a sakrálního centra** — typicky Projektoři a Manifestoři.

**Jak funguje:** Slezina komunikuje prostřednictvím okamžité intuice — tichý, jemný hlas, který mluví pouze jednou. Je to nejstarší forma vědomí v těle, spojená s přežitím a instinktem.

**Praktický tip:** Naučte se naslouchat prvnímu impulzu. Slezina nemluví dvakrát. Pokud cítíte jemné „ne" nebo „pozor", důvěřujte tomu, i když to logicky nedává smysl.

**Mantra:** „Důvěřuji svému prvnímu impulzu. Moje intuice mě chrání."

## Ego autorita (Srdce/Vůle)

Vzácnější autorita spojená s **definovaným ego/srdečním centrem**. Existuje ve dvou variantách — ego manifestovaná (pro Manifestory) a ego projektovaná (pro Projektory).

**Jak funguje:** Rozhodnutí vycházejí z toho, co opravdu chcete — z vaší vůle a touhy. Otázka zní: „Je to něco, co opravdu chci? Stojí mi to za to?"

## Self-projektovaná autorita

Velmi vzácná autorita pro **Projektory bez definovaného emocionálního, sakrálního, slezinového a ego centra**. Rozhodnutí přicházejí skrze G centrum — centrum identity a směru.

**Jak funguje:** Mluvte o svých rozhodnutích nahlas s důvěryhodnými lidmi. Naslouchejte tomu, co říkáte — ne co si myslíte. Vaše pravda se odhalí skrze váš hlas.

## Lunární autorita (Reflektoři)

Výhradně pro **Reflektory**. Rozhodnutí vyžadují celý lunární cyklus (28 dní).

**Jak funguje:** Během 28 dní Měsíc projde celým vaším bodygraphem a postupně definuje různá centra. Teprve po celém cyklu máte kompletní perspektivu.

## Žádná autorita (Mentální Projektoři)

Nejřidší forma — pro Projektory, kteří nemají žádné definované centrum pod hrdlem. Jejich autorita je **prostředí** — potřebují být ve správném prostředí a mluvit s důvěryhodnými lidmi.`,
  },
  {
    slug: "profily-v-human-design",
    title: "12 profilů v Human Design: Vaše životní role",
    metaTitle: "12 profilů v Human Design: 1/3, 2/4, 3/5, 4/6 a další | Kompletní průvodce",
    metaDescription: "Poznejte svůj profil v Human Design. 12 kombinací od 1/3 po 6/2 — zjistěte svou životní roli, způsob učení a interakce se světem.",
    excerpt: "Profil v Human Design popisuje vaši životní roli — jak se učíte, jak interagujete s ostatními a jaký je váš životní příběh. Existuje 12 profilů, každý s unikátní kombinací dvou linií.",
    category: "profil",
    categoryLabel: "Profil",
    readingTime: 11,
    publishedAt: "2026-02-05",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-rose-50 to-pink-50",
    coverIcon: "Fingerprint",
    coverImage: "https://images.unsplash.com/photo-1545987796-200677ee1011?w=800&q=80",
    tags: ["profil", "životní role", "linie", "profily", "design"],
    content: `## Co je profil v Human Design?

Profil je kombinace dvou čísel (např. 4/6), která popisuje vaši **životní roli** — jak se učíte, jak interagujete se světem a jaký je váš životní příběh. První číslo je vaše **vědomá** stránka (osobnost), druhé je **nevědomá** (design).

Profil se skládá ze šesti linií, z nichž každá má svou charakteristiku:

## Šest linií

**Linie 1 — Zkoumatel:** Potřebuje pevný základ. Zkoumá, studuje, hledá jistotu skrze znalosti. Bez pevného základu se cítí nejistě.

**Linie 2 — Poustevník:** Přirozený talent, který potřebuje být „zavolán". Má vrozené dary, které si často neuvědomuje. Potřebuje čas o samotě.

**Linie 3 — Mučedník/Experimentátor:** Učí se metodou pokus-omyl. Život je série experimentů. Co nefunguje, odpadne. Co funguje, zůstane.

**Linie 4 — Oportunista:** Síla je v síti vztahů. Příležitosti přicházejí skrze lidi, které zná. Potřebuje pevný základ blízkých vztahů.

**Linie 5 — Heretik:** Univerzální projekční pole — ostatní do něj projektují svá očekávání. Praktický řešitel problémů. Může být vnímán jako spasitel i hříšník.

**Linie 6 — Vzor:** Tři fáze života: do 30 let experimentuje (jako linie 3), 30-50 let pozoruje „ze střechy", po 50 se stává živým příkladem.

## 12 profilů

### Profil 1/3 — Zkoumatel / Experimentátor
Kombinace hloubkového výzkumu a praktického experimentování. Tito lidé potřebují nejprve věci důkladně prozkoumat a pak si je vyzkoušet v praxi. Jsou to přirození vědci života.

### Profil 1/4 — Zkoumatel / Oportunista
Hluboké znalosti sdílené skrze síť vztahů. Tito lidé se stávají autoritami ve svém oboru a šíří své poznatky skrze osobní kontakty.

### Profil 2/4 — Poustevník / Oportunista
Přirozený talent, který je „zavolán" skrze svou síť. Potřebují čas o samotě k rozvoji svých darů, ale jejich vliv se šíří skrze vztahy.

### Profil 2/5 — Poustevník / Heretik
Přirozený talent s univerzálním dopadem. Jsou voláni k řešení problémů, ale potřebují si chránit svůj osobní prostor.

### Profil 3/5 — Experimentátor / Heretik
Životní experimentátoři, jejichž zkušenosti mají univerzální hodnotu. Jejich „chyby" se stávají moudrými lekcemi pro ostatní.

### Profil 3/6 — Experimentátor / Vzor
Intenzivní experimentování v první polovině života, které se postupně proměňuje v moudrost a životní příklad.

### Profil 4/6 — Oportunista / Vzor
Vliv skrze síť vztahů, který se postupně prohlubuje. Ve zralém věku se stávají respektovanými vzory ve své komunitě.

### Profil 4/1 — Oportunista / Zkoumatel
Pevný základ znalostí sdílený skrze osobní vztahy. Jsou to spolehliví lidé, kteří kombinují hloubku s osobním přístupem.

### Profil 5/1 — Heretik / Zkoumatel
Praktičtí řešitelé problémů s hlubokým zázemím znalostí. Ostatní do nich projektují očekávání, ale oni mají pevný základ, na kterém stojí.

### Profil 5/2 — Heretik / Poustevník
Univerzální řešitelé s přirozeným talentem. Jsou voláni k řešení problémů, ale potřebují si chránit svůj čas o samotě.

### Profil 6/2 — Vzor / Poustevník
Tři fáze života vedoucí k moudrosti. Přirozený talent, který se postupně stává živým příkladem pro ostatní.

### Profil 6/3 — Vzor / Experimentátor
Nejintenzivnější životní cesta. Dvojitá zkušenost experimentování (linie 3 + první fáze linie 6) vede k hluboké životní moudrosti.

## Jak pracovat se svým profilem?

Profil není něco, co „děláte" — je to něco, čím **jste**. Nejdůležitější je pochopit svou přirozenou tendenci a přestat se za ni odsuzovat. Pokud jste 3/5, vaše „chyby" nejsou selhání — jsou to cenné experimenty.`,
  },
  {
    slug: "9-center-v-human-design",
    title: "9 center v Human Design: Definovaná vs. otevřená",
    metaTitle: "9 center v Human Design: Hlava, Ajna, Hrdlo, G, Srdce, Sakrální, Solar Plexus, Slezina, Kořen",
    metaDescription: "Poznejte všech 9 center v Human Design bodygraphu. Zjistěte rozdíl mezi definovanými a otevřenými centry a jak ovlivňují váš život.",
    excerpt: "V Human Design bodygraphu je 9 energetických center. Definovaná centra představují vaši konzistentní energii, otevřená centra jsou místa, kde přijímáte a zesilujete energie okolí.",
    category: "centra",
    categoryLabel: "Centra",
    readingTime: 10,
    publishedAt: "2026-02-10",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-orange-50 to-amber-50",
    coverIcon: "CircleDot",
    coverImage: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80",
    tags: ["centra", "bodygraph", "definovaná", "otevřená", "energie"],
    content: `## 9 center v Human Design

Bodygraph obsahuje 9 energetických center, která odpovídají čakrovému systému (s tím rozdílem, že Human Design pracuje s 9 centry místo tradičních 7). Každé centrum má svou specifickou funkci a téma.

## Definovaná vs. otevřená centra

**Definované centrum** (obarvené) = konzistentní energie. Tady máte spolehlivý přístup k určitému typu energie. Je to vaše „pevná půda".

**Otevřené centrum** (bílé) = přijímající energie. Tady přijímáte a zesilujete energie okolí. Je to místo moudrosti, ale také potenciálního kondicionování.

## Hlava (korunní centrum)

**Téma:** Inspirace, mentální tlak, otázky

**Definovaná:** Konzistentní zdroj inspirace a mentálních otázek. Inspirujete ostatní svými myšlenkami.

**Otevřená:** Přijímáte inspiraci odevšad. Nebezpečí: snažit se zodpovědět otázky, které nejsou vaše. Moudrost: rozlišit, které otázky stojí za přemýšlení.

## Ajna (mentální centrum)

**Téma:** Konceptualizace, zpracování informací, názory

**Definovaná:** Konzistentní způsob myšlení a zpracování informací. Máte pevné názory a mentální procesy.

**Otevřená:** Flexibilní myšlení — vidíte věci z mnoha úhlů. Nebezpečí: předstírat jistotu v názorech. Moudrost: být otevřený různým perspektivám.

## Hrdlo

**Téma:** Komunikace, manifestace, vyjádření

**Definované:** Konzistentní způsob komunikace a vyjadřování. Vaše slova mají přirozený dopad.

**Otevřené:** Přizpůsobivý komunikační styl. Nebezpečí: mluvit, abyste na sebe upozornili. Moudrost: mluvit, když je to skutečně potřeba.

## G centrum (centrum identity)

**Téma:** Identita, směr, láska, životní cesta

**Definované:** Pevný pocit identity a směru. Víte, kdo jste a kam jdete.

**Otevřené:** Proměnlivý pocit identity — závisí na prostředí a lidech kolem vás. Nebezpečí: hledat identitu mimo sebe. Moudrost: užívat si rozmanitost identit.

## Srdce (ego centrum)

**Téma:** Vůle, hodnota, materiální svět, sliby

**Definované:** Konzistentní přístup k vůli a odhodlání. Schopnost dávat a dodržovat sliby.

**Otevřené:** Proměnlivá vůle. Nebezpečí: dokazovat svou hodnotu a dávat sliby, které nemůžete dodržet. Moudrost: poznat, že vaše hodnota není v tom, co děláte.

## Sakrální centrum

**Téma:** Životní síla, sexualita, práce, vytrvalost

**Definované:** Obrovský zdroj životní energie (pouze Generátoři a MG). Konzistentní pracovní kapacita.

**Otevřené:** Přijímáte a zesilujete sakrální energii okolí. Nebezpečí: nevědět, kdy přestat pracovat. Moudrost: poznat, kdy je dost.

## Solar Plexus (emocionální centrum)

**Téma:** Emoce, pocity, nálady, emocionální vlny

**Definované:** Konzistentní emocionální vlny — máte svůj vlastní emocionální rytmus. Vaše autorita pro rozhodování.

**Otevřené:** Přijímáte a zesilujete emoce okolí. Nebezpečí: myslet si, že cizí emoce jsou vaše. Moudrost: rozlišit vlastní a cizí emoce.

## Slezina (splenické centrum)

**Téma:** Intuice, přežití, zdraví, čas, strach

**Definovaná:** Konzistentní přístup k intuici a instinktu. Spolehlivý vnitřní alarm pro nebezpečí.

**Otevřená:** Zesilujete strachy a zdravotní obavy okolí. Nebezpečí: držet se věcí, které vám neprospívají. Moudrost: pustit to, co vám neslouží.

## Kořen (kořenové centrum)

**Téma:** Adrenální tlak, stres, pohon, palivo

**Definovaný:** Konzistentní přístup ke stresu a tlaku. Umíte pracovat pod tlakem.

**Otevřený:** Přijímáte a zesilujete stres okolí. Nebezpečí: spěchat, abyste se zbavili tlaku. Moudrost: poznat, že ne každý tlak vyžaduje okamžitou akci.

## Praktický tip

Podívejte se na svá otevřená centra — tam jste nejvíce ovlivňováni okolím. Otevřená centra nejsou slabost — jsou to místa potenciální moudrosti. Klíčem je uvědomění: „Tohle není moje energie, ale energie, kterou přijímám."`,
  },
  {
    slug: "generator-strategie-reagovat",
    title: "Generátor: Jak správně reagovat na život",
    metaTitle: "Generátor v Human Design: Strategie reagování | Praktický průvodce",
    metaDescription: "Jste Generátor v Human Design? Naučte se správně reagovat na život, naslouchat sakrální odezvě a najít práci, která vás naplňuje.",
    excerpt: "Generátoři tvoří 37% populace a jejich strategie je reagovat na život. Jak ale poznat správnou sakrální odezvu? A co dělat, když se cítíte frustrovaní?",
    category: "strategie",
    categoryLabel: "Strategie",
    readingTime: 7,
    publishedAt: "2026-02-15",
    updatedAt: "2026-03-01",
     coverColor: "bg-gradient-to-br from-amber-50 to-yellow-50",
    coverIcon: "Zap",
    coverImage: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80",
    tags: ["generátor", "reagovat", "sakrální centrum", "strategie"],
    content: `## Generátor a umění reagování

Jako Generátor máte přístup k nejmocnější energii v Human Design — **sakrální energii**. Je to motor, který vám dává vytrvalost, pracovní kapacitu a životní sílu. Ale tato energie má svá pravidla.

## Proč neiniciovat?

Největší chybou Generátora je **iniciování** — spouštění věcí z hlavy, bez sakrální odezvy. Když Generátor iniciuje, často skončí v práci nebo situaci, která ho nenaplňuje, a výsledkem je frustrace.

Iniciování vypadá takto:
- „Měl bych si najít novou práci" (rozhodnutí z hlavy)
- „Založím si firmu, protože to dělají všichni" (kopírování)
- „Musím něco změnit" (tlak, ne odezva)

Reagování vypadá takto:
- Kamarád vám řekne o pozici a vy cítíte vzrušení v břiše
- Vidíte inzerát a vaše tělo řekne „aha!"
- Někdo vás pozve na workshop a cítíte energii

## Jak poznat sakrální odezvu?

Sakrální centrum komunikuje prostřednictvím:

**Zvuků:** „Aha", „uhm", „mm-hmm" (ano) nebo „uh-uh", „ne-e", „hmm" (ne). Tyto zvuky přicházejí spontánně, bez přemýšlení.

**Pocitů v břiše:** Pocit otevření, vzrušení, energie (ano) nebo stažení, těžkosti, odporu (ne).

**Energie:** Cítíte se energizovaní a připravení (ano) nebo vyčerpaní a bez chuti (ne).

## Praktická cvičení

**1. Nechte se ptát:** Požádejte partnera nebo přítele, aby vám pokládal otázky typu ano/ne. „Chceš dnes vařit?" „Chceš jít na procházku?" Naslouchejte první reakci svého těla.

**2. Všímejte si reakcí:** Během dne si všímejte, na co vaše tělo reaguje pozitivně a na co negativně. Zapisujte si to.

**3. Respektujte „ne":** Když vaše sakrální centrum řekne „ne", respektujte to. I když to logicky nedává smysl. Vaše tělo ví víc než vaše mysl.

## Co dělat s frustrací?

Frustrace je **ne-self téma** Generátora — signál, že něco není v pořádku. Frustrace není nepřítel — je to průvodce.

Když cítíte frustraci, zeptejte se:
- Dělám práci, na kterou jsem reagoval/a, nebo kterou jsem inicioval/a?
- Ignoruji své sakrální „ne"?
- Jsem v situaci, kde nemůžu reagovat?

Frustrace často znamená, že jste v nesprávné práci, vztahu nebo situaci. Řešením není „snažit se víc", ale **vrátit se k reagování**.

## Generátor a práce

Pro Generátora je práce klíčová — sakrální centrum je motor, který potřebuje být správně využit. Když Generátor dělá práci, která ho baví, je **neúnavný**. Když dělá špatnou práci, je vyčerpaný.

Správná práce pro Generátora je taková, na kterou reagoval sakrálním „ano". Nemusí to být „vysněná práce" — může to být cokoliv, co vás energizuje.

**Důležité:** Generátor by měl jít spát, až když je sakrálně vyčerpaný — to znamená, že využil svou energii správně. Pokud jde spát s nevyužitou energií, bude mít problémy s usínáním.`,
  },
  {
    slug: "projektor-cekat-na-pozvani",
    title: "Projektor: Umění čekat na pozvání",
    metaTitle: "Projektor v Human Design: Strategie čekání na pozvání | Praktický průvodce",
    metaDescription: "Jste Projektor v Human Design? Naučte se čekat na pozvání, rozpoznat správné uznání a vyhnout se hořkosti. Praktický průvodce pro Projektory.",
    excerpt: "Projektoři jsou přirození průvodci a vůdci, ale jejich strategie čekání na pozvání bývá nejnáročnější. Jak poznat správné pozvání a co dělat mezitím?",
    category: "strategie",
    categoryLabel: "Strategie",
    readingTime: 8,
    publishedAt: "2026-02-20",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-violet-50 to-indigo-50",
    coverIcon: "Eye",
    coverImage: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
    tags: ["projektor", "pozvání", "uznání", "strategie", "průvodce"],
    content: `## Projektor — průvodce nové éry

Projektoři tvoří 20% populace a jsou navrženi jako **průvodci, vůdci a správci energie**. Nemají konzistentní sakrální energii, ale mají něco, co ostatní typy nemají — schopnost hluboce vidět do systémů a lidí.

Vaše aura je **zaměřená a pronikavá**. Když se na někoho podíváte, vidíte ho do hloubky. To je váš dar — ale také důvod, proč potřebujete pozvání.

## Proč čekat na pozvání?

Vaše pronikavá aura může být pro ostatní intenzivní. Když dáváte nevyžádané rady nebo se snažíte vést bez pozvání, lidé to vnímají jako vtíravost — i když máte pravdu.

Pozvání je **uznání vaší hodnoty**. Když vás někdo pozve, říká tím: „Vidím tě. Respektuji tvou moudrost. Chci tvůj vhled."

## Co je a co není pozvání?

**Skutečné pozvání:**
- „Chtěl/a bych, abys u nás pracoval/a"
- „Mohl/a bys mi poradit s..."
- „Chceš se ke mně nastěhovat?"
- „Pojď s námi na cestu"

**Není pozvání:**
- „Měl/a bys zkusit..." (rada, ne pozvání)
- „Co si myslíš o..." (zdvořilost, ne skutečný zájem)
- Obecné inzeráty (nejsou osobní)

**Důležité:** Pozvání se týká **velkých životních rozhodnutí** — práce, vztahy, bydlení, velké projekty. V běžném životě (co si dát k obědu, kam jít na procházku) pozvání nepotřebujete.

## Co dělat, než přijde pozvání?

Čekání na pozvání **neznamená pasivitu**. Znamená to:

**1. Studujte systémy:** Projektoři jsou navrženi k tomu, aby rozuměli systémům — lidem, organizacím, procesům. Čím víc toho víte, tím hodnotnější je vaše pozvání.

**2. Budujte si reputaci:** Sdílejte své znalosti (blog, sociální sítě, přednášky). Když lidé vidí vaši moudrost, pozvání přijdou přirozeně.

**3. Odpočívejte:** Bez sakrální energie potřebujete více odpočinku než Generátoři. Nepracujte 8 hodin denně jako oni — najděte svůj rytmus.

**4. Buďte viditelní:** Pozvání nemůže přijít, pokud o vás nikdo neví. Buďte ve správných komunitách, navazujte vztahy.

## Hořkost — signál odklonu

Hořkost je ne-self téma Projektora. Přichází, když:
- Dáváte nevyžádané rady a nikdo vás neposlouchá
- Pracujete příliš tvrdě bez uznání
- Přijmete špatné pozvání (z nouze, ne z uznání)
- Srovnáváte se s Generátory

Hořkost vám říká: „Vrať se ke své strategii. Čekej na správné pozvání."

## Projektor a energie

Jako Projektor nemáte konzistentní sakrální energii. To neznamená, že nemáte žádnou energii — ale vaše energie funguje jinak:

- **Pracujte v kratších blocích** s přestávkami
- **Jděte spát před vyčerpáním** — ideálně si lehněte dříve a čtěte si
- **Vybírejte si prostředí** — jste citliví na energie kolem sebe
- **Nepracujte jako Generátoři** — vaše síla je v efektivitě, ne v kvantitě

## Projektor ve vztazích

Ve vztazích potřebujete partnera, který vás **vidí a uznává**. Nejlepší kombinace je často Projektor + Generátor — Projektor vede, Generátor realizuje. Ale klíčové je vzájemné uznání a respekt.`,
  },
  {
    slug: "human-design-a-vztahy",
    title: "Human Design a vztahy: Jak porozumět partnerské dynamice",
    metaTitle: "Human Design a vztahy: Kompatibilita typů, elektromagnetické spojení | Průvodce",
    metaDescription: "Zjistěte, jak Human Design ovlivňuje vaše vztahy. Kompatibilita typů, elektromagnetické spojení, kompromisní kanály a tipy pro harmonický vztah.",
    excerpt: "Human Design nabízí fascinující pohled na vztahovou dynamiku. Zjistěte, jak různé typy interagují, co jsou elektromagnetická spojení a jak vytvořit harmonický vztah.",
    category: "vztahy",
    categoryLabel: "Vztahy",
    readingTime: 9,
    publishedAt: "2026-02-25",
    updatedAt: "2026-03-01",    coverColor: "bg-gradient-to-br from-pink-50 to-rose-50",
    coverIcon: "Heart",
    coverImage: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&q=80",
    tags: ["vztahy", "kompatibilita", "elektromagnetické spojení", "partnerské charty"],content: `## Human Design a vztahy

Jednou z nejfascinujících aplikací Human Design je porozumění vztahové dynamice. Když položíte dva bodygraphy vedle sebe, uvidíte, jak se dvě energie vzájemně ovlivňují — kde se doplňují, kde si konkurují a kde vznikají nové kvality.

## Composite chart — společná mapa

Když se dva lidé setkají, jejich aury se prolínají a vzniká **composite chart** — společná energetická mapa. V této mapě:

- **Elektromagnetická spojení** — když jeden člověk má jednu bránu kanálu a druhý má druhou bránu, vzniká elektromagnetické přitahování. Je to silná přitažlivost, která vytváří novou kvalitu, kterou žádný z partnerů nemá sám.

- **Kompromisní kanály** — když oba partneři mají stejný celý kanál, musí se naučit sdílet tuto energii. Může to vést ke konkurenci nebo k hlubokému porozumění.

- **Dominance** — když jeden partner definuje centrum, které je u druhého otevřené, vzniká dynamika, kde definovaný partner „kondicionuje" otevřeného.

## Dynamika mezi typy

### Generátor + Generátor
Dva Generátoři spolu mají obrovskou energii. Výzva: oba potřebují reagovat, nikdo neiniciuje. Řešení: vytvářet si navzájem podněty k reagování.

### Generátor + Projektor
Klasická a často velmi funkční kombinace. Projektor vidí, jak nejlépe využít energii Generátora. Generátor poskytuje energii pro realizaci. Klíč: Generátor musí Projektora uznávat a zvát.

### Generátor + Manifestor
Dynamická kombinace. Manifestor iniciuje, Generátor reaguje a realizuje. Výzva: Manifestor musí informovat, Generátor nesmí být jen „dělník".

### Projektor + Projektor
Dva průvodci bez sakrální energie. Hluboké porozumění, ale potřebují Generátory ve svém okolí pro energii. Klíč: vzájemné uznání a respekt.

### Manifestor + Manifestor
Dva nezávislí iniciátoři. Může být výbušné i inspirativní. Klíč: respektovat nezávislost druhého a informovat se navzájem.

### Reflektor + jakýkoliv typ
Reflektor zrcadlí partnera. Je důležité, aby Reflektor měl prostor pro svou proměnlivost a nebyl tlač
en do jedné role.

## Otevřená centra ve vztazích

Otevřená centra jsou místa, kde jsme nejvíce ovlivňováni partnerem. Pokud máte otevřené emocionální centrum a váš partner ho má definované, budete přijímat a zesilovat jeho emoce. To může být krásné i náročné.

**Tip:** Uvědomte si, která centra máte otevřená a která má partner definovaná. Tam, kde je váš partner definovaný a vy otevření, budete přijímat jeho energii. To není špatné — ale je důležité to vědět.

## Praktické tipy pro vztahy

1. **Respektujte strategii partnera** — pokud je váš partner Generátor, nechte ho reagovat. Pokud je Projektor, zvěte ho a uznávejte.

2. **Komunikujte o svých potřebách** — každý typ má jiné energetické potřeby. Generátor potřebuje práci, Projektor odpočinek, Manifestor svobodu.

3. **Nesrovnávejte se** — různé typy fungují různě. Projektor nikdy nebude mít energii Generátora a to je v pořádku.

4. **Vytvořte si společný composite chart** — podívejte se, kde se doplňujete a kde jsou potenciální třecí plochy.

5. **Dejte si prostor** — každý potřebuje čas sám se sebou, zejména pro „dekondicionování" od partnerovy energie.`,
  },
  {
    slug: "inkarnacni-kriz-zivotni-ucel",
    title: "Inkarnační kříž: Váš životní účel v Human Design",
    metaTitle: "Inkarnační kříž v Human Design: Životní účel a poslání | Průvodce",
    metaDescription: "Zjistěte, co je inkarnační kříž v Human Design a jak odhaluje váš životní účel. Pravý úhlový, levý úhlový a juxtapoziční kříž vysvětleny.",
    excerpt: "Inkarnační kříž je nejhlubší vrstvou Human Design — odhaluje váš životní účel a téma, se kterým jste přišli na svět. Zjistěte, co váš kříž znamená.",
    category: "zaklady",
    categoryLabel: "Základy HD",
    readingTime: 8,
    publishedAt: "2026-03-01",
    updatedAt: "2026-03-03",
    coverColor: "bg-gradient-to-br from-teal-50 to-cyan-50",
    coverIcon: "Star",
    coverImage: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
    tags: ["inkarnační kříž", "životní účel", "brány", "poslání", "slunce"],
    content: `## Co je inkarnační kříž?

Inkarnační kříž je **životní téma** — účel, se kterým jste přišli na svět. Je tvořen čtyřmi bránami vašeho vědomého a nevědomého Slunce a Země:

- **Vědomé Slunce** (osobnostní) — vaše hlavní životní téma
- **Vědomá Země** — základ a ukotvení
- **Nevědomé Slunce** (designové) — nevědomá životní síla
- **Nevědomá Země** — nevědomý základ

Tyto čtyři brány tvoří kříž, který definuje 70% vaší energetické mapy.

## Tři typy křížů

### Pravý úhlový kříž (Right Angle Cross)
**Osobní osud.** Lidé s pravým úhlovým křížem mají osobní životní cestu. Jejich účel se naplňuje skrze jejich vlastní zkušenosti a rozhodnutí. Nemusí hledat svůj účel — žijí ho tím, že jsou sami sebou.

### Juxtapoziční kříž
**Fixní osud.** Nejřidší typ kříže. Lidé s juxtapozičním křížem mají velmi specifickou životní cestu s malým prostorem pro odchylky. Jsou jako laser — zaměření na jedno téma.

### Levý úhlový kříž (Left Angle Cross)
**Transpersonální osud.** Lidé s levým úhlovým křížem naplňují svůj účel skrze interakce s ostatními. Jejich životní téma se odhaluje ve vztazích a setkáních s lidmi.

## Jak žít svůj inkarnační kříž?

Inkarnační kříž není něco, co musíte „dělat" — je to něco, co se **přirozeně projeví**, když žijete podle své strategie a autority. Ra Uru Hu říkal, že inkarnační kříž se plně projeví až po letech života v souladu se svým designem.

**Důležité:** Nezaměřujte se na kříž jako na první věc. Nejprve se naučte žít podle své strategie a autority. Kříž se odhalí sám.

## Příklady inkarnačních křížů

**Pravý úhlový kříž plánování (brány 40-37-16-9):** Téma péče o komunitu, vytváření dohod a správa zdrojů pro blaho skupiny.

**Pravý úhlový kříž sfingu (brány 1-2-13-7):** Téma sebevyjádření, směru a vedení. Lidé s tímto křížem jsou přirození vůdci, kteří ukazují cestu.

**Levý úhlový kříž revoluce (brány 49-4-14-8):** Téma transformace a revoluce ve vztazích a společenských strukturách.

Každý kříž má svou unikátní kombinaci energií a témat. Celkem existuje 192 základních inkarnačních křížů, z nichž každý má svou specifickou kvalitu a životní téma.

## Praktický tip

Podívejte se na brány svého inkarnačního kříže a přečtěte si jejich popisy. Zamyslete se, jak se tato témata projevují ve vašem životě. Často zjistíte, že jste tato témata žili celý život — jen jste je neuměli pojmenovat.`,
  },
  {
    slug: "jak-cist-bodygraph",
    title: "Jak číst bodygraph: Průvodce vaší energetickou mapou",
    metaTitle: "Jak číst bodygraph v Human Design: Centra, kanály, brány | Průvodce pro začátečníky",
    metaDescription: "Naučte se číst svůj Human Design bodygraph krok za krokem. Centra, kanály, brány, aktivace — kompletní průvodce pro začátečníky.",
    excerpt: "Bodygraph je vizuální mapa vaší energetiky. Naučte se ho číst krok za krokem — od center přes kanály až po jednotlivé brány a jejich aktivace.",
    category: "zaklady",
    categoryLabel: "Základy HD",
    readingTime: 9,
    publishedAt: "2026-02-08",
    updatedAt: "2026-03-01",
    coverColor: "bg-gradient-to-br from-slate-50 to-gray-100",
    coverIcon: "FileText",
    coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    tags: ["bodygraph", "jak číst", "začátečníci", "brány", "kanály"],
    content: `## Co je bodygraph?

Bodygraph je **vizuální mapa vaší energetiky** — diagram, který zobrazuje 9 center, 36 kanálů a 64 bran. Je to „schéma" vašeho energetického těla, vypočítané na základě přesného data, času a místa narození.

## Krok 1: Centra

Začněte tím, že se podíváte na **9 geometrických tvarů** v bodygraphu. Každý tvar představuje jedno centrum:

- **Obarvená (definovaná) centra** = konzistentní energie, kterou vyzařujete
- **Bílá (otevřená) centra** = místa, kde přijímáte energie okolí

Počet definovaných center určuje váš **typ definice**:
- Všechna centra propojená = Jednoduchá definice
- Dvě skupiny = Rozdělená definice
- Tři skupiny = Trojitě rozdělená definice
- Žádné definované = Reflektor

## Krok 2: Kanály

Kanály jsou **čáry spojující dvě centra**. Existuje 36 kanálů. Kanál je aktivní (definovaný), když jsou obě jeho brány aktivované — jedna na každém konci.

Definovaný kanál:
- Propojuje dvě centra a definuje je
- Představuje konzistentní životní téma
- Patří do jednoho ze tří okruhů (Individuální, Kmenový, Kolektivní)

## Krok 3: Brány

Brány jsou **64 bodů** rozmístěných po centrech. Každá brána odpovídá jednomu hexagramu I-Ťingu. Brány mohou být:

- **Aktivované vědomě** (černé) — osobnostní aktivace, to, co si uvědomujete
- **Aktivované nevědomě** (červené) — designová aktivace, to, co si neuvědomujete
- **Neaktivované** — potenciál, který se může projevit skrze tranzity nebo jiné lidi

## Krok 4: Osobnost vs. Design

V bodygraphu vidíte dvě sady aktivací:

**Černé čáry (osobnost)** = vědomá stránka, vypočítaná z přesného okamžiku narození. To, co si o sobě myslíte, jak se vnímáte.

**Červené čáry (design)** = nevědomá stránka, vypočítaná z pozice Slunce přibližně 88 dní před narozením. To, co o sobě nevíte, ale ostatní to na vás vidí.

## Krok 5: Planetární aktivace

Každá brána je aktivovaná konkrétní planetou. V tabulce aktivací uvidíte 13 planet (Slunce, Země, Měsíc, Severní uzel, Jižní uzel, Merkur, Venuše, Mars, Jupiter, Saturn, Uran, Neptun, Pluto) — jednou pro osobnost a jednou pro design.

Každá planeta přináší svou kvalitu:
- **Slunce** (70% energie) — vaše hlavní životní téma
- **Země** — ukotvení a základ
- **Měsíc** — hnací síla
- **Uzly** — životní směr a prostředí

## Krok 6: Linie, barvy, tóny, báze

Každá brána má 6 linií (1-6), které odpovídají liniím profilu. Linie přidávají specifickou kvalitu k bráně. Pod liniemi jsou ještě hlubší vrstvy:

- **Barva** (1-6) — motivace a perspektiva
- **Tón** (1-6) — smyslové vnímání
- **Báze** (1-5) — nejhlubší genetická vrstva

Tyto hlubší vrstvy jsou součástí pokročilého studia (Proměnné, PHS, Rave Psychology).

## Praktický postup čtení

1. **Typ** — jaký jste typ? (Generátor, Projektor, Manifestor, MG, Reflektor)
2. **Strategie** — jak správně interagovat se světem?
3. **Autorita** — jak dělat rozhodnutí?
4. **Profil** — jaká je vaše životní role?
5. **Definovaná centra** — kde máte konzistentní energii?
6. **Otevřená centra** — kde jste ovlivňováni okolím?
7. **Kanály** — jaká jsou vaše hlavní životní témata?
8. **Inkarnační kříž** — jaký je váš životní účel?

Začněte prvními čtyřmi body a postupně se ponořujte hlouběji. Human Design je systém, který se studuje celý život.`,
  },
];

// Helper aliases and functions
export const blogArticles = BLOG_ARTICLES;

export function getBlogArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find(a => a.slug === slug);
}

export function getBlogArticlesByCategory(category: string): BlogArticle[] {
  return BLOG_ARTICLES.filter(a => a.category === category);
}

export function getRelatedArticles(slug: string, limit = 3): BlogArticle[] {
  const article = getBlogArticleBySlug(slug);
  if (!article) return [];
  return BLOG_ARTICLES
    .filter(a => a.slug !== slug && (a.category === article.category || a.tags.some(t => article.tags.includes(t))))
    .slice(0, limit);
}
