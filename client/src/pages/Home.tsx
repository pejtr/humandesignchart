import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Compass, Brain, Sparkles, Users, Star, BarChart3,
  FileText, Zap, ArrowRight, CheckCircle2, Eye, Lightbulb,
  Heart, Shield, Leaf,
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

// ─── Inline SVG aura figures for each type ──────────────────────────────────
// Each type has a silhouette + geometric aura shape + glow color

function GeneratorFigure() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Glow */}
      <circle cx="60" cy="90" r="55" fill="#F97316" fillOpacity="0.18" />
      {/* Flower of Life circles */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 60 + 22 * Math.cos(rad);
        const cy = 90 + 22 * Math.sin(rad);
        return <circle key={i} cx={cx} cy={cy} r="22" stroke="#F97316" strokeWidth="1" strokeOpacity="0.5" />;
      })}
      <circle cx="60" cy="90" r="22" stroke="#F97316" strokeWidth="1" strokeOpacity="0.5" />
      {/* Body silhouette */}
      <ellipse cx="60" cy="38" rx="10" ry="10" fill="#F97316" />
      <rect x="50" y="50" width="20" height="35" rx="4" fill="#F97316" />
      <rect x="38" y="52" width="10" height="28" rx="4" fill="#F97316" />
      <rect x="72" y="52" width="10" height="28" rx="4" fill="#F97316" />
      <rect x="50" y="85" width="8" height="32" rx="4" fill="#F97316" />
      <rect x="62" y="85" width="8" height="32" rx="4" fill="#F97316" />
      {/* Diamond icon below */}
      <polygon points="60,140 67,150 60,160 53,150" stroke="#F97316" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
    </svg>
  );
}

function ManifestingGeneratorFigure() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Glow */}
      <circle cx="60" cy="90" r="55" fill="#EF4444" fillOpacity="0.18" />
      {/* Starburst lines */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={60 + 28 * Math.cos(rad)}
            y1={90 + 28 * Math.sin(rad)}
            x2={60 + 52 * Math.cos(rad)}
            y2={90 + 52 * Math.sin(rad)}
            stroke="#EF4444"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        );
      })}
      <circle cx="60" cy="90" r="28" stroke="#EF4444" strokeWidth="1" strokeOpacity="0.4" />
      {/* Body silhouette */}
      <ellipse cx="60" cy="38" rx="10" ry="10" fill="#EF4444" />
      <rect x="50" y="50" width="20" height="35" rx="4" fill="#EF4444" />
      <rect x="38" y="52" width="10" height="28" rx="4" fill="#EF4444" />
      <rect x="72" y="52" width="10" height="28" rx="4" fill="#EF4444" />
      <rect x="50" y="85" width="8" height="32" rx="4" fill="#EF4444" />
      <rect x="62" y="85" width="8" height="32" rx="4" fill="#EF4444" />
      {/* Diamond icon below */}
      <polygon points="60,140 68,150 60,160 52,150" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
      <polygon points="60,143 65,150 60,157 55,150" stroke="#EF4444" strokeWidth="1" fill="none" strokeOpacity="0.4" />
    </svg>
  );
}

function ProjectorFigure() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Glow */}
      <circle cx="60" cy="90" r="55" fill="#8B5CF6" fillOpacity="0.2" />
      {/* Concentric circles */}
      {[52, 42, 32].map((r, i) => (
        <circle key={i} cx="60" cy="90" r={r} stroke="#8B5CF6" strokeWidth="1" strokeOpacity={0.3 + i * 0.15} />
      ))}
      {/* Body silhouette */}
      <ellipse cx="60" cy="38" rx="10" ry="10" fill="#8B5CF6" />
      <rect x="50" y="50" width="20" height="35" rx="4" fill="#8B5CF6" />
      <rect x="38" y="52" width="10" height="28" rx="4" fill="#8B5CF6" />
      <rect x="72" y="52" width="10" height="28" rx="4" fill="#8B5CF6" />
      <rect x="50" y="85" width="8" height="32" rx="4" fill="#8B5CF6" />
      <rect x="62" y="85" width="8" height="32" rx="4" fill="#8B5CF6" />
      {/* Diamond icon below */}
      <polygon points="60,140 68,150 60,160 52,150" stroke="#8B5CF6" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
      <polygon points="60,143 65,150 60,157 55,150" stroke="#8B5CF6" strokeWidth="1" fill="none" strokeOpacity="0.4" />
      <polygon points="60,146 62,150 60,154 58,150" stroke="#8B5CF6" strokeWidth="1" fill="none" strokeOpacity="0.3" />
    </svg>
  );
}

