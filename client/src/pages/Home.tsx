import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Compass, Brain, Sparkles, Users, Star, BarChart3, FileText, Zap, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

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

  const types = [
    { name: t.types.Manifestor, pct: "9%", color: "from-red-500/20 to-red-900/20", border: "border-red-500/30", glow: "hover:shadow-red-500/20" },
    { name: t.types.Generator, pct: "37%", color: "from-orange-500/20 to-orange-900/20", border: "border-orange-500/30", glow: "hover:shadow-orange-500/20" },
    { name: t.types["Manifesting Generator"], pct: "33%", color: "from-yellow-500/20 to-yellow-900/20", border: "border-yellow-500/30", glow: "hover:shadow-yellow-500/20" },
    { name: t.types.Projector, pct: "20%", color: "from-blue-500/20 to-blue-900/20", border: "border-blue-500/30", glow: "hover:shadow-blue-500/20" },
    { name: t.types.Reflector, pct: "1%", color: "from-green-500/20 to-green-900/20", border: "border-green-500/30", glow: "hover:shadow-green-500/20" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-cosmic bg-stars" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        {/* Decorative floating orbs */}
        <div className="absolute top-40 right-10 w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3s" }} />
        <div className="absolute top-60 left-16 w-1.5 h-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "1s", animationDuration: "4s" }} />
        <div className="absolute bottom-20 right-1/3 w-1 h-1 rounded-full bg-yellow-400/40 animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "3.5s" }} />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-8"
            >
              <Sparkles className="w-4 h-4" />
              {t.home.badge}
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6"
            >
              {t.home.heroTitle}
              <span className="text-gradient-purple block">{t.home.heroTitleHighlight}</span>
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
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 glow-purple transition-all hover:scale-105">
                  <Compass className="w-5 h-5 mr-2" />
                  {t.home.ctaCalculate}
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border/50 transition-all hover:scale-105">
                    {t.home.ctaDashboard}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Types Section */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t.home.typesTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.home.typesDescription}
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {types.map((tp, i) => (
              <motion.div
                key={tp.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={scaleIn}
                whileHover={{ scale: 1.07, y: -4 }}
                className={`rounded-xl p-5 bg-gradient-to-br ${tp.color} border ${tp.border} text-center transition-shadow ${tp.glow} hover:shadow-lg cursor-default`}
              >
                <p className="font-serif text-lg font-semibold mb-1">{tp.name}</p>
                <p className="text-2xl font-bold text-gradient-purple">{tp.pct}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.home.ofPopulation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t.home.featuresTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.home.featuresDescription}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="bg-cosmic-card rounded-xl p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <f.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-stars opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={0}
            variants={fadeUp}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6 pulse-glow">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              {t.home.ctaTitle}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t.home.ctaDescription}
            </p>
            <Link href="/calculate">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 transition-all hover:scale-105">
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
