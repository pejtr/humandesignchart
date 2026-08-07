import { trpc } from "@/lib/trpc";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(v => (
        <Star
          key={v}
          className={`w-3.5 h-3.5 ${
            v <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { locale } = useLanguage();
  const isCs = locale === "cs";

  const { data: testimonials = [] } = trpc.testimonials.getApproved.useQuery(
    { locale: locale as "cs" | "en", limit: 6 },
    { staleTime: 300_000 }
  );

  if (testimonials.length === 0) return null;

  return (
    <section
      className="py-20 bg-gradient-to-b from-purple-50/30 to-white dark:from-purple-950/10 dark:to-background"
      style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            {isCs ? "Co říkají naši uživatelé" : "What our users say"}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            {isCs
              ? "Skutečné zkušenosti lidí, kteří objevili svůj Human Design."
              : "Real experiences from people who discovered their Human Design."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative bg-card rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-purple-200 dark:text-purple-800/40" />
              <div className="mb-3">
                <StarRating rating={t.rating} />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 line-clamp-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  {t.hdType && (
                    <p className="text-[11px] text-muted-foreground">{t.hdType}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
