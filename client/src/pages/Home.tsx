import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TiltCard } from "@/components/TiltCard";
import { ProgressiveImage } from "@/components/ProgressiveImage";
const SocialProof = lazy(() =>
  import("@/components/SocialProof").then(m => ({ default: m.SocialProof }))
);
import { motion } from "framer-motion";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import {
  Compass,
  Brain,
  Users,
  Star,
  BarChart3,
  FileText,
  Zap,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sparkles,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

// ─── CDN image URLs for each type ────────────────────────────────────────────

function getTypesData(isCs: boolean) {
  return [
    {
      name: "Generator",
      displayName: isCs ? "GENERÁTOR" : "GENERATOR",
      role: isCs ? "Budovatel a tvůrce." : "Builder and creator.",
      strategy: isCs
        ? "Strategie: Reagovat na život."
        : "Strategy: To Respond to life.",
      pct: "37%",
      label: isCs ? "populace" : "of population",
      color: "bg-amber-50 border-amber-200",
      pctColor: "text-orange-500",
      imgUrl:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/IxAVlaOWqHGkhytp.webp",
    },
    {
      name: "Manifesting Generator",
      displayName: isCs ? "MANIFESTUJÍCÍ\nGENERÁTOR" : "MANIFESTING\nGENERATOR",
      role: isCs ? "Rychlý tvůrce a iniciátor." : "Fast creator and initiator.",
      strategy: isCs
        ? "Strategie: Reagovat a informovat."
        : "Strategy: Respond, then Inform.",
      pct: "33%",
      label: isCs ? "populace" : "of population",
      color: "bg-red-50 border-red-200",
      pctColor: "text-red-500",
      imgUrl:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/qWsAFzAtJmYBPSzE.webp",
    },
    {
      name: "Projector",
      displayName: isCs ? "PROJEKTOR" : "PROJECTOR",
      role: isCs ? "Průvodce a vizionář." : "Guide and visionary.",
      strategy: isCs
        ? "Strategie: Čekat na pozvání."
        : "Strategy: Wait for the Invitation.",
      pct: "20%",
      label: isCs ? "populace" : "of population",
      color: "bg-violet-50 border-violet-200",
      pctColor: "text-violet-500",
      imgUrl:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/uyvogIBNHAiNkHXh.webp",
    },
    {
      name: "Manifestor",
      displayName: "MANIFESTOR",
      role: isCs ? "Iniciátor a katalyzátor." : "Initiator and catalyst.",
      strategy: isCs
        ? "Strategie: Informovat před akcí."
        : "Strategy: To Inform before acting.",
      pct: "9%",
      label: isCs ? "populace" : "of population",
      color: "bg-emerald-50 border-emerald-200",
      pctColor: "text-emerald-500",
      imgUrl:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/rMbULSgMTGcVzRZZ.webp",
    },
    {
      name: "Reflector",
      displayName: isCs ? "REFLEKTOR" : "REFLECTOR",
      role: isCs ? "Zrcadlo a pozorovatel." : "Mirror and observer.",
      strategy: isCs
        ? "Strategie: Čekat na lunární cyklus."
        : "Strategy: Wait a Lunar Cycle.",
      pct: "1%",
      label: isCs ? "populace" : "of population",
      color: "bg-slate-50 border-slate-200",
      pctColor: "text-slate-500",
      imgUrl:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/UWRWlEUvFOKUinyN.webp",
    },
  ];
}

// Testimonials removed — fake reviews pose E-E-A-T and legal risk.
// Replace with real user reviews collected via dashboard feedback.

import { FastTypeQuizModal } from "@/components/FastTypeQuizModal";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import PremiumUSHome from "./PremiumUSHome";
import "./HomeWow.css";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const isCs = locale === "cs";
  const isPremiumUsDomain = typeof window !== "undefined" && window.location.hostname.endsWith("humandesignchart.app");

  const [showQuiz, setShowQuiz] = useState(false);
  // Store referral code from URL (?ref=CODE) into localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("pendingReferralCode", ref.toUpperCase());
    }
  }, []);

  useSEO(
    isCs
      ? {
          title:
            "✨ HUMAN DESIGN CZ – Mapa Vašeho Já | Kalkulátor & AI Výklad Zdarma 🔮",
          description:
            "🌟 Vypočítejte si svou Human Design mapu zdarma. Přesný kalkulátor, test typu (Generátor, Projektor, Manifestor), denní tranzity a osobitý AI výklad v češtině.",
          ogImage: OG_IMAGES.homepage,
          keywords:
            "human design mapa, human design cz, human design kalkulačka, human design zdarma, human design test zdarma, human design typy, bodygraph kalkulátor, human design denní tranzit",
          locale: "cs_CZ",
          jsonLd: {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://www.humandesignmapa.cz/#website",
                url: "https://www.humandesignmapa.cz",
                name: "Human Design Mapa CZ",
                description:
                  "Kalkulátor Human Design mapy zdarma, test osobnosti a AI výklad v češtině.",
                inLanguage: ["cs", "en"],
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Jak vypočítat Human Design mapu zdarma?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Zadejte přesný datum, čas a místo narození do našeho kalkulátoru. Mapa se vygeneruje zdarma za několik sekund.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Co obsahuje bezplatný AI výklad Human Design?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Bezplatný AI výklad obsahuje váš energetický typ (Generátor, Projektor, Manifestor, Reflektor), profil, autoritu, definovaná centra a životní poslání.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Jak funguje denní tranzit Human Design?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Denní tranzit ukazuje aktuální pozice planet a jaké brány a dráhy aktivují ve vaší osobní mapě dnešní den.",
                    },
                  },
                ],
              },
            ],
          },
        }
      : {
          title:
            "Free Human Design Chart — Type, Authority & Profile | HumanDesignChart.app",
          description:
            "Calculate your Human Design chart free. Discover your type, strategy, authority and profile, then explore deeper personalized insights when you want them.",
          ogImage: OG_IMAGES.homepage,
          keywords:
            "human design calculator free, free human design chart, human design chart calculator, free human design reading, human design map, human design test free, human design transit today, human design chart, human design free, free human design chart reading",
          locale: "en_US",
          jsonLd: {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://www.humandesignchart.app/#website",
                url: "https://www.humandesignchart.app",
                name: "Human Design Chart Calculator",
                description:
                  "Free Human Design chart calculator, bodygraph generator and AI readings.",
                inLanguage: ["en", "cs"],
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How to calculate a free Human Design chart?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Enter your date, time, and place of birth into our free Human Design chart calculator to get your instant bodygraph.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is included in a free Human Design reading?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Your free Human Design reading includes your energy type, strategy, inner authority, profile, defined centers, and channels.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is Human Design transit today?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Daily Human Design transits track today's planetary movements and show which gates are activated in your chart.",
                    },
                  },
                ],
              },
            ],
          },
        }
  );
  const typesData = getTypesData(isCs);

  const features = [
    { icon: Compass, ...t.home.features.chartCalc },
    { icon: Brain, ...t.home.features.aiReadings },
    { icon: Star, ...t.home.features.transits },
    { icon: Users, ...t.home.features.comparison },
    { icon: BarChart3, ...t.home.features.variables },
    { icon: FileText, ...t.home.features.pdfReports },
  ];

  const steps = isCs
    ? [
        {
          step: "1",
          title: "Vygenerujte si mapu",
          desc: "Zadejte datum, čas a místo narození. Vaše mapa se vygeneruje během několika sekund.",
          cta: "Získat mapu zdarma",
        },
        {
          step: "2",
          title: "Prozkoumejte svůj design",
          desc: "Prozkoumejte svůj typ, profil, autoritu, centra, brány a dráhy. Každý detail má svůj význam.",
          cta: "Začít prozkoumávat",
        },
        {
          step: "3",
          title: "Získejte Hloubkový rozbor",
          desc: "Nechte si vygenerovat personalizovaný rozbor, využívající přesné algoritmické výpočty přímo o vás.",
          cta: "Vyzkoušet Hloubkový rozbor",
        },
      ]
    : [
        {
          step: "1",
          title: "Generate your chart",
          desc: "Enter your date, time, and place of birth. Your chart will be generated in seconds.",
          cta: "Get your free chart",
        },
        {
          step: "2",
          title: "Explore your design",
          desc: "Explore your type, profile, authority, centers, gates, and channels. Every detail has meaning.",
          cta: "Start exploring",
        },
        {
          step: "3",
          title: "Get a comprehensive reading",
          desc: "Get a personalized reading based on your unique design using advanced algorithms.",
          cta: "Try comprehensive reading",
        },
      ];

  const howItWorks = isCs
    ? [
        {
          image: "/images/how-gifts.png",
          title: "1. Pochopte své dary",
          desc: "Zjistěte svůj typ, profil a autoritu. Poznejte, jak přirozeně fungujete a co vás skutečně naplňuje.",
        },
        {
          image: "/images/how-relationships.png",
          title: "2. Zlepšete své vztahy",
          desc: "Porovnejte mapy s blízkými. Pochopte dynamiku vašich vztahů a jak spolu lépe fungovat.",
        },
        {
          image: "/images/how-purpose.png",
          title: "3. Najděte svůj účel",
          desc: "Prozkoumejte svůj inkarnační kříž a brány. Objevte své životní poslání a směr.",
        },
      ]
    : [
        {
          image: "/images/how-gifts.png",
          title: "1. Understand your gifts",
          desc: "Discover your type, profile, and authority. Learn how you naturally operate and what truly fulfills you.",
        },
        {
          image: "/images/how-relationships.png",
          title: "2. Improve your relationships",
          desc: "Compare charts with loved ones. Understand the dynamics of your relationships and how to work better together.",
        },
        {
          image: "/images/how-purpose.png",
          title: "3. Find your purpose",
          desc: "Explore your incarnation cross and gates. Discover your life mission and direction.",
        },
      ];

  const blogPosts = isCs
    ? [
        {
          slug: "co-je-human-design",
          title: "Co je Human Design?",
          excerpt:
            "Kompletní průvodce pro začátečníky — zjistěte, jak systém funguje a jak vám může pomoci.",
          cat: "Základy HD",
          catStyle: "bg-amber-100 text-amber-800 border-amber-200",
          time: 8,
          cover: "/images/blog_what_is_hd.png",
          featured: true,
        },
        {
          slug: "5-typu-human-design",
          title: "5 typů v Human Designu",
          excerpt:
            "Poznejte všech 5 typů — Generátor, Projektor, Manifestor, MG a Reflektor.",
          cat: "Typy",
          catStyle: "bg-violet-100 text-violet-800 border-violet-200",
          time: 10,
          cover: "/images/blog_5_types.png",
          featured: false,
        },
        {
          slug: "strategie-v-human-design",
          title: "Strategie: Klíč ke správným rozhodnutím",
          excerpt:
            "Reagovat, informovat, čekat na pozvání — naučte se svou strategii.",
          cat: "Strategie",
          catStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
          time: 7,
          cover: "/images/blog_strategy.png",
          featured: false,
        },
        {
          slug: "autorita-v-human-design",
          title: "Autorita: Jak dělat správná rozhodnutí",
          excerpt:
            "Emocionální, sakrální, slezinná — každý typ má svůj vnitřní kompas rozhodování.",
          cat: "Autorita",
          catStyle: "bg-rose-100 text-rose-800 border-rose-200",
          time: 9,
          cover: "/images/blog_authority.png",
          featured: false,
        },
        {
          slug: "profily-v-human-design",
          title: "12 profilů v Human Designu",
          excerpt:
            "Váš profil odhaluje vaši životní roli a způsob, jakým se učíte a rostete.",
          cat: "Profily",
          catStyle: "bg-sky-100 text-sky-800 border-sky-200",
          time: 11,
          cover: "/images/blog_profiles.png",
          featured: false,
        },
        {
          slug: "human-design-a-vztahy",
          title: "Human Design a vztahy",
          excerpt:
            "Jak porozumět partnerské dynamice a zlepšit komunikaci s blízkými.",
          cat: "Vztahy",
          catStyle: "bg-pink-100 text-pink-800 border-pink-200",
          time: 8,
          cover: "/images/blog_relationships.png",
          featured: false,
        },
      ]
    : [
        {
          slug: "what-is-human-design",
          title: "What is Human Design?",
          excerpt:
            "A complete beginner's guide — learn how the system works and how it can help you.",
          cat: "HD Basics",
          catStyle: "bg-amber-100 text-amber-800 border-amber-200",
          time: 8,
          cover: "/images/blog_what_is_hd.png",
          featured: true,
        },
        {
          slug: "5-types-human-design",
          title: "5 Human Design Types",
          excerpt:
            "Discover all 5 types — Generator, Projector, Manifestor, MG, and Reflector.",
          cat: "Types",
          catStyle: "bg-violet-100 text-violet-800 border-violet-200",
          time: 10,
          cover: "/images/blog_5_types.png",
          featured: false,
        },
        {
          slug: "human-design-strategy",
          title: "Strategy: The Key to Right Decisions",
          excerpt:
            "Respond, inform, wait for the invitation — learn your unique strategy.",
          cat: "Strategy",
          catStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
          time: 7,
          cover: "/images/blog_strategy.png",
          featured: false,
        },
        {
          slug: "human-design-authority",
          title: "Inner Authority Explained",
          excerpt:
            "Emotional, sacral, splenic — every type has its own inner compass for decisions.",
          cat: "Authority",
          catStyle: "bg-rose-100 text-rose-800 border-rose-200",
          time: 9,
          cover: "/images/blog_authority.png",
          featured: false,
        },
        {
          slug: "human-design-profiles",
          title: "12 Human Design Profiles",
          excerpt:
            "Your profile reveals your life role and the way you learn, grow, and connect.",
          cat: "Profiles",
          catStyle: "bg-sky-100 text-sky-800 border-sky-200",
          time: 11,
          cover: "/images/blog_profiles.png",
          featured: false,
        },
        {
          slug: "human-design-relationships",
          title: "Human Design & Relationships",
          excerpt:
            "Understand partnership dynamics and improve communication with loved ones.",
          cat: "Relationships",
          catStyle: "bg-pink-100 text-pink-800 border-pink-200",
          time: 8,
          cover: "/images/blog_relationships.png",
          featured: false,
        },
      ];

  if (!isCs && isPremiumUsDomain) {
    return <PremiumUSHome localePath={localePath} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Editorial hero: free chart is the primary action; visual chart is an illustrative sample. */}
      <section className="hd-wow-hero" aria-labelledby="hd-wow-title">
        <div className="hd-wow-ambient" aria-hidden="true" />
        <div className="hd-wow-layout">
          <div className="hd-wow-intro">
            <p className="hd-wow-eyebrow">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {isCs ? "SEBEPOZNÁNÍ • REFLEXE • VLASTNÍ CESTA" : "SELF-DISCOVERY • REFLECTION • YOUR PATH"}
            </p>
            <h1 id="hd-wow-title" className="hd-wow-title">
              {isCs ? "Objevte svou jedinečnou" : "Discover your unique"}
              <span>{isCs ? " energetickou mapu" : " energy blueprint"}</span>
            </h1>
            <p className="hd-wow-description">
              {isCs
                ? "Prozkoumejte svůj Human Design typ, strategii a autoritu. Začněte bezplatnou osobní mapou a rozhodněte se sami, jak hluboko chcete jít."
                : "Explore your Human Design type, strategy and authority. Start with a free personal chart, then choose how deeply you want to explore."}
            </p>
            <div className="hd-wow-actions">
              <Button asChild size="lg" className="hd-wow-primary">
                <Link href={localePath("/calculate")}>
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                  {isCs ? "Vytvořit mapu zdarma" : "Create my free chart"}
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </Link>
              </Button>
              <Button type="button" size="lg" variant="outline" className="hd-wow-secondary" onClick={() => setShowQuiz(true)}>
                <span className="hd-wow-play"><ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
                {isCs ? "Nevíte čas narození?" : "Don't know your birth time?"}
              </Button>
            </div>
            <p className="hd-wow-hint">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              {isCs ? "Základní mapa zdarma · Podrobný Blueprint je volitelný" : "Free basic chart · In-depth Blueprint available separately"}
            </p>
            <div className="hd-wow-benefits">
              {[
                { icon: Sparkles, label: isCs ? "Poznejte své dary" : "Explore your strengths", detail: isCs ? "a jedinečné nastavení" : "and unique design" },
                { icon: Users, label: isCs ? "Lépe chápejte vztahy" : "Explore relationships", detail: isCs ? "a své interakce" : "and connection patterns" },
                { icon: Compass, label: isCs ? "Objevte svou strategii" : "Discover your strategy", detail: isCs ? "a vnitřní autoritu" : "and inner authority" },
                { icon: Star, label: isCs ? "Prostor pro sebereflexi" : "Make space to reflect", detail: isCs ? "svým vlastním tempem" : "at your own pace" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div className="hd-wow-benefit" key={item.label}>
                    <span className="hd-wow-benefit-icon"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                    <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hd-wow-art" aria-label={isCs ? "Ilustrativní náhled Human Design mapy" : "Illustrative Human Design chart preview"}>
            <div className="hd-wow-orbit hd-wow-orbit-one" aria-hidden="true" />
            <div className="hd-wow-orbit hd-wow-orbit-two" aria-hidden="true" />
            <div className="hd-wow-image-halo" aria-hidden="true" />
            <img className="hd-wow-portrait" src="/images/brand/veleknezka-master-v1.png" alt="" fetchPriority="high" decoding="async" />
            <span className="hd-wow-spark hd-wow-spark-a" aria-hidden="true">✦</span>
            <span className="hd-wow-spark hd-wow-spark-b" aria-hidden="true">✧</span>
            <span className="hd-wow-spark hd-wow-spark-c" aria-hidden="true">✦</span>
            <div className="hd-wow-chart-preview">
              <span className="hd-wow-preview-kicker">{isCs ? "UKÁZKA VÝSTUPU" : "CHART PREVIEW"}</span>
              <h2>{isCs ? "Vaše Human Design mapa" : "Your Human Design chart"}</h2>
              <div className="hd-wow-preview-content">
                <svg viewBox="0 0 132 196" role="img" aria-label={isCs ? "Ilustrativní diagram center" : "Illustrative center diagram"}>
                  <g fill="none" stroke="#c7a263" strokeWidth="1.3" opacity="0.85">
                    <path d="M66 13 35 52 66 92 97 52 66 13ZM35 52 35 122 66 171 97 122 97 52ZM66 92V171M35 122H97M35 52 97 122M97 52 35 122"/>
                    <path d="M66 13V187M24 82H108" strokeDasharray="3 4" opacity=".55"/>
                  </g>
                  <path d="M66 14 51 40 81 40Z" fill="#ebbc78" stroke="#b98948"/>
                  <rect x="53" y="53" width="26" height="26" rx="3" transform="rotate(45 66 66)" fill="#edc4b6" stroke="#b78967"/>
                  <rect x="51" y="88" width="30" height="30" rx="3" fill="#c1a4e5" stroke="#9675c8"/>
                  <path d="M66 137 47 166H85Z" fill="#e3ac6a" stroke="#ae8251"/>
                  <path d="M66 183 52 158H80Z" fill="#f6d9a2" stroke="#b89057"/>
                  <g fill="#fff" stroke="#c7a263"><circle cx="66" cy="14" r="3"/><circle cx="35" cy="52" r="3"/><circle cx="97" cy="52" r="3"/><circle cx="35" cy="122" r="3"/><circle cx="97" cy="122" r="3"/><circle cx="66" cy="183" r="3"/></g>
                </svg>
                <div className="hd-wow-preview-fields">
                  {[
                    [isCs ? "Typ" : "Type", isCs ? "Váš typ" : "Your type"],
                    [isCs ? "Strategie" : "Strategy", isCs ? "Vaše strategie" : "Your strategy"],
                    [isCs ? "Autorita" : "Authority", isCs ? "Vaše autorita" : "Your authority"],
                    [isCs ? "Profil" : "Profile", isCs ? "Váš profil" : "Your profile"],
                  ].map(([name, value]) => <div key={name}><span>{name}</span><b>{value}</b></div>)}
                </div>
              </div>
              <p>{isCs ? "Skutečnou mapu vypočítáme z vašich údajů narození." : "Your actual chart is calculated from your birth details."}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="hd-wow-proof" aria-label={isCs ? "Co získáte" : "What you get"}>
        <div className="hd-wow-proof-grid">
          {[
            { icon: CheckCircle2, name: isCs ? "Mapa zdarma" : "Free chart", text: isCs ? "Základní výpočet bez platby" : "Basic calculation at no cost" },
            { icon: Compass, name: isCs ? "Vlastní BodyGraph" : "Personal BodyGraph", text: isCs ? "Z vašich údajů narození" : "Based on your birth details" },
            { icon: Brain, name: isCs ? "Podrobnější pohled" : "Deeper insights", text: isCs ? "Rozbory dostupné volitelně" : "Optional personalized readings" },
            { icon: Sparkles, name: isCs ? "Praktický průvodce" : "Guided exploration", text: "ORACULUM+" },
          ].map(item => {
            const Icon = item.icon;
            return <div className="hd-wow-proof-item" key={item.name}><Icon aria-hidden="true" className="h-7 w-7" /><span><strong>{item.name}</strong><small>{item.text}</small></span></div>;
          })}
        </div>
      </div>

      <section className="hd-wow-oraculum sacral-sunset-field" aria-labelledby="hd-wow-oraculum-title">
        <span className="sacral-ripple-ring sacral-oraculum-ripple" aria-hidden="true" />
        <span className="sacral-ripple-ring sacral-oraculum-ripple sacral-ripple-ring--two" aria-hidden="true" />
        <div className="hd-wow-oraculum-layout">
          <div className="hd-wow-oraculum-visual">
            <img src="/images/brand/marie-landing-v1.webp" alt={isCs ? "Digitální průvodkyně ORACULUM+" : "ORACULUM+ digital guide"} loading="lazy" decoding="async" />
            <div className="hd-wow-chat-bubble hd-wow-chat-one">{isCs ? "Co bych dnes mohl/a prozkoumat?" : "What could I explore today?"}</div>
            <div className="hd-wow-chat-bubble hd-wow-chat-two"><Sparkles aria-hidden="true" className="h-4 w-4" /> ORACULUM+</div>
          </div>
          <div className="hd-wow-oraculum-copy">
            <p className="hd-wow-eyebrow"><Sparkles aria-hidden="true" className="h-4 w-4" /> {isCs ? "VÁŠ OSOBNÍ PRŮVODCE" : "YOUR PERSONAL GUIDE"}</p>
            <h2 id="hd-wow-oraculum-title">ORACULUM<span>+</span></h2>
            <h3>{isCs ? "Otázky, které stojí za hlubším prozkoumáním" : "A deeper look at the questions that matter"}</h3>
            <p>{isCs
              ? "Propojte svůj Human Design s otázkami každodenního života. ORACULUM+ vám nabídne podněty k reflexi vašich vztahů, rozhodování a aktuálních témat."
              : "Connect your Human Design chart with everyday questions. ORACULUM+ offers prompts for reflection on relationships, decisions and what matters to you right now."}</p>
            <div className="hd-wow-oraculum-actions">
              <Button asChild className="hd-wow-oraculum-btn"><Link href={localePath("/ai-guide")}>{isCs ? "Otevřít ORACULUM+" : "Explore ORACULUM+"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
              <Link href={localePath("/calculate")} className="hd-wow-oraculum-link">{isCs ? "Nejdřív vytvořit mapu" : "Create my chart first"} →</Link>
            </div>
          </div>
          <div className="hd-wow-oraculum-points" aria-hidden="true">
            <span><Brain className="h-5 w-5" /> {isCs ? "Podněty k sebereflexi" : "Reflective prompts"}</span>
            <span><Users className="h-5 w-5" /> {isCs ? "Vztahy a souvislosti" : "Relationships"}</span>
            <span><Compass className="h-5 w-5" /> {isCs ? "Vlastní cesta" : "Your journey"}</span>
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── 5 Types Section ─────────────────────────────────────────────────── */}
      <section
        className="py-20 bg-gradient-to-b from-white to-purple-50/40 bg-sacred-geometry overflow-hidden"
        style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}
      >
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
              {isCs
                ? "Pět typů lidí a jejich aura"
                : "Five types of people and their aura"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {typesData.map((tp, i) => (
              <motion.div
                key={tp.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
              >
                <TiltCard
                  className={`rounded-2xl border overflow-hidden flex flex-col ${tp.color} shadow-sm hover:shadow-md transition-shadow h-full`}
                >
                  {/* Image */}
                  <div
                    className="w-full bg-white/60 dark:bg-card/60"
                    style={{ height: "260px" }}
                  >
                    <ProgressiveImage
                      src={tp.imgUrl}
                      alt={tp.displayName}
                      className="w-full h-full"
                      imgClassName="object-contain object-top drop-shadow-sm"
                    />
                  </div>
                  {/* Info */}
                  <div className="p-4 text-center flex flex-col gap-1">
                    <p
                      className="text-[10px] md:text-xs font-bold tracking-widest whitespace-pre-line leading-tight"
                      style={{ color: "#555" }}
                    >
                      {tp.displayName}
                    </p>
                    <p
                      className={`text-2xl font-bold leading-none ${tp.pctColor}`}
                    >
                      {tp.pct}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tp.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug mt-1">
                      {tp.role}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug italic">
                      {tp.strategy}
                    </p>
                    <Link
                      href={localePath("/calculate")}
                      className="mt-2 block"
                    >
                      <span className="inline-flex items-center justify-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                        {isCs ? "Zjistit svůj typ" : "Find your type"}{" "}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── How to start — 3 steps ─────────────────────────────────────── */}
      <section
        className="py-20 overflow-hidden"
        style={{ contentVisibility: "auto", containIntrinsicSize: "700px" }}
      >
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {isCs
                ? "Jak začít s poznáváním Human Designu"
                : "How to start exploring Human Design"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isCs
                ? "Tři jednoduché kroky k pochopení vašeho jedinečného designu."
                : "Three simple steps to understanding your unique design."}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => {
              const gradients = [
                "from-purple-500 to-violet-600",
                "from-teal-500 to-emerald-600",
                "from-amber-500 to-orange-600",
              ];
              const btnStyles = [
                "border-purple-400 text-purple-600 hover:bg-purple-500 hover:text-white hover:border-transparent",
                "border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white hover:border-transparent",
                "border-amber-400 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-transparent",
              ];
              return (
                <motion.div
                  key={s.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="relative bg-card rounded-2xl border border-border/40 p-7 md:p-8 text-center shadow-md hover:shadow-xl transition-all group overflow-hidden"
                >
                  {/* Gradient accent top bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradients[i]}`}
                  />
                  {/* Large gradient step number */}
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradients[i]} text-white font-serif text-2xl font-bold flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {s.desc}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-2 font-medium transition-all ${btnStyles[i]}`}
                    asChild
                  >
                    <Link href={localePath("/calculate")}>
                      {s.cta}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section
        className="py-20 bg-muted/30 bg-sacred-geometry"
        style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
      >
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t.home.featuresTitle}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.home.featuresDescription}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl p-6 border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2 text-foreground">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── How it works ───────────────────────────────────────────── */}
      <section
        className="py-20 bg-ethereal dark:bg-card"
        style={{
          background: "var(--tw-dark, #f9f7f2)",
          contentVisibility: "auto",
          containIntrinsicSize: "700px",
        }}
      >
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-center mb-14 text-foreground"
          >
            {isCs ? "Jak to funguje" : "How it works"}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {howItWorks.map(({ image, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center gap-5 group"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 ring-2 ring-purple-200/50 dark:ring-purple-500/30">
                  <ProgressiveImage
                    src={image}
                    alt={title}
                    className="w-full h-full"
                    imgClassName="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-semibold text-lg text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-[260px]">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── Blog Preview — Editorial Layout ──────────────────────────── */}
      <section
        className="py-20"
        style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
      >
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          >
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                {isCs ? "Z našeho blogu" : "From our blog"}
              </h2>
              <p className="text-muted-foreground max-w-lg">
                {isCs
                  ? "Prozkoumejte svět Human Designu s našimi články a průvodci."
                  : "Explore the world of Human Design with our articles and guides."}
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href={localePath("/blog")} className="hidden md:flex">
                {isCs ? "Všechny články" : "All articles"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Featured article — large card */}
            {blogPosts
              .filter(p => p.featured)
              .map(post => (
                <motion.div
                  key={post.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                  variants={scaleIn}
                  className="lg:col-span-7"
                >
                  <Link
                    href={localePath(`/blog/${post.slug}`)}
                    className="no-underline"
                  >
                    <div className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all h-full min-h-[320px] md:min-h-[400px] bg-card border border-border/40">
                      <ProgressiveImage
                        src={post.cover}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full"
                        imgClassName="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                            {post.cat}
                          </span>
                          <span className="text-xs text-white/70">
                            {post.time} min
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                          {post.title}
                        </h3>
                        <p className="text-sm text-white/80 leading-relaxed line-clamp-2 max-w-lg">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

            {/* Compact grid — remaining articles */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {blogPosts
                .filter(p => !p.featured)
                .slice(0, 5)
                .map((post, i) => (
                  <motion.div
                    key={post.slug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={i + 1}
                    variants={scaleIn}
                  >
                    <Link
                      href={localePath(`/blog/${post.slug}`)}
                      className="no-underline"
                    >
                      <TiltCard className="group flex gap-3.5 p-3 rounded-xl border border-border/40 bg-card hover:shadow-md hover:border-primary/20 transition-all h-full">
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          <ProgressiveImage
                            src={post.cover}
                            alt={post.title}
                            className="w-full h-full"
                            imgClassName="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-center gap-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${post.catStyle}`}
                            >
                              {post.cat}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {post.time} min
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block lg:block">
                            {post.excerpt}
                          </p>
                        </div>
                      </TiltCard>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Mobile-only "All articles" button */}
          <div className="text-center md:hidden">
            <Button variant="outline" className="rounded-full" asChild>
              <Link href={localePath("/blog")}>
                {isCs ? "Všechny články" : "All articles"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Real User Testimonials ──────────────────────────────── */}
      <TestimonialsSection />

      {/* ── SEO FAQ Section (Targeting GSC Keywords) ──────────────── */}
      <section
        className="py-16 bg-muted/20 border-t border-border/40"
        style={{ contentVisibility: "auto" }}
      >
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              {isCs ? "Často kladené otázky & SEO" : "FAQ & Human Design Guide"}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mt-1">
              {isCs
                ? "Vše o Human Design Mapě a Kalkulátoru"
                : "Free Human Design Chart Calculator & Reading FAQ"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
              {isCs
                ? "Zjistěte, jak funguje výpočet Human Design mapy v ČR, co znamená váš typ, profil a denní planetární tranzity."
                : "Learn how the free Human Design chart calculator works, discover your bodygraph type, authority, and today's planetary transit readings."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary shrink-0" />
                {isCs
                  ? "Jak vypočítat Human Design mapu zdarma?"
                  : "How to use the Free Human Design Calculator?"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isCs
                  ? "Stačí zadat váš přesný datum, čas a místo narození. Náš bezplatný kalkulátor okamžitě vygeneruje váš osobní bodygraph s přehledem typu, autority a profilu."
                  : "Simply enter your birth date, exact time, and birth location into our free Human Design chart calculator to instantly generate your personalized bodygraph."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary shrink-0" />
                {isCs
                  ? "Co obsahuje bezplatný AI výklad mapy?"
                  : "What is included in the Free Human Design Reading?"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isCs
                  ? "Získáte srozumitelný rozbor v češtině obsahující váš typ (Generátor, Projektor, Manifestor, Reflektor), strategii rozhodování, životní poslání a kanály."
                  : "Our free AI Human Design reading includes your energy type, strategy, inner authority, profile lines, defined centers, and life purpose blueprint."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 shrink-0" />
                {isCs
                  ? "Co je denní tranzit Human Design?"
                  : "What is Human Design Transit Today?"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isCs
                  ? "Denní tranzit sleduje aktuální pozice planet a ukazují, které brány a energetické dráhy ovlivňují vaši mapu a denní rozhodování dnešní den."
                  : "Daily Human Design transits track today's planetary positions and reveal which gates and channels activate your bodygraph energy today."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-2">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                {isCs
                  ? "Jaké jsou Human Design typy a strategie?"
                  : "Human Design Types & Personality Test"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isCs
                  ? "Existuje 5 základních typů: Generátor (37%), Manifestující Generátor (33%), Projektor (20%), Manifestor (9%) a Reflektor (1%). Každý má unikátní strategii."
                  : "Human Design divides energy into 5 core types: Generator, Manifesting Generator, Projector, Manifestor, and Reflector, each with a unique decision-making strategy."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── Social Proof Section ──────────────────────────────────── */}
      <Suspense fallback={null}>
        <SocialProof />
      </Suspense>

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section
        className="py-20 relative overflow-hidden bg-sacred-geometry"
        style={{ contentVisibility: "auto", containIntrinsicSize: "400px" }}
      >
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t.home.ctaTitle}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t.home.ctaDescription}
            </p>
            <Button
              size="lg"
              className="omni-cta-pulse btn-mystical bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 rounded-full"
              asChild
            >
              <Link href={localePath("/calculate")}>
                {t.home.ctaButton}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <FastTypeQuizModal open={showQuiz} onOpenChange={setShowQuiz} />
      <Footer />
    </div>
  );
}
