import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
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
// Generator (orange), MG (orange-red), Projector (purple), Manifestor (green), Reflector (grey)

const TYPES_DATA = [
  {
    name: "Generator",
    czechName: "GENERÁTOR",
    displayName: "Generátor",
    role: "Budovatel a tvůrce.",
    strategy: "Strategie: Reagovat na život.",
    pct: "37%",
    label: "populace",
    color: "bg-amber-50 border-amber-200",
    pctColor: "text-orange-500",
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/muZUBTOiGqlHxeWJ.webp",
  },
  {
    name: "Manifesting Generator",
    czechName: "MANIFESTUJÍ CÍ\nGENERÁTOR",
    displayName: "Manifestující Generátor",
    role: "Rychlý tvůrce a iniciátor.",
    strategy: "Strategie: Reagovat a informovat.",
    pct: "33%",
    label: "populace",
    color: "bg-red-50 border-red-200",
    pctColor: "text-red-500",
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/flYuNwJecllrpktS.webp",
  },
  {
    name: "Projector",
    czechName: "PROJEKTOR",
    displayName: "Projektor",
    role: "Průvodce a vizionář.",
    strategy: "Strategie: Čekat na pozvání.",
    pct: "20%",
    label: "populace",
    color: "bg-violet-50 border-violet-200",
    pctColor: "text-violet-500",
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/wSJjlYzTWUUvYwnp.webp",
  },
  {
    name: "Manifestor",
    czechName: "MANIFESTOR",
    displayName: "Manifestor",
    role: "Iniciátor a katalyzátor.",
    strategy: "Strategie: Informovat před akcí.",
    pct: "9%",
    label: "populace",
    color: "bg-emerald-50 border-emerald-200",
    pctColor: "text-emerald-500",
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/hzdETKHRqUCWhlsa.webp",
  },
  {
    name: "Reflector",
    czechName: "REFLEKTOR",
    displayName: "Reflektor",
    role: "Zrcadlo a pozorovatel.",
    strategy: "Strategie: Čekat na lunární cyklus.",
    pct: "1%",
    label: "populace",
    color: "bg-slate-50 border-slate-200",
    pctColor: "text-slate-500",
    imgUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/TTYeYumBkHxZdvTr.webp",
  },
];

const BENEFITS = [
  { icon: Eye, label: "Poznejte sebe sama" },
  { icon: Shield, label: "Respektujte svoji jedinečnost" },
  { icon: Lightbulb, label: "Dělejte správná rozhodnutí" },
  { icon: Heart, label: "Přestaňte si stát v cestě vrozené kvality" },
  { icon: Leaf, label: "Žijte život, který je opravdu váš." },
];


