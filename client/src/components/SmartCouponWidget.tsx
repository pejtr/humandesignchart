import { useState, useEffect } from "react";
import { Tag, Sparkles, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface SmartCouponWidgetProps {
  onApplyCoupon?: (discountPercent: number, code: string) => void;
}

export function SmartCouponWidget({ onApplyCoupon }: SmartCouponWidgetProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; percent: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const couponParam = urlParams.get("coupon") || urlParams.get("code") || urlParams.get("promo");

    if (couponParam) {
      const codeUpper = couponParam.toUpperCase();
      let percent = 15;
      if (codeUpper.includes("50") || codeUpper === "VSL50") percent = 50;
      if (codeUpper.includes("30") || codeUpper === "WELCOME30") percent = 30;

      setActiveCoupon({ code: codeUpper, percent });
      if (onApplyCoupon) onApplyCoupon(percent, codeUpper);

      toast.success(
        isEn
          ? `Promo code ${codeUpper} applied! You save ${percent}%`
          : `Slevový kód ${codeUpper} aktivován! Ušetříte ${percent} %`
      );
    }
  }, [isEn, onApplyCoupon]);

  if (!activeCoupon) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs my-4 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
        <Tag className="w-4 h-4" />
        <span>
          {isEn
            ? `Promo Coupon ACTIVE: ${activeCoupon.code} (-${activeCoupon.percent}%)`
            : `Slevový Kód AKTIVNÍ: ${activeCoupon.code} (-${activeCoupon.percent} %)`}
        </span>
      </div>

      <button
        onClick={() => setActiveCoupon(null)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
