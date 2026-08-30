import { Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildDailyInsight } from "@/lib/dailyInsight";
import { trpc } from "@/lib/trpc";

export function DailyInsightBadge() {
  const { isAuthenticated } = useAuth();
  const { locale, localePath } = useLanguage();
  const { data: transit } = trpc.transit.current.useQuery(undefined, {
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: charts } = trpc.chart.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const primaryChart = charts?.find((chart: any) => chart.category === "self") ?? charts?.[0];
  const insight = buildDailyInsight(transit?.transitGates, primaryChart as any, locale);
  if (!insight) return null;

  return (
    <Link
      href={localePath("/daily-transit")}
      title={insight}
      aria-label={`${locale === "cs" ? "Denní Human Design sdělení" : "Daily Human Design insight"}: ${insight}`}
      className="group inline-flex max-w-[15rem] items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1.5 text-xs text-foreground/80 no-underline shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/10"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">{insight}</span>
    </Link>
  );
}
