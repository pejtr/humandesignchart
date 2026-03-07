/**
 * English translations for Human Design App
 * Standard HD terminology used globally
 */

export const en = {
  // ─── Common ───────────────────────────────────────────────────────────
  common: {
    appName: "Human Design",
    loading: "Loading...",
    save: "Save",
    saved: "Saved",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    close: "Close",
    search: "Search",
    filter: "Filter",
    all: "All",
    yes: "Yes",
    no: "No",
    or: "or",
    comingSoon: "Coming soon",
    learnMore: "Learn more",
    signIn: "Sign in",
    signOut: "Sign out",
    account: "Account",
    dashboard: "My Charts",
    download: "Download",
    export: "Export",
    share: "Share",
    error: "Error",
    success: "Success",
    notFound: "Page not found",
    notFoundDesc: "Sorry, this page does not exist.",
    goHome: "Back to home",
  },

  // ─── Navigation ───────────────────────────────────────────────────────
  nav: {
    calculateChart: "Free Chart",
    transits: "Transits",
    celebrities: "Celebrities",
    iChing: "I Ching Oracle",
    compare: "Comparison",
    dashboard: "My Charts",
    tools: "Tools",
    explore: "Explore",
    main: "Main",
  },

  // ─── Home / Landing Page ──────────────────────────────────────────────
  home: {
    badge: "Discover Your Human Design",
    heroTitle: "The Map of Your",
    heroTitleHighlight: "Self",
    heroDescription: "Know yourself. Respect your uniqueness. Make the right decisions. Live the life that is truly yours.",
    ctaCalculate: "Get your free chart",
    ctaDashboard: "My Charts",
    typesTitle: "Five types of people and their aura",
    typesDescription: "Every person belongs to one of the energy types. Each type has a unique aura and strategy for making the right decisions.",
    featuresTitle: "What we offer",
    featuresDescription: "From calculating your chart to advanced AI readings — we provide the most comprehensive Human Design tools available.",
    ctaTitle: "Ready to discover your design?",
    ctaDescription: "Generate your Human Design chart in seconds. All you need is your date, time, and place of birth.",
    ctaButton: "Get your free chart",
    ofPopulation: "of population",
    features: {
      chartCalc: { title: "Complete Design Chart", description: "Full BodyGraph with all 9 centers, 36 channels, 64 gates, type, profile, authority, definition, and incarnation cross." },
      aiReadings: { title: "AI Reading", description: "Deep personalized interpretations powered by AI. Analysis of your type, profile, authority, and life purpose." },
      transits: { title: "Daily Transits", description: "Current planetary positions and their influence on your design. Track which gates are currently activated and how they affect your day." },
      comparison: { title: "Chart Comparison", description: "Compare two charts side by side. Discover electromagnetic connections and the dynamics of your relationships." },
      variables: { title: "Variables & Diet", description: "Complete variable analysis — digestion type, optimal environment, perspective, and awareness with practical recommendations." },
      pdfReports: { title: "PDF Reports", description: "Export professionally formatted PDF reports with BodyGraph visualization and detailed descriptions." },
    },
  },

  // ─── Types ────────────────────────────────────────────────────────────
  types: {
    Manifestor: "Manifestor",
    Generator: "Generator",
    "Manifesting Generator": "Manifesting Generator",
    Projector: "Projector",
    Reflector: "Reflector",
  },

  // ─── Chart Calculator ─────────────────────────────────────────────────
  calculator: {
    title: "Calculate Your Human Design Chart",
    description: "Enter your birth data to generate your unique design chart.",
    name: "Name",
    namePlaceholder: "Your name",
    birthDate: "Date of Birth",
    birthTime: "Time of Birth",
    birthPlace: "Place of Birth",
    birthPlacePlaceholder: "City, Country",
    findLocation: "Find",
    locationFound: "Location found!",
    locationNotFound: "Location not found. Try entering a more specific address.",
    locationSearchFailed: "Location search failed.",
    calculate: "Calculate Chart",
    calculating: "Calculating...",
    birthTimeNote: "Exact birth time is crucial for an accurate calculation. Check your birth certificate.",
    timezoneNote: "Timezone",
    coordinates: "Coordinates",
  },

  // ─── Chart Result ─────────────────────────────────────────────────────
  chart: {
    newCalculation: "New Calculation",
    yourChart: "Your Chart",
    saveChart: "Save Chart",
    saving: "Saving...",
    savedToCollection: "Chart saved to your collection!",
    bodygraph: "BodyGraph",
    bodygraphDesc: "Click on centers, gates, or channels for details",
    personality: "Personality",
    design: "Design",
    both: "Both",
    transit: "Transit",

    // Sections
    typeStrategy: "Type & Strategy",
    profile: "Profile",
    authority: "Authority",
    incarnationCross: "Incarnation Cross",
    definition: "Definition",
    signature: "Signature",
    notSelf: "Not-Self",
    aura: "Aura",
    strategy: "Strategy",
    type: "Type",

    // Tabs
    activations: "Activations",
    channels: "Channels",
    centers: "Centers",
    variables: "Variables",
    gates: "Gates",

    // Activations
    personalityConscious: "Personality (conscious)",
    designUnconscious: "Design (unconscious)",

    // Variables
    digestion: "Digestion",
    digestionDesc: "How you best receive nutrition and information",
    environment: "Environment",
    environmentDesc: "The environment in which you thrive",
    perspective: "Perspective",
    perspectiveDesc: "Your unique way of perceiving the world",
    awareness: "Awareness",
    awarenessDesc: "How you process and share awareness",
    color: "Color",
    tone: "Tone",
    arrow: "Arrow",

    // Detail modal
    theme: "Theme",
    gift: "Gift",
    shadow: "Shadow",
    circuit: "Circuit",
    defined: "Defined",
    open: "Open",
    definedMeaning: "Meaning of a defined center",
    openMeaning: "Meaning of an open center",
    notSelfQuestion: "Not-Self Question",
    strengths: "Strengths",
    challenges: "Challenges",
    readFullDescription: "Read full description",
    howToUseAuthority: "How to use your authority",
    conscious: "Conscious",
    unconscious: "Unconscious",

    // Incarnation Cross
    personalitySun: "☉ Personality",
    designSun: "☉ Design",

    // AI Reading
    aiReading: "AI Reading",
    aiReadingDesc: "Get a personalized reading generated by AI based on your unique chart",
    generatingReading: "Generating your personalized reading...",
    aiTypes: {
      overview: "Overview",
      type_strategy: "Type & Strategy",
      profile: "Profile",
      authority: "Authority",
      incarnation_cross: "Life Purpose",
      channels: "Channels",
      gates: "Gates",
      variables: "Variables",
      relationships: "Relationships",
      career: "Career",
    },

    // PDF
    downloadPdf: "Download PDF",
    generatingPdf: "Generating PDF...",
  },

  // ─── Dashboard ────────────────────────────────────────────────────────
  dashboard: {
    title: "My Charts",
    description: "Manage your saved Human Design charts",
    noCharts: "You don't have any saved charts yet",
    noChartsDesc: "Calculate your first chart and save it to your collection.",
    calculateFirst: "Calculate first chart",
    deleteConfirm: "Are you sure you want to delete this chart?",
    deleteSuccess: "Chart deleted",
    categories: {
      all: "All",
      self: "Self",
      family: "Family",
      friend: "Friends",
      client: "Clients",
      celebrity: "Celebrities",
      other: "Other",
    },
    favorites: "Favorites",
    viewChart: "View Chart",
    born: "Born",
  },

  // ─── Chart Comparison ─────────────────────────────────────────────────
  comparison: {
    title: "Chart Comparison",
    subtitle: "Compare two charts",
    description: "Discover electromagnetic connections and relationship dynamics between two people.",
    personA: "Person A",
    personB: "Person B",
    electromagneticConnections: "Electromagnetic Connections",
    noConnections: "No electromagnetic connections were found between these two charts.",
    channel: "Channel",
    sideBySide: "Side by side comparison",
    property: "Property",
    incCross: "Inc. Cross",
  },

  // ─── Transits ─────────────────────────────────────────────────────────
  transits: {
    title: "Planetary Transits",
    subtitle: "Current Transits",
    description: "Track current planetary positions and their influence on your Human Design.",
    currentPositions: "Current Planetary Positions",
    planet: "Planet",
    gate: "Gate",
    line: "Line",
    longitude: "Longitude",
    lastUpdated: "Last updated",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    transitOverlay: "Transit Overlay",
    selectChart: "Select a chart for transit overlay",
  },

  // ─── Celebrities ──────────────────────────────────────────────────────
  celebrities: {
    title: "Celebrity Database",
    subtitle: "Charts of Famous People",
    description: "Explore Human Design charts of famous personalities and compare them with your own.",
    searchPlaceholder: "Search celebrities...",
    noResults: "No results",
    viewChart: "View Chart",
    category: "Category",
  },

  // ─── I Ching ──────────────────────────────────────────────────────────
  iChing: {
    title: "I Ching Oracle",
    subtitle: "Wisdom of 64 Hexagrams",
    description: "Explore the ancient wisdom of the I Ching, which forms the foundation of the Human Design system.",
    drawHexagram: "Draw a hexagram",
    yourHexagram: "Your hexagram",
    hexagram: "Hexagram",
    searchPlaceholder: "Search hexagram...",
    allHexagrams: "All hexagrams",
    gate: "Gate",
    iChingName: "I Ching Name",
    center: "Center",
    circuit: "Circuit",
  },

  // ─── Footer ───────────────────────────────────────────────────────────
  footer: {
    description: "Discover your unique design. The most comprehensive Human Design app available.",
    features: "Features",
    chartCalculator: "Free Chart",
    dailyTransits: "Daily Transits",
    chartComparison: "Chart Comparison",
    celebrityCharts: "Celebrities",
    learn: "Learn",
    iChingOracle: "I Ching Oracle",
    typesStrategy: "Types & Strategy",
    authorityLabel: "Authority",
    gatesChannels: "Gates & Channels",
    accountLabel: "Account",
    myCharts: "My Charts",
    aiReadings: "AI Readings",
    copyright: "Human Design App. All rights reserved.",
    foundedBy: "Human Design system founded by Ra Uru Hu",
  },

  // ─── HD Content Labels ────────────────────────────────────────────────
  hd: {
    definitionTypes: {
      "Single Definition": "Single Definition",
      "Split Definition": "Split Definition",
      "Triple Split Definition": "Triple Split Definition",
      "Quadruple Split Definition": "Quadruple Split Definition",
      "No Definition": "No Definition",
    },
    strategies: {
      "To Inform": "To Inform",
      "To Respond": "To Respond",
      "To Respond, Then Inform": "To Respond, Then Inform",
      "Wait for the Invitation": "Wait for the Invitation",
      "Wait a Lunar Cycle": "Wait a Lunar Cycle",
    },
    signatures: {
      Peace: "Peace",
      Satisfaction: "Satisfaction",
      Success: "Success",
      Surprise: "Surprise",
    },
    notSelfs: {
      Anger: "Anger",
      Frustration: "Frustration",
      "Frustration & Anger": "Frustration & Anger",
      Bitterness: "Bitterness",
      Disappointment: "Disappointment",
    },
    circuits: {
      Individual: "Individual",
      Collective: "Collective",
      Tribal: "Tribal",
    },
    centerNames: {
      Head: "Head",
      Ajna: "Ajna",
      Throat: "Throat",
      G: "G Center",
      Heart: "Heart",
      Sacral: "Sacral",
      SolarPlexus: "Solar Plexus",
      Spleen: "Spleen",
      Root: "Root",
    },
    planets: {
      Sun: "Sun",
      Earth: "Earth",
      Moon: "Moon",
      "North Node": "North Node",
      "South Node": "South Node",
      Mercury: "Mercury",
      Venus: "Venus",
      Mars: "Mars",
      Jupiter: "Jupiter",
      Saturn: "Saturn",
      Uranus: "Uranus",
      Neptune: "Neptune",
      Pluto: "Pluto",
    },
  },
} as const;

export type EnTranslationKeys = typeof en;
export default en;
