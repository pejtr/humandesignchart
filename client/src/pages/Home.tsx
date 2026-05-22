import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ParticleField } from "@/components/ParticleField";
import { TiltCard } from "@/components/TiltCard";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { SocialProof } from "@/components/SocialProof";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSEO, OG_IMAGES } from "@/hooks/useSEO";
import {
  Compass, Brain, Users, Star, BarChart3,
  FileText, Zap, ArrowRight, CheckCircle2, Eye, Lightbulb,
  Heart, Shield, Leaf, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Animated Chart Counter (count-up on scroll into view) ────────────────────────────────────
function ChartCounter({ isCs }: { isCs: boolean }) {
  const { data } = trpc.publicStats.chartCount.useQuery(undefined, {
    staleTime: 60_000,
  });
  const [displayCount, setDisplayCount] = useState(0);
  const targetCount = data?.count ?? 12847;
  const hasAnimated = useRef(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!counterRef.current || hasAnimated.current || !data) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2200;
          const steps = 80;
          const increment = targetCount / steps;
          let current = 0;
          const interval = setInterval(() => {
            current += increment;
            if (current >= targetCount) {
              setDisplayCount(targetCount);
              clearInterval(interval);
            } else {
              setDisplayCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, [data, targetCount]);

  const formatted = displayCount.toLocaleString(isCs ? "cs-CZ" : "en-US");

  return (
    <div ref={counterRef} className="flex items-center gap-3 px-4 py-2.5 rounded-full border bg-white/80 dark:bg-card/80 shadow-sm" style={{ borderColor: '#d4af37' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#fef3c7', border: '2px solid #d4af37' }}>
        <BarChart3 className="w-4 h-4" style={{ color: '#92400e' }} />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold leading-none tabular-nums" style={{ color: '#1a1a1a' }}>
          {formatted}+
        </p>
        <p className="text-xs" style={{ color: '#777' }}>
          {isCs ? "vygenerovaných map" : "charts generated"}
        </p>
      </div>
    </div>
  );
}

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
  const [isPaused, setIsPaused] = useState(false);
  const count = testimonials.length;
  const visible = [active, (active + 1) % count, (active + 2) % count];

  // Auto-scroll every 5 seconds, pauses on hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, count]);

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-purple-950/5 via-background to-background">
      {/* Sacred geometry background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.03]" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
        </svg>
      </div>
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium mb-3">
            <Star className="w-4 h-4 fill-amber-400" />
            {isCs ? "Co říkají naši uživatelé" : "What our users say"}
            <Star className="w-4 h-4 fill-amber-400" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            {isCs ? "Reference" : "Testimonials"}
          </h2>
        </motion.div>
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {visible.map((idx) => {
            const tm = testimonials[idx];
            return (
              <motion.div
                key={`${active}-${idx}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="rounded-2xl p-6 border border-purple-200/30 dark:border-purple-500/20 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-purple-500/20 hover:border-purple-400/40 hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-default"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic flex-1 group-hover:text-foreground/80 transition-colors">"{tm.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs group-hover:ring-2 group-hover:ring-purple-400/30 transition-all"
                    style={{ background: tm.color, color: '#555' }}
                  >
                    {tm.initials}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{tm.name}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setActive((active - 1 + count) % count)}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-purple-500/10 hover:border-purple-400/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === active ? 'bg-purple-500 scale-125' : 'bg-muted-foreground/30 hover:bg-purple-400/50'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActive((active + 1) % count)}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-purple-500/10 hover:border-purple-400/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* Auto-scroll indicator */}
        <div className="flex justify-center mt-4">
          <span className="text-xs text-muted-foreground/50">
            {isPaused
              ? (isCs ? "⏸ Pozastaveno" : "⏸ Paused")
              : (isCs ? "▶ Automatické přepínání" : "▶ Auto-scrolling")}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, locale, localePath } = useLanguage();
  const isCs = locale === "cs";

  // Parallax scroll effect for hero
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScrollProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.8], [1, 0.3]);

  // Store referral code from URL (?ref=CODE) into localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("pendingReferralCode", ref.toUpperCase());
    }
  }, []);

  useSEO(isCs ? {
    title: "✨ HUMAN DESIGN – Mapa vašeho Já | Odemkněte svůj potenciál! 🔮",
    description: "🌟 Vypočítejte svou Human Design mapu zdarma. Zjistěte svůj typ, strategii, autoritu a získejte AI výklad svého životního poslání.",
    ogImage: OG_IMAGES.homepage,
    keywords: "human design, human design mapa, bodygraph kalkulačka, human design zdarma, human design typ, human design autorita",
    locale: "cs_CZ",
  } : {
    title: "✨ Free Human Design Chart Calculator & AI Reading 🔮",
    description: "Calculate your free Human Design chart. Discover your type, strategy, authority and get a personalized AI reading.",
    ogImage: OG_IMAGES.homepage,
    keywords: "human design, human design chart, bodygraph calculator, free human design, human design type, human design authority",
    locale: "en_US",
  });
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
        { image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/how-gifts-eGS8ZgX5CLuYpBcwPhCjpT.webp", title: "1. Pochopte své dary", desc: "Zjistěte svůj typ, profil a autoritu. Poznejte, jak přirozeně fungujete a co vás skutečně naplňuje." },
        { image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/how-relationships-DC73aXQjL3itwepfxavAvR.webp", title: "2. Zlepšete své vztahy", desc: "Porovnejte mapy s blízkými. Pochopte dynamiku vašich vztahů a jak spolu lépe fungovat." },
        { image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/how-purpose-WT5fgPEHLBT9f6EjEZDj5E.webp", title: "3. Najděte svůj účel", desc: "Prozkoumejte svůj inkarnační kříž a brány. Objevte své životní poslání a směr." },
      ]
    : [
        { image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/how-gifts-eGS8ZgX5CLuYpBcwPhCjpT.webp", title: "1. Understand your gifts", desc: "Discover your type, profile, and authority. Learn how you naturally operate and what truly fulfills you." },
        { image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/how-relationships-DC73aXQjL3itwepfxavAvR.webp", title: "2. Improve your relationships", desc: "Compare charts with loved ones. Understand the dynamics of your relationships and how to work better together." },
        { image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/how-purpose-WT5fgPEHLBT9f6EjEZDj5E.webp", title: "3. Find your purpose", desc: "Explore your incarnation cross and gates. Discover your life mission and direction." },
      ];

  const blogPosts = isCs
    ? [
        { slug: "co-je-human-design", title: "Co je Human Design?", excerpt: "Kompletní průvodce pro začátečníky — zjistěte, jak systém funguje a jak vám může pomoci.", cat: "Základy HD", catStyle: "bg-amber-100 text-amber-800 border-amber-200", time: 8, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-what-is-hd-43WNJvfutfhJuzR4yJTFDP.webp", featured: true },
        { slug: "5-typu-human-design", title: "5 typů v Human Designu", excerpt: "Poznejte všech 5 typů — Generátor, Projektor, Manifestor, MG a Reflektor.", cat: "Typy", catStyle: "bg-violet-100 text-violet-800 border-violet-200", time: 10, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-5-types-fEmgd8eitQZqUVMyp8ovc9.webp", featured: false },
        { slug: "strategie-v-human-design", title: "Strategie: Klíč ke správným rozhodnutím", excerpt: "Reagovat, informovat, čekat na pozvání — naučte se svou strategii.", cat: "Strategie", catStyle: "bg-emerald-100 text-emerald-800 border-emerald-200", time: 7, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-strategy-3cZa4q36bjHbc7YaSLdJnZ.webp", featured: false },
        { slug: "autorita-v-human-design", title: "Autorita: Jak dělat správná rozhodnutí", excerpt: "Emocionální, sakrální, slezinná — každý typ má svůj vnitřní kompas rozhodování.", cat: "Autorita", catStyle: "bg-rose-100 text-rose-800 border-rose-200", time: 9, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-authority-HgBsivLWhdBShyvJUTrcWj.webp", featured: false },
        { slug: "profily-v-human-design", title: "12 profilů v Human Designu", excerpt: "Váš profil odhaluje vaši životní roli a způsob, jakým se učíte a rostete.", cat: "Profily", catStyle: "bg-sky-100 text-sky-800 border-sky-200", time: 11, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-profiles-CfRJ5N3rUpES9bRhQcQYBQ.webp", featured: false },
        { slug: "human-design-a-vztahy", title: "Human Design a vztahy", excerpt: "Jak porozumět partnerské dynamice a zlepšit komunikaci s blízkými.", cat: "Vztahy", catStyle: "bg-pink-100 text-pink-800 border-pink-200", time: 8, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-relationships-SpGoW2up6Yzx3i23csHKSH.webp", featured: false },
      ]
    : [
        { slug: "what-is-human-design", title: "What is Human Design?", excerpt: "A complete beginner's guide — learn how the system works and how it can help you.", cat: "HD Basics", catStyle: "bg-amber-100 text-amber-800 border-amber-200", time: 8, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-what-is-hd-43WNJvfutfhJuzR4yJTFDP.webp", featured: true },
        { slug: "5-types-human-design", title: "5 Human Design Types", excerpt: "Discover all 5 types — Generator, Projector, Manifestor, MG, and Reflector.", cat: "Types", catStyle: "bg-violet-100 text-violet-800 border-violet-200", time: 10, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-5-types-fEmgd8eitQZqUVMyp8ovc9.webp", featured: false },
        { slug: "human-design-strategy", title: "Strategy: The Key to Right Decisions", excerpt: "Respond, inform, wait for the invitation — learn your unique strategy.", cat: "Strategy", catStyle: "bg-emerald-100 text-emerald-800 border-emerald-200", time: 7, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-strategy-3cZa4q36bjHbc7YaSLdJnZ.webp", featured: false },
        { slug: "human-design-authority", title: "Inner Authority Explained", excerpt: "Emotional, sacral, splenic — every type has its own inner compass for decisions.", cat: "Authority", catStyle: "bg-rose-100 text-rose-800 border-rose-200", time: 9, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-authority-HgBsivLWhdBShyvJUTrcWj.webp", featured: false },
        { slug: "human-design-profiles", title: "12 Human Design Profiles", excerpt: "Your profile reveals your life role and the way you learn, grow, and connect.", cat: "Profiles", catStyle: "bg-sky-100 text-sky-800 border-sky-200", time: 11, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-profiles-CfRJ5N3rUpES9bRhQcQYBQ.webp", featured: false },
        { slug: "human-design-relationships", title: "Human Design & Relationships", excerpt: "Understand partnership dynamics and improve communication with loved ones.", cat: "Relationships", catStyle: "bg-pink-100 text-pink-800 border-pink-200", time: 8, cover: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/SJUUMjJfby3uu5HSPh4u4R/blog-relationships-SpGoW2up6Yzx3i23csHKSH.webp", featured: false },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col justify-center overflow-hidden"
        style={{
          minHeight: '55vh',
          backgroundImage: 'url(https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/WUcqCUXbXPPoyTKt.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundColor: '#f5f0f8',
        }}
      >
        {/* Decorative sacred circle — always visible including mobile */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <div className="w-[280px] h-[280px] md:w-[500px] md:h-[500px] rounded-full border-2 border-purple-300/40 animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-[220px] h-[220px] md:w-[400px] md:h-[400px] rounded-full border border-purple-200/30 animate-[spin_45s_linear_infinite_reverse]" />
          <div className="absolute w-[160px] h-[160px] md:w-[300px] md:h-[300px] rounded-full border border-amber-200/25" />
        </div>

        {/* Animated orbs — responsive for mobile */}
        <div className="hero-orb-1 absolute pointer-events-none" style={{ width: 'min(520px, 80vw)', height: 'min(520px, 80vw)', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(139,92,246,0.45) 0%, rgba(167,139,250,0.20) 50%, transparent 70%)', top: '-10%', left: '-15%', filter: 'blur(40px)', zIndex: 1 }} />
        <div className="hero-orb-2 absolute pointer-events-none" style={{ width: 'min(600px, 90vw)', height: 'min(600px, 90vw)', borderRadius: '50%', background: 'radial-gradient(circle at 60% 60%, rgba(251,191,36,0.38) 0%, rgba(252,211,77,0.18) 50%, transparent 70%)', bottom: '-20%', right: '-15%', filter: 'blur(50px)', zIndex: 1 }} />
        <div className="hero-orb-3 absolute pointer-events-none" style={{ width: 'min(380px, 60vw)', height: 'min(380px, 60vw)', borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(42,157,143,0.35) 0%, rgba(94,234,212,0.15) 50%, transparent 70%)', top: '30%', left: '55%', filter: 'blur(35px)', zIndex: 1 }} />
        <div className="hero-orb-4 absolute pointer-events-none" style={{ width: 'min(300px, 50vw)', height: 'min(300px, 50vw)', borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(244,114,182,0.32) 0%, rgba(251,207,232,0.14) 50%, transparent 70%)', top: '10%', right: '10%', filter: 'blur(30px)', zIndex: 1 }} />

        {/* White overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.35)', zIndex: 2 }} />

        {/* Floating particle animation */}
        <ParticleField />

        <motion.div
          className="container relative z-10 py-32"
          style={{ y: heroY, opacity: heroOpacity }}
        >
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

              <ChartCounter isCs={isCs} />
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
        </motion.div>
      </section>      <div className="mystical-divider" />

      {/* ── 5 Types Section ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-purple-50/40 bg-sacred-geometry overflow-hidden">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} custom={0} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
              {isCs ? "Pět typů lidí a jejich aura" : "Five types of people and their aura"}
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
                <TiltCard className={`rounded-2xl border overflow-hidden flex flex-col ${tp.color} shadow-sm hover:shadow-md transition-shadow h-full`}>
                {/* Image */}
                <div className="w-full aspect-square flex items-center justify-center bg-white/60 dark:bg-card/60 px-3 pt-3">
                  <ProgressiveImage
                    src={tp.imgUrl}
                    alt={tp.displayName}
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
                {/* Info */}
                <div className="p-4 text-center flex flex-col gap-1">
                  <p className="text-[10px] md:text-xs font-bold tracking-widest whitespace-pre-line leading-tight" style={{ color: '#555' }}>
                    {tp.displayName}
                  </p>
                  <p className={`text-2xl font-bold leading-none ${tp.pctColor}`}>{tp.pct}</p>
                  <p className="text-[10px] text-muted-foreground">{tp.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-1">{tp.role}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug italic">{tp.strategy}</p>
                  <Link href={localePath("/calculate")} className="mt-2 block">
                    <span className="inline-flex items-center justify-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                      {isCs ? "Zjistit svůj typ" : "Find your type"} <ArrowRight className="w-3 h-3" />
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
      <section className="py-20 overflow-hidden">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {isCs ? "Jak začít s poznáváním Human Designu" : "How to start exploring Human Design"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isCs ? "Tři jednoduché kroky k pochopení vašeho jedinečného designu." : "Three simple steps to understanding your unique design."}
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
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i} variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="relative bg-card rounded-2xl border border-border/40 p-7 md:p-8 text-center shadow-md hover:shadow-xl transition-all group overflow-hidden"
                >
                  {/* Gradient accent top bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradients[i]}`} />
                  {/* Large gradient step number */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradients[i]} text-white font-serif text-2xl font-bold flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {s.step}
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
                  <Link href={localePath("/calculate")}>
                    <Button variant="outline" size="sm" className={`border-2 font-medium transition-all ${btnStyles[i]}`}>
                      {s.cta}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30 bg-sacred-geometry">
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

      <div className="mystical-divider" />

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="py-20 bg-ethereal dark:bg-card" style={{ background: 'var(--tw-dark, #f9f7f2)' }}>
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-center mb-14 text-foreground"
          >
            {isCs ? "Jak to funguje" : "How it works"}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {howItWorks.map(({ image, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center gap-5 group"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 ring-2 ring-purple-200/50 dark:ring-purple-500/30">
                  <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-[260px]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <TestimonialsSection isCs={isCs} />

      <div className="mystical-divider" />

      {/* ── Blog Preview — Editorial Layout ──────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                {isCs ? "Z našeho blogu" : "From our blog"}
              </h2>
              <p className="text-muted-foreground max-w-lg">
                {isCs ? "Prozkoumejte svět Human Designu s našimi články a průvodci." : "Explore the world of Human Design with our articles and guides."}
              </p>
            </div>
            <Link href={localePath("/blog")} className="hidden md:flex">
              <Button variant="outline" className="rounded-full">
                {isCs ? "Všechny články" : "All articles"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Featured article — large card */}
            {blogPosts.filter(p => p.featured).map((post) => (
              <motion.div key={post.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={scaleIn} className="lg:col-span-7">
                <Link href={localePath(`/blog/${post.slug}`)} className="no-underline">
                  <div className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all h-full min-h-[320px] md:min-h-[400px] bg-card border border-border/40">
                    <img
                      src={post.cover}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }} />
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">{post.cat}</span>
                        <span className="text-xs text-white/70">{post.time} min</span>
                      </div>
                      <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{post.title}</h3>
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-2 max-w-lg">{post.excerpt}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Compact grid — remaining articles */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {blogPosts.filter(p => !p.featured).slice(0, 5).map((post, i) => (
                <motion.div key={post.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1} variants={scaleIn}>
                  <Link href={localePath(`/blog/${post.slug}`)} className="no-underline">
                    <div className="group flex gap-3.5 p-3 rounded-xl border border-border/40 bg-card hover:shadow-md hover:border-primary/20 transition-all h-full">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={post.cover}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center gap-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${post.catStyle}`}>{post.cat}</span>
                          <span className="text-[10px] text-muted-foreground">{post.time} min</span>
                        </div>
                        <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{post.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block lg:block">{post.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile-only "All articles" button */}
          <div className="text-center md:hidden">
            <Link href={localePath("/blog")}>
              <Button variant="outline" className="rounded-full">
                {isCs ? "Všechny články" : "All articles"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mystical-divider" />

        {/* ── Social Proof Section ──────────────────────────────────── */}
      <SocialProof />

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden bg-sacred-geometry">
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
              <Button size="lg" className="btn-mystical bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 rounded-full">
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
