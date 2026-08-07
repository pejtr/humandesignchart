import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode, Building2, ShieldCheck, Lock, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ComgateCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  priceCZK?: number;
}

export function ComgateCheckoutModal({
  open,
  onOpenChange,
  itemName = "Kompletní HD Blueprint + AI Marie",
  priceCZK = 390,
}: ComgateCheckoutModalProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [selectedMethod, setSelectedMethod] = useState<"CARD_ALL" | "BANK_ALL" | "ALL">("ALL");
  const [loading, setLoading] = useState(false);

  const handleComgatePayment = async () => {
    setLoading(true);
    toast.info(
      isEn
        ? "Connecting to Comgate Payment Gateway..."
        : "Připojuji k bezpečné platební bráně Comgate..."
    );

    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      toast.success(
        isEn
          ? "Redirecting to Comgate payment gateway (QR Code & Bank Buttons)..."
          : "Přesměrování na bránu Comgate (QR Kód & Bankovní tlačítka)..."
      );
      window.open("https://payments.comgate.cz", "_blank");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {isEn ? "Comgate Payment Gateway (CZK / EUR)" : "Platební Brána Comgate"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEn
              ? "Choose your preferred payment method: Instant QR Code, Czech Bank Buttons, or Payment Card."
              : "Vyberte si pohodlnou metodu platby: Rychlá QR platba z bankovní aplikace, Bankovní tlačítko nebo Karta."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Item & Price Header */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-foreground">{itemName}</div>
              <div className="text-xs text-muted-foreground">{isEn ? "Digital Access + PDF Report" : "Okamžitý digitální přístup + PDF"}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{priceCZK} Kč</div>
              <div className="text-[10px] text-muted-foreground">včetně DPH</div>
            </div>
          </div>

          {/* Comgate Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              {isEn ? "Select Payment Option" : "Vyberte Způsob Platby"}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedMethod("ALL")}
                className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                  selectedMethod === "ALL"
                    ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500 font-bold"
                    : "border-border/60 bg-muted/40 hover:bg-muted"
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-500" />
                <span>QR Platba</span>
              </button>

              <button
                onClick={() => setSelectedMethod("BANK_ALL")}
                className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                  selectedMethod === "BANK_ALL"
                    ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500 font-bold"
                    : "border-border/60 bg-muted/40 hover:bg-muted"
                }`}
              >
                <Building2 className="w-5 h-5 text-blue-500" />
                <span>Moje Banka</span>
              </button>

              <button
                onClick={() => setSelectedMethod("CARD_ALL")}
                className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                  selectedMethod === "CARD_ALL"
                    ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500 font-bold"
                    : "border-border/60 bg-muted/40 hover:bg-muted"
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-500" />
                <span>Karta & Apple Pay</span>
              </button>
            </div>
          </div>

          <Button
            onClick={handleComgatePayment}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-lg gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isEn ? `Pay ${priceCZK} CZK with Comgate` : `Zaplatit ${priceCZK} Kč přes Comgate`}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Zabezpečený přenos dat SSL · Licence ČNB · Comgate a.s.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
