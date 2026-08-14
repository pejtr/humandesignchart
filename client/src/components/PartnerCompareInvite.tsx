import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Users, Gift, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface PartnerCompareInviteProps {
  referralCode?: string | null;
  chartName?: string;
}

export function PartnerCompareInvite({ referralCode, chartName }: PartnerCompareInviteProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);

  const code = referralCode || "HDM2026";
  const shareUrl = `${window.location.origin}/${locale}/partner/${encodeURIComponent(code)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(
        isEn
          ? "Invite link copied to clipboard! Share it with a partner."
          : "Odkaz zkopírován do schránky! Pošlete ho partnerovi."
      );
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error(isEn ? "Failed to copy link" : "Kopírování selhalo");
    }
  };

  return (
    <Card className="border border-purple-300/40 dark:border-purple-800/40 bg-gradient-to-br from-purple-500/5 via-amber-500/5 to-pink-500/5 rounded-2xl overflow-hidden shadow-lg shadow-purple-900/5">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <Gift className="w-3.5 h-3.5" />
              {isEn ? "Viral Reward Bonus" : "Odměna: +2 AI Kredity pro obě strany"}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
              {isEn
                ? "Compare Compatibility with Partner or Friend"
                : "Porovnejte kompatibilitu s partnerem nebo kamarádem"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isEn
                ? "Send this link to your partner or friend. Once they calculate their chart, both of you will receive +2 Free AI Reading Credits!"
                : "Pošlete tento odkaz partnerovi či příteli. Jakmile si spočítá svou mapu, získáte oba automaticky +2 AI kredity zdarma!"}
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              onClick={handleCopy}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md shadow-purple-600/20 rounded-xl gap-2 px-6"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              {copied
                ? isEn
                  ? "Copied!"
                  : "Zkopírováno!"
                : isEn
                  ? "Copy Partner Link"
                  : "Zkopírovat odkaz pro partnera"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
