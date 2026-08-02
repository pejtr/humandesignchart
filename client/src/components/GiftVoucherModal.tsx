import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Sparkles, Check, ArrowRight, Heart, Download } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface GiftVoucherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GiftVoucherModal({ open, onOpenChange }: GiftVoucherModalProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [voucherCreated, setVoucherCreated] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName) {
      toast.error(isEn ? "Please enter recipient name" : "Zadejte jméno obdarovaného");
      return;
    }

    const code = `HDGIFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setVoucherCode(code);
    setVoucherCreated(true);
    toast.success(
      isEn
        ? "Gift voucher created successfully!"
        : "Dárkový poukaz byl úspěšně vytvořen!"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border border-purple-300/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300">
            <Gift className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {isEn ? "Gift Human Design Reading" : "Darovat Human Design Rozbor"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEn
              ? "Give a beautiful personal Human Design PDF Blueprint to your partner, friend or child."
              : "Věnujte krásný osobní Human Design 40-stránkový rozbor svému partnerovi, dítěti či příteli."}
          </DialogDescription>
        </DialogHeader>

        {!voucherCreated ? (
          <form onSubmit={handleCreateVoucher} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "Recipient Name *" : "Jméno obdarovaného *"}
              </label>
              <Input
                placeholder={isEn ? "e.g. Marie Nováková" : "např. Marie Nováková"}
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "Recipient Email (optional)" : "E-mail obdarovaného (volitelné)"}
              </label>
              <Input
                type="email"
                placeholder={isEn ? "recipient@example.com" : "obdarovany@email.cz"}
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "Personal Wish / Message" : "Osobní přání na poukazu"}
              </label>
              <Input
                placeholder={isEn ? "e.g. Happy Birthday!" : "např. Všechno nejlepší k narozeninám!"}
                value={personalMessage}
                onChange={e => setPersonalMessage(e.target.value)}
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs h-11 rounded-xl shadow-md gap-2 mt-2"
            >
              <Heart className="w-4 h-4 text-pink-200" />
              {isEn ? "Create Voucher (490 CZK)" : "Vytvořit Dárkový Poukaz (490 Kč)"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-3">
            <div className="p-4 rounded-2xl border-2 border-dashed border-purple-400 bg-purple-50/50 dark:bg-purple-950/40 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                {isEn ? "GIFT VOUCHER CODE" : "KÓD DÁRKOVÉHO POUKAZU"}
              </span>
              <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-300 tracking-wider">
                {voucherCode}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {isEn ? `For: ${recipientName}` : `Pro: ${recipientName}`}
              </p>
              {personalMessage && (
                <p className="text-xs italic text-purple-700 dark:text-purple-300 pt-1">
                  "{personalMessage}"
                </p>
              )}
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-purple-600 text-white font-medium text-xs h-10 rounded-xl"
            >
              {isEn ? "Done & Close" : "Hotovo & Zavřít"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
