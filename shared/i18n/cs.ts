/**
 * Czech (Čeština) translations for Human Design App
 * Terminology aligned with humandesign.cz conventions
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
    dashboard: "Moje mapy",
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
    calculateChart: "Mapa zdarma",
    transits: "Tranzity",
    celebrities: "Celebrity",
    iChing: "I-Ťing Orákulum",
    compare: "Porovnání",
    dashboard: "Moje mapy",
  },

  // ─── Home / Landing Page ──────────────────────────────────────────────
  home: {
    badge: "Poznejte svůj Human Design",
    heroTitle: "Mapa Vašeho",
    heroTitleHighlight: "Já",
    heroDescription: "Poznejte sebe sama. Respektujte svoji jedinečnost. Dělejte správná rozhodnutí. Žijte život, který je opravdu váš.",
    ctaCalculate: "Získat mapu zdarma",
    ctaDashboard: "Moje mapy",
    typesTitle: "Pět typů lidí a jejich aura",
    typesDescription: "Každý člověk patří k jednomu z energetických typů. Každý typ má svoji jedinečnou auru a strategii pro správná rozhodnutí.",
    featuresTitle: "Co vám nabízíme",
    featuresDescription: "Od výpočtu vaší mapy po pokročilé AI rozbory – poskytujeme nejkomplexnější nástroje Human Designu v češtině.",
    ctaTitle: "Připraveni poznat svůj design?",
    ctaDescription: "Vygenerujte si svoji mapu Human Designu během několika sekund. Potřebujete pouze datum, čas a místo narození.",
    ctaButton: "Získat mapu zdarma",
    ofPopulation: "populace",
    features: {
      chartCalc: { title: "Kompletní mapa designu", description: "Plný Bodygraph se všemi 9 centry, 36 dráhami, 64 branami, typem, profilem, autoritou, definicí a inkarnačním křížem." },
      aiReadings: { title: "AI rozbor", description: "Hluboké personalizované interpretace poháněné umělou inteligencí. Analýza vašeho typu, profilu, autority a životního účelu." },
      transits: { title: "Denní tranzity", description: "Aktuální planetární pozice a jejich vliv na váš design. Sledujte, které brány jsou právě aktivované a jak to ovlivňuje váš den." },
      comparison: { title: "Porovnání map", description: "Porovnejte dvě mapy vedle sebe. Objevte elektromagnetická spojení a dynamiku vašich vztahů." },
      variables: { title: "Proměnné a dieta", description: "Kompletní analýza proměnných – typ trávení, optimální prostředí, perspektiva a vědomí s praktickými doporučeními." },
      pdfReports: { title: "PDF reporty", description: "Exportujte profesionálně formátované PDF reporty s vizualizací Bodygraphu a podrobnými popisy." },
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
    title: "Vypočítejte svoji mapu Human Designu",
    description: "Zadejte svá data narození pro vygenerování vaší jedinečné mapy designu.",
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
    calculate: "Vypočítat mapu",
    calculating: "Počítám...",
    birthTimeNote: "Přesný čas narození je klíčový pro správný výpočet. Zkontrolujte rodný list.",
    timezoneNote: "Časové pásmo",
    coordinates: "Souřadnice",
  },

  // ─── Chart Result ─────────────────────────────────────────────────────
  chart: {
    newCalculation: "Nový výpočet",
    yourChart: "Vaše mapa",
    saveChart: "Uložit mapu",
    saving: "Ukládám...",
    savedToCollection: "Mapa uložena do vaší sbírky!",
    bodygraph: "Bodygraph",
    bodygraphDesc: "Klikněte na centra, brány nebo dráhy pro detaily",
    personality: "Osobnost",
    design: "Design",
    both: "Obojí",
    transit: "Tranzit",

    // Sections
    typeStrategy: "Typ a strategie",
    profile: "Profil",
    authority: "Autorita",
    incarnationCross: "Inkarnační kříž",
    definition: "Definice",
    signature: "Signatura",
    notSelf: "Ne-Já",
    aura: "Aura",
    strategy: "Strategie",
    type: "Typ",

    // Tabs
    activations: "Aktivace",
    channels: "Dráhy",
    centers: "Centra",
    variables: "Proměnné",
    gates: "Brány",

    // Activations
    personalityConscious: "Osobnost (vědomé)",
    designUnconscious: "Design (nevědomé)",

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
    aiReading: "AI rozbor",
    aiReadingDesc: "Získejte personalizovaný rozbor generovaný AI na základě vaší jedinečné mapy",
    generatingReading: "Generuji váš personalizovaný rozbor...",
    aiTypes: {
      overview: "Celkový přehled",
      type_strategy: "Typ a strategie",
      profile: "Profil",
      authority: "Autorita",
      incarnation_cross: "Životní účel",
      channels: "Dráhy",
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
    title: "Moje mapy",
    description: "Spravujte své uložené mapy Human Designu",
    noCharts: "Zatím nemáte žádné uložené mapy",
    noChartsDesc: "Vypočítejte svoji první mapu a uložte ji do sbírky.",
    calculateFirst: "Vypočítat první mapu",
    deleteConfirm: "Opravdu chcete smazat tuto mapu?",
    deleteSuccess: "Mapa smazána",
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
    viewChart: "Zobrazit mapu",
    born: "Narozen/a",
  },

  // ─── Chart Comparison ─────────────────────────────────────────────────
  comparison: {
    title: "Porovnání map",
    subtitle: "Porovnejte dvě mapy",
    description: "Objevte elektromagnetická spojení a dynamiku vztahů mezi dvěma lidmi.",
    personA: "Osoba A",
    personB: "Osoba B",
    electromagneticConnections: "Elektromagnetická spojení",
    noConnections: "Mezi těmito dvěma mapami nebyla nalezena žádná elektromagnetická spojení.",
    channel: "Dráha",
    sideBySide: "Porovnání vedle sebe",
    property: "Vlastnost",
    incCross: "Ink. kříž",
  },

  // ─── Transits ─────────────────────────────────────────────────────────
  transits: {
    title: "Planetární tranzity",
    subtitle: "Aktuální tranzity",
    description: "Sledujte aktuální planetární pozice a jejich vliv na váš Human Design.",
    currentPositions: "Aktuální planetární pozice",
    planet: "Planeta",
    gate: "Brána",
    line: "Linka",
    longitude: "Délka",
    lastUpdated: "Poslední aktualizace",
    refreshing: "Aktualizuji...",
    refresh: "Aktualizovat",
    transitOverlay: "Překrytí tranzitů",
    selectChart: "Vyberte mapu pro překrytí tranzitů",
  },

  // ─── Celebrities ──────────────────────────────────────────────────────
  celebrities: {
    title: "Databáze celebrit",
    subtitle: "Mapy slavných osobností",
    description: "Prozkoumejte Human Design mapy slavných osobností a porovnejte je se svou vlastní.",
    searchPlaceholder: "Hledat celebrity...",
    noResults: "Žádné výsledky",
    viewChart: "Zobrazit mapu",
    category: "Kategorie",
  },

  // ─── I Ching ──────────────────────────────────────────────────────────
  iChing: {
    title: "I-Ťing Orákulum",
    subtitle: "Moudrost 64 hexagramů",
    description: "Prozkoumejte starobylou moudrost I-Ťingu, která tvoří základ systému Human Design.",
    drawHexagram: "Hodit hexagram",
    yourHexagram: "Váš hexagram",
    hexagram: "Hexagram",
    searchPlaceholder: "Hledat hexagram...",
    allHexagrams: "Všechny hexagramy",
    gate: "Brána",
    iChingName: "Název I-Ťing",
    center: "Centrum",
    circuit: "Okruh",
  },

  // ─── Footer ───────────────────────────────────────────────────────────
  footer: {
    description: "Poznejte svůj jedinečný design. Nejkomplexnější Human Design aplikace v češtině.",
    features: "Funkce",
    chartCalculator: "Mapa zdarma",
    dailyTransits: "Denní tranzity",
    chartComparison: "Porovnání map",
    celebrityCharts: "Celebrity",
    learn: "Vzdělávání",
    iChingOracle: "I-Ťing Orákulum",
    typesStrategy: "Typy a strategie",
    authorityLabel: "Autorita",
    gatesChannels: "Brány a dráhy",
    accountLabel: "Účet",
    myCharts: "Moje mapy",
    aiReadings: "AI rozbory",
    copyright: "Human Design App. Všechna práva vyhrazena.",
    foundedBy: "Human Design systém založil Ra Uru Hu",
  },

  // ─── HD Content Labels ────────────────────────────────────────────────
  hd: {
    definitionTypes: {
      "Single Definition": "Jednoduchá definice",
      "Split Definition": "Rozdělená definice",
      "Triple Split Definition": "Trojitě rozdělená definice",
      "Quadruple Split Definition": "Čtyřnásobně rozdělená definice",
      "No Definition": "Bez definice",
    },
    strategies: {
      "To Inform": "Informovat",
      "To Respond": "Reagovat",
      "To Respond, Then Inform": "Reagovat, poté informovat",
      "Wait for the Invitation": "Čekat na pozvání",
      "Wait a Lunar Cycle": "Čekat lunární cyklus",
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
      "Frustration & Anger": "Frustrace a hněv",
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
      SolarPlexus: "Solární plexus",
      Spleen: "Slezina",
      Root: "Kořen",
    },
    planets: {
      Sun: "Slunce",
      Earth: "Země",
      Moon: "Měsíc",
      "North Node": "Severní uzel",
      "South Node": "Jižní uzel",
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
