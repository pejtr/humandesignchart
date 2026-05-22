import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Shield, Star, Users, Globe, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/**
 * Social proof section with hermeticism-inspired design.
 * Features: Flower of Life SVG background, alchemical symbol accents,
 * golden ratio proportions, partner trust indicators.
 */
export function SocialProof() {
  const { locale } = useLanguage();
  const isCs = locale === "cs";

  const stats = [
    {
      icon: Users,
      value: "12 850+",
      label: isCs ? "Vygenerovaných map" : "Charts Generated",
      color: "#7c3aed",
    },
    {
      icon: Globe,
      value: "48+",
      label: isCs ? "Zemí světa" : "Countries",
      color: "#2a9d8f",
    },
    {
      icon: Star,
      value: "4.9/5",
      label: isCs ? "Hodnocení uživatelů" : "User Rating",
      color: "#d4af37",
    },
    {
      icon: Shield,
      value: "100%",
      label: isCs ? "Bezpečnost dat" : "Data Security",
      color: "#6366f1",
    },
  ];

  const trustBadges = [
    { text: isCs ? "Šifrované spojení" : "Encrypted Connection", icon: "🔐" },
    { text: isCs ? "GDPR kompatibilní" : "GDPR Compliant", icon: "✓" },
    { text: isCs ? "Bez reklam" : "Ad-Free", icon: "✦" },
    { text: isCs ? "Vědecky podloženo" : "Science-Based", icon: "⚗" },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Flower of Life SVG background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <svg className="w-full h-full" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          {/* Flower of Life pattern - overlapping circles */}
          {[...Array(7)].map((_, row) =>
            [...Array(12)].map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 70 + (row % 2 ? 35 : 0)}
                cy={row * 60 + 30}
                r="35"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-purple-600"
              />
            ))
          )}
        </svg>
      </div>

      {/* Metatron's Cube accent - top right */}
      <div className="absolute top-8 right-8 w-32 h-32 opacity-[0.04] dark:opacity-[0.06] pointer-events-none">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#7c3aed" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#7c3aed" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="#7c3aed" strokeWidth="0.5" />
          {/* Hexagonal lines */}
          <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill="none" stroke="#7c3aed" strokeWidth="0.3" />
          <polygon points="50,20 79,35 79,65 50,80 21,65 21,35" fill="none" stroke="#7c3aed" strokeWidth="0.3" />
          {/* Inner star */}
          <line x1="50" y1="5" x2="50" y2="95" stroke="#7c3aed" strokeWidth="0.2" />
          <line x1="7" y1="27.5" x2="93" y2="72.5" stroke="#7c3aed" strokeWidth="0.2" />
          <line x1="7" y1="72.5" x2="93" y2="27.5" stroke="#7c3aed" strokeWidth="0.2" />
        </svg>
      </div>

      <div className="container">
        {/* Section header with alchemical flourish */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          custom={0}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-400/50" />
            <Sparkles className="w-5 h-5 text-purple-500/70" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-400/50" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isCs ? "Důvěřují nám tisíce lidí" : "Trusted by Thousands"}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isCs
              ? "Spojujeme starověkou moudrost s moderní technologií pro vaši transformaci"
              : "Bridging ancient wisdom with modern technology for your transformation"}
          </p>
        </motion.div>

        {/* Stats grid with golden ratio spacing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-14">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                variants={fadeUp}
                className="text-center group"
              >
                <div
                  className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `${stat.color}10`,
                    border: `1.5px solid ${stat.color}30`,
                    boxShadow: `0 0 20px ${stat.color}08`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges with hermetic styling */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={5}
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-3 md:gap-5"
        >
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-800/30 text-sm text-foreground/80"
            >
              <span className="text-base">{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Hermetic principle quote */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={6}
          variants={fadeUp}
          className="mt-14 text-center"
        >
          <blockquote className="text-sm md:text-base italic text-muted-foreground/70 max-w-md mx-auto">
            {isCs
              ? "„Jak nahoře, tak dole; jak uvnitř, tak vně.“"
              : "\u201cAs above, so below; as within, so without.\u201d"}
          </blockquote>
          <p className="text-xs text-muted-foreground/50 mt-2">
            — Hermes Trismegistus, Smaragdová deska
          </p>
        </motion.div>
      </div>
    </section>
  );
}