function ManifestorFigure() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Glow */}
      <circle cx="60" cy="90" r="55" fill="#10B981" fillOpacity="0.18" />
      {/* Star of David / hexagram */}
      <polygon points="60,40 80,75 40,75" stroke="#10B981" strokeWidth="1.2" fill="none" strokeOpacity="0.5" transform="translate(0,15)" />
      <polygon points="60,140 80,105 40,105" stroke="#10B981" strokeWidth="1.2" fill="none" strokeOpacity="0.5" transform="translate(0,-15)" />
      <circle cx="60" cy="90" r="35" stroke="#10B981" strokeWidth="1" strokeOpacity="0.3" />
      {/* Body silhouette */}
      <ellipse cx="60" cy="38" rx="10" ry="10" fill="#10B981" />
      <rect x="50" y="50" width="20" height="35" rx="4" fill="#10B981" />
      <rect x="38" y="52" width="10" height="28" rx="4" fill="#10B981" />
      <rect x="72" y="52" width="10" height="28" rx="4" fill="#10B981" />
      <rect x="50" y="85" width="8" height="32" rx="4" fill="#10B981" />
      <rect x="62" y="85" width="8" height="32" rx="4" fill="#10B981" />
      {/* Diamond icon below */}
      <polygon points="60,140 68,150 60,160 52,150" stroke="#10B981" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
    </svg>
  );
}

function ReflectorFigure() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Glow */}
      <circle cx="60" cy="90" r="55" fill="#94A3B8" fillOpacity="0.18" />
      {/* Concentric rings */}
      {[52, 44, 36, 28].map((r, i) => (
        <circle key={i} cx="60" cy="90" r={r} stroke="#94A3B8" strokeWidth="1" strokeOpacity={0.2 + i * 0.1} strokeDasharray="4 3" />
      ))}
      {/* Body silhouette */}
      <ellipse cx="60" cy="38" rx="10" ry="10" fill="#94A3B8" />
      <rect x="50" y="50" width="20" height="35" rx="4" fill="#94A3B8" />
      <rect x="38" y="52" width="10" height="28" rx="4" fill="#94A3B8" />
      <rect x="72" y="52" width="10" height="28" rx="4" fill="#94A3B8" />
      <rect x="50" y="85" width="8" height="32" rx="4" fill="#94A3B8" />
      <rect x="62" y="85" width="8" height="32" rx="4" fill="#94A3B8" />
      {/* Diamond icon below */}
      <polygon points="60,140 68,150 60,160 52,150" stroke="#94A3B8" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />
    </svg>
  );
}

const TYPES_DATA = [
  {
    name: "Generator",
    czechName: "GENERATOR",
    pct: "37%",
    label: "populace",
    color: "bg-amber-50 border-amber-200",
    pctColor: "text-amber-500",
    Figure: GeneratorFigure,
    bgGlow: "bg-amber-100/60",
  },
  {
    name: "Manifesting Generator",
    czechName: "MANIFESTUJÍCÍ\nGENERATOR",
    pct: "33%",
    label: "populace",
    color: "bg-red-50 border-red-200",
    pctColor: "text-red-500",
    Figure: ManifestingGeneratorFigure,
    bgGlow: "bg-red-100/60",
  },
  {
    name: "Projector",
    czechName: "PROJEKTOR",
    pct: "20%",
    label: "populace",
    color: "bg-violet-50 border-violet-200",
    pctColor: "text-violet-500",
    Figure: ProjectorFigure,
    bgGlow: "bg-violet-100/60",
  },
  {
    name: "Manifestor",
    czechName: "MANIFESTOR",
    pct: "9%",
    label: "populace",
    color: "bg-emerald-50 border-emerald-200",
    pctColor: "text-emerald-500",
    Figure: ManifestorFigure,
    bgGlow: "bg-emerald-100/60",
  },
  {
    name: "Reflector",
    czechName: "REFLEKTOR",
    pct: "1%",
    label: "populace",
    color: "bg-slate-50 border-slate-200",
    pctColor: "text-slate-500",
    Figure: ReflectorFigure,
    bgGlow: "bg-slate-100/60",
  },
];

