import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Compass, Brain, Users, Star, BarChart3,
  FileText, Zap, ArrowRight, CheckCircle2, Eye, Lightbulb,
  Heart, Shield, Leaf, ChevronLeft, ChevronRight,
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
      strategy: isCs ? "Strategie: Reagovat na život." : "Strategy: To Respond to life.",
      pct: "37%",
      label: isCs ? "populace" : "of population",
      color: "bg-amber-50 border-amber-200",
      pctColor: "text-orange-500",
      imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/IxAVlaOWqHGkhytp.webp",
    },
    {
      name: "Manifesting Generator",
      displayName: isCs ? "MANIFESTUJÍCÍ\nGENERÁTOR" : "MANIFESTING\nGENERATOR",
      role: isCs ? "Rychlý tvůrce a iniciátor." : "Fast creator and initiator.",
      strategy: isCs ? "Strategie: Reagovat a informovat." : "Strategy: Respond, then Inform.",
      pct: "33%",
      label: isCs ? "populace" : "of population",
      color: "bg-red-50 border-red-200",
      pctColor: "text-red-500",
      imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/qWsAFzAtJmYBPSzE.webp",
    },
    {
      name: "Projector",
      displayName: isCs ? "PROJEKTOR" : "PROJECTOR",
      role: isCs ? "Průvodce a vizionář." : "Guide and visionary.",
      strategy: isCs ? "Strategie: Čekat na pozvání." : "Strategy: Wait for the Invitation.",
      pct: "20%",
      label: isCs ? "populace" : "of population",
      color: "bg-violet-50 border-violet-200",
      pctColor: "text-violet-500",
      imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/uyvogIBNHAiNkHXh.webp",
    },
    {
      name: "Manifestor",
      displayName: "MANIFESTOR",
      role: isCs ? "Iniciátor a katalyzátor." : "Initiator and catalyst.",
      strategy: isCs ? "Strategie: Informovat před akcí." : "Strategy: To Inform before acting.",
      pct: "9%",
      label: isCs ? "populace" : "of population",
      color: "bg-emerald-50 border-emerald-200",
      pctColor: "text-emerald-500",
      imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/rMbULSgMTGcVzRZZ.webp",
    },
    {
      name: "Reflector",
      displayName: isCs ? "REFLEKTOR" : "REFLECTOR",
      role: isCs ? "Zrcadlo a pozorovatel." : "Mirror and observer.",
      strategy: isCs ? "Strategie: Čekat na lunární cyklus." : "Strategy: Wait a Lunar Cycle.",
      pct: "1%",
      label: isCs ? "populace" : "of population",
      color: "bg-slate-50 border-slate-200",
      pctColor: "text-slate-500",
      imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/UWRWlEUvFOKUinyN.webp",
    },
  ];
}

function getTestimonials(isCs: boolean) {
  if (isCs) {
    return [
      { name: "Jana K.", text: "Konečně jsem pochopila, proč mi některé věci nejdou tak snadno jako ostatním. Human Design mi dal odpovědi, které jsem hledala roky.", initials: "JK", color: "#e8d5b7" },
      { name: "Martin S.", text: "Byl jsem skeptik, ale po přečtení svého profilu jsem zůstával bez dechu. Přesně vystihuje moje silné stránky i výzvy.", initials: "MS", color: "#d4e8e2" },
      { name: "Petra N.", text: "AI rozbor byl neskutečně podrobný a osobní. Doporučuji každému, kdo chce lépe poznat sám sebe.", initials: "PN", color: "#ddd4e8" },
      { name: "Tomáš H.", text: "Díky strategii Manifestora jsem začal informovat lidi před svými akcemi a vztahy se dramaticky zlepšily.", initials: "TH", color: "#e8e4d4" },
    ];
  }
  return [
    { name: "Sarah K.", text: "I finally understood why some things don't come as easily to me as they do to others. Human Design gave me answers I'd been searching for years.", initials: "SK", color: "#e8d5b7" },
    { name: "Michael S.", text: "I was a skeptic, but after reading my profile I was speechless. It perfectly captures my strengths and challenges.", initials: "MS", color: "#d4e8e2" },
    { name: "Emma N.", text: "The AI reading was incredibly detailed and personal. I recommend it to anyone who wants to understand themselves better.", initials: "EN", color: "#ddd4e8" },
    { name: "Thomas H.", text: "Thanks to my Manifestor strategy, I started informing people before taking action and my relationships improved dramatically.", initials: "TH", color: "#e8e4d4" },
  ];
}

