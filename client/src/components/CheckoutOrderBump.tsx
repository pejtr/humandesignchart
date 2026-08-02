import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Calendar, ShieldCheck, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CheckoutOrderBumpProps {
  onBumpChange?: (bumpSelected: boolean, bumpPrice: number, bumpType: string) => void;
}

export function CheckoutOrderBump({ onBumpChange }: CheckoutOrderBumpProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [selected, setSelected] = useState(false);

  const price = 199;
  const bumpType = "partner_compatibility_addon";

  const handleToggle = (checked: boolean) => {
    setSelected(checked);
    if (onBumpChange) {
      onBumpChange(checked, checked ? price : 0, bumpType);
    }
  };

  return (
    <Card className="border-2 border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-background to-purple-950/10 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden my-4">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start gap-3.5">
        <Checkbox
          id="checkout-order-bump"
          checked={selected}
          onCheckedChange={(c) => handleToggle(!!c)}
          className="mt-1 h-5 w-5 rounded-md border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-purple-950"
        />

        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="checkout-order-bump"
              className="font-bold text-sm sm:text-base text-foreground cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              {isEn ? "ONE-TIME OFFER: Add Partner Compatibility Analysis" : "JEDINECNÁ NABÍDKA: Přidat Partnerský rozbor kompatibility"}
            </label>
            <Badge className="bg-amber-500 text-purple-950 font-bold text-xs">
              +199 Kč {isEn ? "(Save 60%)" : "(Sleva 60 %)"}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Check this box to include a full partner compatibility analysis for you and your partner or friend for just +199 CZK (regular price 490 CZK)."
              : "Zaškrtněte pro přibalení hloubkového rozboru partnerského vztahu pro vás a vašeho partnera či přítele jen za +199 Kč (běžná cena 490 Kč)."}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isEn ? "1-Click Instant Add-on" : "1-Click Okamžitý doplněk"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {isEn ? "2 Full Charts Included" : "Včetně 2 komplet map"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
