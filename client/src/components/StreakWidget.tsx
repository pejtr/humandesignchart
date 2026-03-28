import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const LEVEL_CONFIG = {
  searcher:  { label: { cs: "Hledač",     en: "Searcher"  }, color: "bg-slate-400",   icon: "⚪", next: "awakened",  nextLabel: { cs: "Probuzený",    en: "Awakened"  } },
  awakened:  { label: { cs: "Probuzený",  en: "Awakened"  }, color: "bg-yellow-400",  icon: "🟡", next: "initiated", nextLabel: { cs: "Zasvěcený",    en: "Initiated" } },
  initiated: { label: { cs: "Zasvěcený",  en: "Initiated" }, color: "bg-orange-400",  icon: "🟠", next: "guide",     nextLabel: { cs: "Průvodce",     en: "Guide"     } },
  guide:     { label: { cs: "Průvodce",   en: "Guide"     }, color: "bg-red-400",     icon: "🔴", next: "master",    nextLabel: { cs: "Mistr",        en: "Master"    } },
  master:    { label: { cs: "Mistr",      en: "Master"    }, color: "bg-purple-500",  icon: "🟣", next: null,        nextLabel: null },
} as const;

type Level = keyof typeof LEVEL_CONFIG;

export function StreakWidget() {
  const { locale: lang } = useLanguage();
  const utils = trpc.useUtils();

  const { data: stats, isLoading } = trpc.gamification.getStats.useQuery();

  const checkIn = trpc.gamification.checkIn.useMutation({
    onSuccess: (data) => {
      utils.gamification.getStats.invalidate();
      utils.subscription.status.invalidate();
      if (data.streakUpdated && data.creditsAwarded > 0) {
        toast.success(lang === "cs"
          ? `🔥 ${data.newStreak}-denní streak! +${data.creditsAwarded} výklad zdarma!`
          : `🔥 ${data.newStreak}-day streak! +${data.creditsAwarded} free reading!`
        );
      } else if (data.streakUpdated) {
        toast.success(lang === "cs"
          ? `🔥 Streak: ${data.newStreak} dní v řadě!`
          : `🔥 Streak: ${data.newStreak} days in a row!`
        );
      }
    },
  });

  const claimReward = trpc.gamification.claimDailyReward.useMutation({
    onSuccess: (data) => {
      utils.gamification.getStats.invalidate();
      utils.subscription.status.invalidate();
      if (data.alreadyClaimed) {
        toast.info(lang === "cs" ? "Dnešní odměna již byla vyzvednuta." : "Today's reward already claimed.");
      } else {
        toast.success(lang === "cs"
          ? `🎁 Denní odměna: +${data.creditsAwarded} výklad!`
          : `🎁 Daily reward: +${data.creditsAwarded} reading!`
        );
      }
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const level = (stats.level as Level) ?? "searcher";
  const levelCfg = LEVEL_CONFIG[level];
  const streakFlames = Math.min(stats.currentStreak, 7);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Streak Card */}
      <Card className="bg-card border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {lang === "cs" ? "Denní streak" : "Daily Streak"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold text-foreground">{stats.currentStreak}</span>
            <span className="text-muted-foreground text-sm mb-1">{lang === "cs" ? "dní" : "days"}</span>
          </div>
          {/* Flame indicators */}
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className={`text-lg transition-all ${i < streakFlames ? "opacity-100 scale-110" : "opacity-20"}`}>
                🔥
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === "cs"
              ? `Nejdelší streak: ${stats.longestStreak} dní · Každých 7 dní = +1 výklad`
              : `Best streak: ${stats.longestStreak} days · Every 7 days = +1 reading`}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending}
          >
            {checkIn.isPending
              ? (lang === "cs" ? "Zaznamenávám..." : "Checking in...")
              : (lang === "cs" ? "Zaznamenat dnešní přihlášení" : "Check in today")}
          </Button>
        </CardContent>
      </Card>

      {/* Level + Daily Reward Card */}
      <Card className="bg-card border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {lang === "cs" ? "Úroveň & Denní odměna" : "Level & Daily Reward"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Level badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{levelCfg.icon}</span>
            <div>
              <p className="font-semibold text-foreground">{levelCfg.label[lang]}</p>
              {levelCfg.next && (
                <p className="text-xs text-muted-foreground">
                  {lang === "cs" ? `Další: ${levelCfg.nextLabel?.[lang]}` : `Next: ${levelCfg.nextLabel?.[lang]}`}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              {lang === "cs" ? `${stats.totalCreditsEarned} celkem` : `${stats.totalCreditsEarned} total`}
            </Badge>
          </div>

          {/* Daily reward */}
          {stats.dailyRewardAvailable ? (
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
              onClick={() => claimReward.mutate()}
              disabled={claimReward.isPending}
            >
              {claimReward.isPending
                ? "..."
                : (lang === "cs" ? "🎁 Vyzvednout denní odměnu!" : "🎁 Claim daily reward!")}
            </Button>
          ) : (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                {lang === "cs" ? "✓ Dnešní odměna vyzvednuta" : "✓ Today's reward claimed"}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2 text-center">
            {lang === "cs" ? `${stats.totalReferrals} pozvaných přátel` : `${stats.totalReferrals} referred friends`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