const BENEFIT_ICONS = [Eye, Shield, Lightbulb, Heart, Leaf];

const BENEFITS = [
  { icon: Eye, label: "Poznejte sebe sama" },
  { icon: Shield, label: "Respektujte svoji jedinečnost" },
  { icon: Lightbulb, label: "Dělejte správná rozhodnutí" },
  { icon: Heart, label: "Přestaňte si stát v cestě vrozené kvality" },
  { icon: Leaf, label: "Žijte život, který je opravdu váš." },
];

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
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Soft gradient blobs like in reference */}
        <div className="absolute -top-10 -left-20 w-80 h-80 rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-pink-100/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-40 rounded-full bg-blue-100/20 blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Big serif headline */}
            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="font-serif text-6xl md:text-8xl font-bold leading-tight mb-4 text-foreground tracking-tight"
            >
              Mapa Vašeho Já
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto"
            >
              Objevte své pravé já, dělejte sebevědomá rozhodnutí,<br />
              žijte svůj autentický život
            </motion.p>

            {/* CTA row: purple button + trust badge */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/calculate">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-7 py-5 shadow-lg shadow-primary/20 transition-all hover:scale-105 rounded-full"
                >
                  <Compass className="w-4 h-4 mr-2" />
                  Získat mapu zdarma
                </Button>
              </Link>

              {/* Trust badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-border bg-card shadow-sm">
                <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xs font-bold text-amber-700">
                  TRS
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground leading-none">Over 1,200</p>
                  <p className="text-xs text-muted-foreground">satisfied users</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 5 Benefit Icons Row ───────────────────────────────────────────── */}
      <section className="py-10 border-t border-border/40">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="flex flex-wrap justify-center gap-6 md:gap-10"
          >
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.label}
                custom={i}
                variants={fadeUp}
                className="flex flex-col items-center gap-2 max-w-[110px] text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/8 flex items-center justify-center">
                  <b.icon className="w-7 h-7 text-primary/70" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-muted-foreground leading-tight">{b.label}</span>
              </motion.div>
            ))}
          </motion.div>
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
                <div className={`w-full aspect-[3/4] rounded-2xl ${tp.bgGlow} flex items-center justify-center p-2`}>
                  <tp.Figure />
                </div>
                {/* Type name */}
                <p className="text-[10px] md:text-xs font-bold text-foreground tracking-wide text-center whitespace-pre-line leading-tight">
                  {tp.czechName}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Population stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {TYPES_DATA.filter(tp => tp.name !== "Manifestor").map((tp, i) => (
              <motion.div
                key={tp.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                custom={i + 5}
                variants={scaleIn}
                whileHover={{ scale: 1.04, y: -2 }}
                className={`rounded-2xl p-5 border text-center transition-shadow hover:shadow-md cursor-default ${tp.color}`}
              >
                <p className="text-sm text-muted-foreground mb-1">
                  {tp.name === "Manifesting Generator" ? "Manifestující" : tp.name === "Projector" ? "Projektor" : tp.name === "Reflector" ? "Reflektor" : tp.name}
                </p>
                <p className={`text-3xl font-bold ${tp.pctColor} leading-none`}>{tp.pct}</p>
                {tp.name === "Manifesting Generator" && (
                  <p className="text-xs text-muted-foreground mt-0.5">Generator</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{tp.label}</p>
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
