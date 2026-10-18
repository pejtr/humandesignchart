import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Crown, ArrowRight, Zap } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface LockedContentBlurTeaserProps {
  titleCs: string;
  titleEn: string;
  previewSnippetCs: string;
  previewSnippetEn: string;
  chapterNumber?: number;
}

export function LockedContentBlurTeaser({
  titleCs,
  titleEn,
  previewSnippetCs,
  previewSnippetEn,
  chapterNumber = 4,
}: LockedContentBlurTeaserProps) {
  const { locale, localePath } = useLanguage();
  const isEn = locale !== "cs";

  return (
    <Card className="relative overflow-hidden border border-purple-300/40 dark:border-purple-800/40 bg-card rounded-2xl shadow-lg my-6">
      {/* Background Sample Content (partially blurred) */}
      <CardContent className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
              {isEn ? `CHAPTER ${chapterNumber}` : `KAPITOLA ${chapterNumber}`}
            </span>
            <h3 className="font-serif font-bold text-lg text-foreground">
              {isEn ? titleEn : titleCs}
            </h3>
          </div>
          <Lock className="w-4 h-4 text-amber-500" />
        </div>

        {/* Visible readable teaser line */}
        <p className="text-sm font-medium text-foreground/90 leading-relaxed">
          {isEn ? previewSnippetEn : previewSnippetCs}
        </p>

        {/* Blurred Teaser Paragraphs */}
        <div className="relative space-y-3 select-none filter blur-[5px] opacity-40 pointer-events-none aria-hidden">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isEn
              ? "Your inner decision-making engine operates through immediate somatic response. When life presents the right opportunity, your body signals expansion rather than mental pressure."
              : "Váš sakrální motor funguje na principu okamžité fyzické odezvy. Když vás vesmír osloví správnou nabídkou, pocítíte jemnou expanzi v břiše. Pokud se snažíte rozhodovat pouze hlavou, vzniká mentální odpor a následné vyhoření."}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isEn
              ? "Your profile lines combine experiential wisdom with practical leadership, turning lived lessons into clarity for your relationships and career..."
              : "Tento profil nese archetyp praktické moudrosti a zkoušení v praxi, ze kterého přinášíte neocenitelnou jasnost celému svému okolí..."}
          </p>
        </div>
      </CardContent>

      {/* Overlay Unlock Call-To-Action */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center justify-end p-6 text-center z-10">
        <div className="max-w-md mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Crown className="w-3.5 h-3.5" />
            {isEn ? "Personal Human Design Blueprint" : "Osobní Human Design Blueprint"}
          </div>

          <h4 className="font-serif font-bold text-xl text-foreground">
            {isEn
              ? "Unlock Your Complete Personal Blueprint & PDF Report"
              : "Odemkněte kompletní osobní Blueprint a PDF rozbor"}
          </h4>

          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Instant access to your personalized PDF Blueprint, decision strategy, relationship & career analysis, plus 5 ORACULUM+ AI readings."
              : "Okamžitý přístup k osobnímu PDF Blueprintu, rozhodovací strategii, rozboru vztahů a práce + 5 AI výkladům ORACULUM+."}
          </p>

          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-900/20 rounded-xl gap-2 transition-all hover:scale-[1.02]"
            asChild
          >
            <Link href={localePath("/honorace")}>
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isEn ? "Unlock Personal Blueprint" : "Odemknout osobní Blueprint"}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
