/**
 * Czech (Čeština) translations for Human Design App
 * Complete UI localization for the Czech market
 */

export const cs = {
  // ─── Common ───────────────────────────────────────────────────────────
  common: {
    appName: "Human Design",
    loading: "Načítání...",
    save: "Uložit",
    saved: "Uloženo",
    delete: "Smazat",
    cancel: "Zrušit",
    confirm: "Potvrdit",
    back: "Zpět",
    next: "Další",
    close: "Zavřít",
    search: "Hledat",
    filter: "Filtrovat",
    all: "Vše",
    yes: "Ano",
    no: "Ne",
    or: "nebo",
    comingSoon: "Již brzy",
    learnMore: "Zjistit více",
    signIn: "Přihlásit se",
    signOut: "Odhlásit se",
    account: "Účet",
    dashboard: "Nástěnka",
    download: "Stáhnout",
    export: "Exportovat",
    share: "Sdílet",
    error: "Chyba",
    success: "Úspěch",
    notFound: "Stránka nenalezena",
    notFoundDesc: "Omlouváme se, ale tato stránka neexistuje.",
    goHome: "Zpět na hlavní stránku",
  },

  // ─── Navigation ───────────────────────────────────────────────────────
  nav: {
    calculateChart: "Vypočítat Chart",
    transits: "Tranzity",
    celebrities: "Celebrity",
    iChing: "I-Ťing Orákulum",
    compare: "Porovnání",
    dashboard: "Nástěnka",
  },

  // ─── Home / Landing Page ──────────────────────────────────────────────
  home: {
    badge: "Nejkomplexnější Human Design Aplikace",
    heroTitle: "Objevte Svůj",
    heroTitleHighlight: "Energetický Blueprint",
    heroDescription: "Odhalte moudrost svého jedinečného designu s nejpokročilejším Human Design kalkulátorem. Kompletní analýza chartu, AI čtení, denní tranzity a hluboké vhledy do vašeho životního účelu.",
    ctaCalculate: "Vypočítat Váš Chart",
    ctaDashboard: "Zobrazit Nástěnku",
    typesTitle: "Pět Energetických Typů",
    typesDescription: "Každý člověk patří k jednomu z pěti energetických typů, z nichž každý má jedinečnou strategii pro navigaci životem.",
    featuresTitle: "Vše, Co Potřebujete",
    featuresDescription: "Od základního výpočtu chartu po pokročilá AI čtení – poskytujeme nejkomplexnější nástroje Human Design.",
    ctaTitle: "Připraveni Objevit Svůj Design?",
    ctaDescription: "Vypočítejte si svůj Human Design chart během několika sekund. Potřebujete pouze datum, čas a místo narození.",
    ctaButton: "Začít Zdarma",
    ofPopulation: "populace",
    features: {
      chartCalc: { title: "Kompletní Výpočet Chartu", description: "Plný Bodygraph se všemi 9 centry, 36 kanály, 64 branami, typem, profilem, autoritou, definicí a inkarnačním křížem." },
      aiReadings: { title: "AI Čtení", description: "Hluboké personalizované interpretace poháněné umělou inteligencí analyzující váš kompletní chart pro strategii typu, témata profilu a životní účel." },
      transits: { title: "Denní Tranzity", description: "Překrytí planetárních tranzitů v reálném čase na vašem chartu ukazující dočasné aktivace bran a jejich denní vliv." },
      comparison: { title: "Porovnání Chartů", description: "Porovnejte dva charty vedle sebe a objevte elektromagnetická spojení, kompozitní kanály a dynamiku vztahů." },
      variables: { title: "Proměnné & Dieta", description: "Kompletní analýza proměnných včetně typu trávení, optimálního prostředí, perspektivy a vědomí s praktickými doporučeními." },
      pdfReports: { title: "PDF Reporty", description: "Exportujte profesionálně formátované PDF reporty s vizualizací Bodygraphu a podrobnými popisy." },
    },
  },

  // ─── Types ────────────────────────────────────────────────────────────
  types: {
    Manifestor: "Manifestor",
    Generator: "Generátor",
    "Manifesting Generator": "Manifestující Generátor",
    Projector: "Projektor",
    Reflector: "Reflektor",
  },

  // ─── Chart Calculator ─────────────────────────────────────────────────
  calculator: {
    title: "Vypočítejte Svůj Human Design Chart",
    description: "Zadejte svá data narození pro výpočet vašeho jedinečného energetického blueprintu.",
    name: "Jméno",
    namePlaceholder: "Vaše jméno",
    birthDate: "Datum narození",
    birthTime: "Čas narození",
    birthPlace: "Místo narození",
    birthPlacePlaceholder: "Město, Země",
    findLocation: "Najít",
    locationFound: "Lokace nalezena!",
    locationNotFound: "Lokace nenalezena. Zkuste zadat přesnější adresu.",
    locationSearchFailed: "Vyhledávání lokace selhalo.",
    calculate: "Vypočítat Chart",
    calculating: "Počítám...",
    birthTimeNote: "Přesný čas narození je klíčový pro správný výpočet. Zkontrolujte rodný list.",
    timezoneNote: "Časové pásmo",
    coordinates: "Souřadnice",
  },

  // ─── Chart Result ─────────────────────────────────────────────────────
  chart: {
    newCalculation: "Nový Výpočet",
    yourChart: "Váš Chart",
    saveChart: "Uložit Chart",
    saving: "Ukládám...",
    savedToCollection: "Chart uložen do vaší sbírky!",
    bodygraph: "Bodygraph",
    bodygraphDesc: "Klikněte na centra, brány nebo kanály pro detaily",
    personality: "Osobnost",
    design: "Design",
    both: "Obojí",
    transit: "Tranzit",

    // Sections
    typeStrategy: "Typ & Strategie",
    profile: "Profil",
    authority: "Autorita",
    incarnationCross: "Inkarnační Kříž",
    definition: "Definice",
    signature: "Signatura",
    notSelf: "Ne-Já",
    aura: "Aura",
    strategy: "Strategie",
    type: "Typ",

    // Tabs
    activations: "Aktivace",
    channels: "Kanály",
    centers: "Centra",
    variables: "Proměnné",
    gates: "Brány",

    // Activations
    personalityConscious: "Osobnost (Vědomé)",
    designUnconscious: "Design (Nevědomé)",

    // Variables
    digestion: "Trávení",
    digestionDesc: "Jak nejlépe přijímáte výživu a informace",
    environment: "Prostředí",
    environmentDesc: "Prostředí, ve kterém prosperujete",
    perspective: "Perspektiva",
    perspectiveDesc: "Váš jedinečný způsob vnímání světa",
    awareness: "Vědomí",
    awarenessDesc: "Jak zpracováváte a sdílíte vědomí",
    color: "Barva",
    tone: "Tón",
    arrow: "Šipka",

    // Detail modal
    theme: "Téma",
    gift: "Dar",
    shadow: "Stín",
    circuit: "Okruh",
    defined: "Definované",
    open: "Otevřené",
    definedMeaning: "Význam definovaného centra",
    openMeaning: "Význam otevřeného centra",
    notSelfQuestion: "Otázka Ne-Já",
    strengths: "Silné stránky",
    challenges: "Výzvy",
    readFullDescription: "Přečíst celý popis",
    howToUseAuthority: "Jak používat vaši autoritu",
    conscious: "Vědomé",
    unconscious: "Nevědomé",

    // Incarnation Cross
    personalitySun: "☉ Osobnost",
    designSun: "☉ Design",

    // AI Reading
    aiReading: "AI Čtení",
    aiReadingDesc: "Získejte personalizované vhledy generované AI na základě vašeho jedinečného chartu",
    generatingReading: "Generuji vaše personalizované čtení...",
    aiTypes: {
      overview: "Celkový Přehled",
      type_strategy: "Typ & Strategie",
      profile: "Profil",
      authority: "Autorita",
      incarnation_cross: "Životní Účel",
      channels: "Kanály",
      gates: "Brány",
      variables: "Proměnné",
      relationships: "Vztahy",
      career: "Kariéra",
    },

    // PDF
    downloadPdf: "Stáhnout PDF",
    generatingPdf: "Generuji PDF...",
  },

  // ─── Dashboard ────────────────────────────────────────────────────────
  dashboard: {
    title: "Moje Charty",
    description: "Spravujte své uložené Human Design charty",
    noCharts: "Zatím nemáte žádné uložené charty",
    noChartsDesc: "Vypočítejte svůj první chart a uložte ho do své sbírky.",
    calculateFirst: "Vypočítat První Chart",
    deleteConfirm: "Opravdu chcete smazat tento chart?",
    deleteSuccess: "Chart smazán",
    categories: {
      all: "Vše",
      self: "Já",
      family: "Rodina",
      friend: "Přátelé",
      client: "Klienti",
      celebrity: "Celebrity",
      other: "Ostatní",
    },
    favorites: "Oblíbené",
    viewChart: "Zobrazit Chart",
    born: "Narozen/a",
  },

  // ─── Chart Comparison ─────────────────────────────────────────────────
  comparison: {
    title: "Porovnání Chartů",
    subtitle: "Porovnejte Dva Charty",
    description: "Objevte elektromagnetická spojení a dynamiku vztahů.",
    personA: "Osoba A",
    personB: "Osoba B",
    electromagneticConnections: "Elektromagnetická Spojení",
    noConnections: "Mezi těmito dvěma charty nebyla nalezena žádná elektromagnetická spojení.",
    channel: "Kanál",
    sideBySide: "Porovnání Vedle Sebe",
    property: "Vlastnost",
    incCross: "Ink. Kříž",
  },

  // ─── Transits ─────────────────────────────────────────────────────────
  transits: {
    title: "Planetární Tranzity",
    subtitle: "Aktuální Tranzity",
    description: "Sledujte aktuální planetární pozice a jejich vliv na váš Human Design chart.",
    currentPositions: "Aktuální Planetární Pozice",
    planet: "Planeta",
    gate: "Brána",
    line: "Linka",
    longitude: "Délka",
    lastUpdated: "Poslední aktualizace",
    refreshing: "Aktualizuji...",
    refresh: "Aktualizovat",
    transitOverlay: "Překrytí Tranzitů",
    selectChart: "Vyberte chart pro překrytí tranzitů",
  },

  // ─── Celebrities ──────────────────────────────────────────────────────
  celebrities: {
    title: "Databáze Celebrit",
    subtitle: "Celebrity Charty",
    description: "Prozkoumejte Human Design charty slavných osobností.",
    searchPlaceholder: "Hledat celebrity...",
    noResults: "Žádné výsledky",
    viewChart: "Zobrazit Chart",
    category: "Kategorie",
  },

  // ─── I Ching ──────────────────────────────────────────────────────────
  iChing: {
    title: "I-Ťing Orákulum",
    subtitle: "Moudrost 64 Hexagramů",
    description: "Prozkoumejte starobylou moudrost I-Ťingu, která tvoří základ systému Human Design.",
    drawHexagram: "Hodit Hexagram",
    yourHexagram: "Váš Hexagram",
    hexagram: "Hexagram",
    searchPlaceholder: "Hledat hexagram...",
    allHexagrams: "Všechny Hexagramy",
    gate: "Brána",
    iChingName: "Název I-Ťing",
    center: "Centrum",
    circuit: "Okruh",
  },

  // ─── Footer ───────────────────────────────────────────────────────────
  footer: {
    description: "Objevte svůj jedinečný energetický blueprint. Nejkomplexnější Human Design aplikace.",
    features: "Funkce",
    chartCalculator: "Kalkulátor Chartu",
    dailyTransits: "Denní Tranzity",
    chartComparison: "Porovnání Chartů",
    celebrityCharts: "Celebrity Charty",
    learn: "Vzdělávání",
    iChingOracle: "I-Ťing Orákulum",
    typesStrategy: "Typy & Strategie",
    authorityLabel: "Autorita",
    gatesChannels: "Brány & Kanály",
    accountLabel: "Účet",
    myCharts: "Moje Charty",
    aiReadings: "AI Čtení",
    copyright: "Human Design App. Všechna práva vyhrazena.",
    foundedBy: "Human Design Systém založil Ra Uru Hu",
  },

  // ─── HD Content Labels ────────────────────────────────────────────────
  hd: {
    definitionTypes: {
      "Single Definition": "Jednoduchá Definice",
      "Split Definition": "Rozdělená Definice",
      "Triple Split Definition": "Trojitě Rozdělená Definice",
      "Quadruple Split Definition": "Čtyřnásobně Rozdělená Definice",
      "No Definition": "Bez Definice",
    },
    strategies: {
      "To Inform": "Informovat",
      "To Respond": "Reagovat",
      "To Respond, Then Inform": "Reagovat, Poté Informovat",
      "Wait for the Invitation": "Čekat na Pozvání",
      "Wait a Lunar Cycle": "Čekat Lunární Cyklus",
    },
    signatures: {
      Peace: "Mír",
      Satisfaction: "Spokojenost",
      Success: "Úspěch",
      Surprise: "Překvapení",
    },
    notSelfs: {
      Anger: "Hněv",
      Frustration: "Frustrace",
      "Frustration & Anger": "Frustrace & Hněv",
      Bitterness: "Hořkost",
      Disappointment: "Zklamání",
    },
    circuits: {
      Individual: "Individuální",
      Collective: "Kolektivní",
      Tribal: "Kmenový",
    },
    centerNames: {
      Head: "Hlava",
      Ajna: "Ajna",
      Throat: "Hrdlo",
      G: "G Centrum",
      Heart: "Srdce",
      Sacral: "Sakrální",
      SolarPlexus: "Solární Plexus",
      Spleen: "Slezina",
      Root: "Kořen",
    },
    planets: {
      Sun: "Slunce",
      Earth: "Země",
      Moon: "Měsíc",
      "North Node": "Severní Uzel",
      "South Node": "Jižní Uzel",
      Mercury: "Merkur",
      Venus: "Venuše",
      Mars: "Mars",
      Jupiter: "Jupiter",
      Saturn: "Saturn",
      Uranus: "Uran",
      Neptune: "Neptun",
      Pluto: "Pluto",
    },
  },
} as const;

export type TranslationKeys = typeof cs;
export default cs;
