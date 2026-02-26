import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Compass, Brain, Sparkles, Users, Star, BarChart3, FileText, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

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

const TYPES_GRAPHIC_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/IJCEzjXdfWLhtTFD.png";

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

  const benefits = [
    "Poznejte sebe sama",
    "Respektujte svoji jedinečnost",
    "Dělejte správná rozhodnutí",
    "Přestaňte si stát v cestě",
    "Projevte své vrozené kvality",
    "Žijte život, který je opravdu váš",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero Section — clean white with soft purple accents */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Soft decorative blobs */}
        <div className="absolute top-0 left-0 w-full h-full bg-dots opacity-40 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/4 rounded-full blur-3xl" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-8 font-medium"
            >
              <Sparkles className="w-4 h-4" />
              {t.home.badge}
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 text-foreground"
            >
              {t.home.heroTitle}{" "}
              <span className="text-gradient-purple">{t.home.heroTitleHighlight}</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              {t.home.heroDescription}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/calculate">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/25">
                  <Compass className="w-5 h-5 mr-2" />
                  {t.home.ctaCalculate}
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-muted transition-all hover:scale-105">
                    {t.home.ctaDashboard}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits list — inspired by humandesign.cz */}
      <section className="py-12 border-t border-border/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-wrap justify-center gap-x-8 gap-y-3"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                custom={i}
                variants={fadeUp}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base">{b}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Types Graphic Section — showcase the provided image */}
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">{t.home.typesTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.home.typesDescription}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={1}
            variants={scaleIn}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-card rounded-2xl shadow-lg shadow-black/5 border border-border/50 overflow-hidden p-4 md:p-8">
              <img
                src={TYPES_GRAPHIC_URL}
                alt="Pět typů lidí a jejich aura — Generátor, Manifestující Generátor, Projektor, Manifestor, Reflektor"
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Type cards below the graphic */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10 max-w-4xl mx-auto">
            {[
              { name: t.types.Generator, pct: "37%", color: "bg-amber-50 border-amber-200 hover:shadow-amber-100" },
              { name: t.types["Manifesting Generator"], pct: "33%", color: "bg-orange-50 border-orange-200 hover:shadow-orange-100" },
              { name: t.types.Projector, pct: "20%", color: "bg-violet-50 border-violet-200 hover:shadow-violet-100" },
              { name: t.types.Manifestor, pct: "9%", color: "bg-emerald-50 border-emerald-200 hover:shadow-emerald-100" },
              { name: t.types.Reflector, pct: "1%", color: "bg-slate-50 border-slate-200 hover:shadow-slate-100" },
            ].map((tp, i) => (
              <motion.div
                key={tp.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                custom={i + 2}
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -3 }}
                className={`rounded-xl p-4 border text-center transition-shadow hover:shadow-lg cursor-default ${tp.color}`}
              >
                <p className="font-serif text-base md:text-lg font-semibold mb-1 text-foreground">{tp.name}</p>
                <p className="text-2xl font-bold text-primary">{tp.pct}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.home.ofPopulation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to start — 3 steps inspired by humandesign.cz */}
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

      {/* Features Grid */}
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

      {/* CTA Section */}
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
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105">
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