const TESTIMONIALS = [
  {
    name: "Jana K.",
    text: "Konecne jsem pochopila, proc mi nektere veci nejdou tak snadno jako ostatnim. Human Design mi dal odpovedi, ktere jsem hledala roky.",
    initials: "JK",
    color: "#e8d5b7",
  },
  {
    name: "Martin S.",
    text: "Byl jsem skeptik, ale po precteni sveho profilu jsem zustaval bez dechu. Presne vystihuje moje silne stranky i vyzvy.",
    initials: "MS",
    color: "#d4e8e2",
  },
  {
    name: "Petra N.",
    text: "AI rozbor byl neskutecne podrobny a osobni. Doporucuji kazdemu, kdo chce lepe poznat sam sebe.",
    initials: "PN",
    color: "#ddd4e8",
  },
  {
    name: "Tomas H.",
    text: "Diky strategii Manifestora jsem zacal informovat lidi pred svymi akcemi a vztahy se dramaticky zlepsily.",
    initials: "TH",
    color: "#e8e4d4",
  },
];

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const count = TESTIMONIALS.length;
  const visible = [active, (active + 1) % count, (active + 2) % count];

  return (
    <section className="py-20 border-t border-border/50" style={{background: '#fff'}}>
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-4xl font-bold text-center mb-12"
          style={{color: '#1a1a1a'}}
        >
          Reference
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {visible.map((idx) => {
            const t = TESTIMONIALS[idx];
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
                  style={{background: t.color, color: '#555'}}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 italic">"{t.text}"</p>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Dots + arrows */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setActive((active - 1 + count) % count)}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{background: i === active ? '#2a9d8f' : '#ccc'}}
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
  const { t } = useTranslation();

  const features = [
    { icon: Compass, ...t.home.features.chartCalc },
    { icon: Brain, ...t.home.features.aiReadings },
    { icon: Star, ...t.home.features.transits },
    { icon: Users, ...t.home.features.comparison },
    { icon: BarChart3, ...t.home.features.variables },
    { icon: FileText, ...t.home.features.pdfReports },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden" style={{background: '#f5f0e8'}}>
        {/* Flower of Life SVG tiled background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          style={{opacity: 0.18}}
        >
          <defs>
            <pattern id="fol" x="0" y="0" width="120" height="104" patternUnits="userSpaceOnUse">
              {/* Flower of Life — 7 circles in hexagonal arrangement */}
              <circle cx="60" cy="52" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              <circle cx="90" cy="52" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              <circle cx="30" cy="52" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              <circle cx="75" cy="26" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              <circle cx="45" cy="26" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              <circle cx="75" cy="78" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              <circle cx="45" cy="78" r="30" fill="none" stroke="#b8960c" strokeWidth="0.8"/>
              {/* Outer ring */}
              <circle cx="60" cy="52" r="60" fill="none" stroke="#b8960c" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fol)"/>
        </svg>

        {/* Golden radial glow in center */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.10) 40%, transparent 70%)',
          }}
        />

        <div className="container relative z-10 py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight"
              style={{color: '#1a1a1a'}}
            >
              Objevte svou jedinečnou<br />energetickou mapu
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
              style={{color: '#555'}}
            >
              Human Design vám odhalí, jak fungujete, jak se rozhodujete a jak
              žít v souladu se svou přirozeností. Získejte svůj rozbor zdarma.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link href="/calculate">
                <Button
                  size="lg"
                  className="text-white text-base px-8 py-6 shadow-lg transition-all hover:scale-105 rounded-lg"
                  style={{background: '#2a9d8f', border: 'none'}}
                >
                  Vytvořit moji mapu zdarma
                </Button>
              </Link>

              {/* Trust badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border bg-white/80 shadow-sm" style={{borderColor: '#d4af37'}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{background: '#fef3c7', border: '2px solid #d4af37', color: '#92400e'}}>
                  TRS
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-none" style={{color: '#1a1a1a'}}>Přes 1 200</p>
                  <p className="text-xs" style={{color: '#777'}}>spokojených uživatelů</p>
                </div>
              </div>
            </motion.div>

            {/* 4 checkmark benefits */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-x-8 gap-y-3"
            >
              {[
                'Pochopte své dary',
                'Zlepšete své vztahy',
                'Dělejte správná rozhodnutí',
                'Najděte svůj účel',
              ].map((label) => (
                <span key={label} className="flex items-center gap-2 text-sm" style={{color: '#444'}}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{color: '#2a9d8f'}} />
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
              Pět typů lidí a jejich aura
            </h2>
          </motion.div>

          {/* Aura figures row */}
          <div className="grid grid-cols-5 gap-3 md:gap-6 mb-12 max-w-4xl mx-auto">
            {TYPES_DATA.map((tp, i) => (
              <motion.div
                key={tp.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-3"
              >
                {/* Aura figure */}
                <div className="w-full aspect-[3/4] flex items-center justify-center">
                  <img
                    src={tp.imgUrl}
                    alt={tp.czechName}
                    className="w-full h-full object-contain drop-shadow-sm"
                    loading="lazy"
                  />
                </div>
                {/* Type name */}
                <p className="text-[10px] md:text-xs font-bold text-foreground tracking-wide text-center whitespace-pre-line leading-tight">
                  {tp.czechName}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Description cards — all 5 types */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {TYPES_DATA.map((tp, i) => (
              <motion.div
                key={tp.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-xl p-4 border text-center ${tp.color}`}
              >
                <p className={`text-sm font-bold mb-1 ${tp.pctColor}`}>{tp.displayName}</p>
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">Jak začít s poznáváním Human Designu</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tři jednoduché kroky k pochopení vašeho jedinečného designu.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Vygenerujte si mapu",
                desc: "Zadejte datum, čas a místo narození. Vaše mapa se vygeneruje během několika sekund.",
                link: "/calculate",
                cta: "Získat mapu zdarma",
              },
              {
                step: "2",
                title: "Prozkoumejte svůj design",
                desc: "Prozkoumejte svůj typ, profil, autoritu, centra, brány a dráhy. Každý detail má svůj význam.",
                link: "/calculate",
                cta: "Začít prozkoumávat",
              },
              {
                step: "3",
                title: "Získejte AI rozbor",
                desc: "Nechte si vygenerovat personalizovaný rozbor poháněný umělou inteligencí přímo o vás.",
                link: "/calculate",
                cta: "Vyzkoušet AI rozbor",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={fadeUp}
                className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-serif text-2xl font-bold flex items-center justify-center mx-auto mb-5">
                  {s.step}
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
                <Link href={s.link}>
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">{t.home.featuresTitle}</h2>
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
                <h3 className="font-serif text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jak to funguje ─────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50" style={{background: '#f9f7f2'}}>
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-center mb-14"
            style={{color: '#1a1a1a'}}
          >
            Jak to funguje
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              {
                Icon: CheckCircle2,
                title: "1. Pochopte sve dary",
                desc: "Zjistete svuj typ, profil a autoritu. Poznejte, jak prirozeně fungujete a co vas skutecne naplnuje.",
              },
              {
                Icon: Users,
                title: "2. Zlepsete sve vztahy",
                desc: "Porovnejte mapy s blizkymi. Pochopte dynamiku vasich vztahu a jak spolu lepe fungovat.",
              },
              {
                Icon: Lightbulb,
                title: "3. Najdete svuj ucel",
                desc: "Prozkoumejte svuj inkarnacni kriz a brany. Objevte sve zivotni poslani a smer.",
              },
            ].map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background: '#e6f4f2', border: '2px solid #2a9d8f'}}>
                  <Icon className="w-7 h-7" style={{color: '#2a9d8f'}} />
                </div>
                <h3 className="font-semibold text-base" style={{color: '#1a1a1a'}}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{color: '#666'}}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reference ──────────────────────────────────────────────────────── */}
      <TestimonialsSection />

            {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/50 relative overflow-hidden">
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
            <Link href="/calculate">
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