function TestimonialsSection({ isCs }: { isCs: boolean }) {
  const testimonials = getTestimonials(isCs);
  const [active, setActive] = useState(0);
  const count = testimonials.length;
  const visible = [active, (active + 1) % count, (active + 2) % count];

  return (
    <section className="py-20 border-t border-border/50" style={{ background: '#fff' }}>
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: '#1a1a1a' }}
        >
          {isCs ? "Reference" : "Testimonials"}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {visible.map((idx) => {
            const tm = testimonials[idx];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-6 border border-border/40 bg-card shadow-sm flex gap-4 items-start"
              >
                <div
                  className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                  style={{ background: tm.color, color: '#555' }}
                >
                  {tm.initials}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 italic">"{tm.text}"</p>
                  <p className="text-sm font-semibold text-foreground">{tm.name}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setActive((active - 1 + count) % count)}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{ background: i === active ? '#2a9d8f' : '#ccc' }}
              />
            ))}
          </div>
          <button
            onClick={() => setActive((active + 1) % count)}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const isCs = locale === "cs";

  useEffect(() => {
    if (isCs) {
      document.title = "Human Design Mapa Zdarma | Kalkulačka & AI Výklad";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Vypočítejte svou Human Design mapu zdarma. Zjistěte svůj typ, strategii, autoritu a získejte AI výklad."
      );
      document.querySelector('meta[name="keywords"]')?.setAttribute(
        "content",
        "human design, human design mapa, bodygraph kalkulačka, human design zdarma"
      );
    } else {
      document.title = "Free Human Design Chart Calculator & AI Reading";
      document.querySelector('meta[name="description"]')?.setAttribute(
        "content",
        "Calculate your free Human Design chart. Discover your type, strategy, authority and get a personalized AI reading."
      );
      document.querySelector('meta[name="keywords"]')?.setAttribute(
        "content",
        "human design, human design chart, bodygraph calculator, free human design"
      );
    }
  }, [locale, isCs]);
  const typesData = getTypesData(isCs);

  const features = [
    { icon: Compass, ...t.home.features.chartCalc },
    { icon: Brain, ...t.home.features.aiReadings },
    { icon: Star, ...t.home.features.transits },
    { icon: Users, ...t.home.features.comparison },
    { icon: BarChart3, ...t.home.features.variables },
    { icon: FileText, ...t.home.features.pdfReports },
  ];

  const benefits = isCs
    ? ["Pochopte své dary", "Zlepšete své vztahy", "Dělejte správná rozhodnutí", "Najděte svůj účel"]
    : ["Understand your gifts", "Improve your relationships", "Make the right decisions", "Find your purpose"];

  const steps = isCs
    ? [
        { step: "1", title: "Vygenerujte si mapu", desc: "Zadejte datum, čas a místo narození. Vaše mapa se vygeneruje během několika sekund.", cta: "Získat mapu zdarma" },
        { step: "2", title: "Prozkoumejte svůj design", desc: "Prozkoumejte svůj typ, profil, autoritu, centra, brány a dráhy. Každý detail má svůj význam.", cta: "Začít prozkoumávat" },
        { step: "3", title: "Získejte AI rozbor", desc: "Nechte si vygenerovat personalizovaný rozbor poháněný umělou inteligencí přímo o vás.", cta: "Vyzkoušet AI rozbor" },
      ]
    : [
        { step: "1", title: "Generate your chart", desc: "Enter your date, time, and place of birth. Your chart will be generated in seconds.", cta: "Get your free chart" },
        { step: "2", title: "Explore your design", desc: "Explore your type, profile, authority, centers, gates, and channels. Every detail has meaning.", cta: "Start exploring" },
        { step: "3", title: "Get an AI reading", desc: "Get a personalized AI-powered reading based on your unique design.", cta: "Try AI reading" },
      ];

  const howItWorks = isCs
    ? [
        { Icon: CheckCircle2, title: "1. Pochopte své dary", desc: "Zjistěte svůj typ, profil a autoritu. Poznejte, jak přirozeně fungujete a co vás skutečně naplňuje." },
        { Icon: Users, title: "2. Zlepšete své vztahy", desc: "Porovnejte mapy s blízkými. Pochopte dynamiku vašich vztahů a jak spolu lépe fungovat." },
        { Icon: Lightbulb, title: "3. Najděte svůj účel", desc: "Prozkoumejte svůj inkarnační kříž a brány. Objevte své životní poslání a směr." },
      ]
    : [
        { Icon: CheckCircle2, title: "1. Understand your gifts", desc: "Discover your type, profile, and authority. Learn how you naturally operate and what truly fulfills you." },
        { Icon: Users, title: "2. Improve your relationships", desc: "Compare charts with loved ones. Understand the dynamics of your relationships and how to work better together." },
        { Icon: Lightbulb, title: "3. Find your purpose", desc: "Explore your incarnation cross and gates. Discover your life mission and direction." },
      ];

  const blogPosts = isCs
    ? [
        { slug: "co-je-human-design", title: "Co je Human Design?", excerpt: "Kompletní průvodce pro začátečníky — zjistěte, jak systém funguje a jak vám může pomoci.", cat: "Základy HD", catStyle: "bg-amber-100 text-amber-800 border-amber-200", time: 8 },
        { slug: "5-typu-human-design", title: "5 typů v Human Design", excerpt: "Poznejte všech 5 typů — Generátor, Projektor, Manifestor, MG a Reflektor.", cat: "Typy", catStyle: "bg-violet-100 text-violet-800 border-violet-200", time: 10 },
        { slug: "strategie-v-human-design", title: "Strategie: Klíč ke správným rozhodnutím", excerpt: "Reagovat, informovat, čekat na pozvání — naučte se svou strategii.", cat: "Strategie", catStyle: "bg-emerald-100 text-emerald-800 border-emerald-200", time: 7 },
      ]
    : [
        { slug: "co-je-human-design", title: "What is Human Design?", excerpt: "A complete beginner's guide — learn how the system works and how it can help you.", cat: "HD Basics", catStyle: "bg-amber-100 text-amber-800 border-amber-200", time: 8 },
        { slug: "5-typu-human-design", title: "5 Human Design Types", excerpt: "Discover all 5 types — Generator, Projector, Manifestor, MG, and Reflector.", cat: "Types", catStyle: "bg-violet-100 text-violet-800 border-violet-200", time: 10 },
        { slug: "strategie-v-human-design", title: "Strategy: The Key to Right Decisions", excerpt: "Respond, inform, wait for the invitation — learn your strategy.", cat: "Strategy", catStyle: "bg-emerald-100 text-emerald-800 border-emerald-200", time: 7 },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col justify-center overflow-hidden"
        style={{
          minHeight: '55vh',
          backgroundImage: 'url(https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/WUcqCUXbXPPoyTKt.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f5f0f8',
        }}
      >
        {/* Animated orbs */}
        <div className="hero-orb-1 absolute pointer-events-none" style={{ width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(139,92,246,0.45) 0%, rgba(167,139,250,0.20) 50%, transparent 70%)', top: '-120px', left: '-80px', filter: 'blur(40px)', zIndex: 1 }} />
        <div className="hero-orb-2 absolute pointer-events-none" style={{ width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle at 60% 60%, rgba(251,191,36,0.38) 0%, rgba(252,211,77,0.18) 50%, transparent 70%)', bottom: '-160px', right: '-100px', filter: 'blur(50px)', zIndex: 1 }} />
        <div className="hero-orb-3 absolute pointer-events-none" style={{ width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(42,157,143,0.35) 0%, rgba(94,234,212,0.15) 50%, transparent 70%)', top: '30%', left: '55%', filter: 'blur(35px)', zIndex: 1 }} />
        <div className="hero-orb-4 absolute pointer-events-none" style={{ width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(244,114,182,0.32) 0%, rgba(251,207,232,0.14) 50%, transparent 70%)', top: '10%', right: '20%', filter: 'blur(30px)', zIndex: 1 }} />

        {/* White overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.42)', zIndex: 2 }} />

        <div className="container relative z-10 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial="hidden" animate="visible" custom={0} variants={fadeUp}
              className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight"
              style={{ color: '#1a1a1a' }}
            >
              {isCs ? <>Objevte svou jedinečnou<br />energetickou mapu</> : <>Discover Your Unique<br />Energy Blueprint</>}
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
              style={{ color: '#555' }}
            >
              {isCs
                ? "Human Design vám odhalí, jak fungujete, jak se rozhodujete a jak žít v souladu se svou přirozeností. Získejte svůj rozbor zdarma."
                : "Human Design reveals how you operate, how you make decisions, and how to live in alignment with your true nature. Get your free chart now."}
            </motion.p>

            <motion.div
              initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link href={localePath("/calculate")}>
                <Button
                  size="lg"
                  className="text-white text-base px-8 py-6 shadow-lg transition-all hover:scale-105 rounded-lg"
                  style={{ background: '#2a9d8f', border: 'none' }}
                >
                  {isCs ? "Vytvořit moji mapu zdarma" : "Get my free chart"}
                </Button>
              </Link>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border bg-white/80 shadow-sm" style={{ borderColor: '#d4af37' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#fef3c7', border: '2px solid #d4af37', color: '#92400e' }}>
                  TRS
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-none" style={{ color: '#1a1a1a' }}>{isCs ? "Přes 1 200" : "Over 1,200"}</p>
                  <p className="text-xs" style={{ color: '#777' }}>{isCs ? "spokojených uživatelů" : "satisfied users"}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="flex flex-wrap justify-center gap-x-8 gap-y-3"
            >
              {benefits.map((label) => (
                <span key={label} className="flex items-center gap-2 text-sm" style={{ color: '#444' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#2a9d8f' }} />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 5 Types Section ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-purple-50/40">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} custom={0} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
              {isCs ? "Pět typů lidí a jejich aura" : "Five types of people and their aura"}
            </h2>
          </motion.div>

          <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-8 mb-12 max-w-5xl mx-auto overflow-x-auto pb-2 md:overflow-visible md:pb-0 snap-x snap-mandatory md:snap-none">
            {typesData.map((tp, i) => (
              <motion.div
                key={tp.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-3 flex-shrink-0 w-40 md:w-auto snap-center"
              >
                <div className="w-full aspect-[3/4] flex items-center justify-center">
                  <img src={tp.imgUrl} alt={tp.displayName} className="w-full h-full object-contain drop-shadow-sm" loading="lazy" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {typesData.map((tp, i) => (
              <motion.div
                key={tp.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-xl p-4 border text-center ${tp.color}`}
              >
                <p className="text-[10px] md:text-xs font-bold tracking-widest text-center whitespace-pre-line leading-tight mb-2" style={{ color: '#555' }}>{tp.displayName}</p>
                <p className={`text-2xl md:text-3xl font-bold leading-none mb-1 ${tp.pctColor}`}>{tp.pct}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{tp.label}</p>
                <p className="text-xs text-muted-foreground leading-snug mb-1">{tp.role}</p>
                <p className="text-[11px] text-muted-foreground leading-snug italic">{tp.strategy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to start — 3 steps ───────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {isCs ? "Jak začít s poznáváním Human Designu" : "How to start exploring Human Design"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isCs ? "Tři jednoduché kroky k pochopení vašeho jedinečného designu." : "Three simple steps to understanding your unique design."}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i} variants={fadeUp}
                className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-serif text-2xl font-bold flex items-center justify-center mx-auto mb-5">{s.step}</div>
                <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
                <Link href={localePath("/calculate")}>
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
                    {s.cta}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={fadeUp} className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">{t.home.featuresTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.home.featuresDescription}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i} variants={scaleIn}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl p-6 border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50" style={{ background: '#f9f7f2' }}>
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-center mb-14" style={{ color: '#1a1a1a' }}
          >
            {isCs ? "Jak to funguje" : "How it works"}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {howItWorks.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#e6f4f2', border: '2px solid #2a9d8f' }}>
                  <Icon className="w-7 h-7" style={{ color: '#2a9d8f' }} />
                </div>
                <h3 className="font-semibold text-base" style={{ color: '#1a1a1a' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#666' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <TestimonialsSection isCs={isCs} />

      {/* ── Blog Preview ────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={fadeUp} className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              {isCs ? "Z našeho blogu" : "From our blog"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isCs ? "Prozkoumejte svět Human Designu s našimi články a průvodci." : "Explore the world of Human Design with our articles and guides."}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {blogPosts.map((post, i) => (
              <motion.div key={post.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={scaleIn}>
                <Link href={localePath(`/blog/${post.slug}`)} className="no-underline">
                  <div className="group border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all h-full bg-card">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${post.catStyle}`}>{post.cat}</span>
                        <span className="text-xs text-muted-foreground">{post.time} min</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link href={localePath("/blog")}>
              <Button variant="outline" className="rounded-full">
                {isCs ? "Všechny články" : "All articles"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={fadeUp} className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">{t.home.ctaTitle}</h2>
            <p className="text-muted-foreground mb-8">{t.home.ctaDescription}</p>
            <Link href={localePath("/calculate")}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 rounded-full">
                {t.home.ctaButton}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
