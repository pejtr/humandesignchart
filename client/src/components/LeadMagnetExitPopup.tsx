import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Sparkles, Check, ArrowRight, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

export function LeadMagnetExitPopup() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribeMutation = trpc.newsletter.subscribe.useMutation();

  useEffect(() => {
    // Only trigger once per session
    if (sessionStorage.getItem("leadMagnetExitDismissed")) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !open && !sessionStorage.getItem("leadMagnetExitDismissed")) {
        setOpen(true);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 15000); // Only activate after 15 seconds on page

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("leadMagnetExitDismissed", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(isEn ? "Please enter a valid email" : "Zadejte platný e-mail");
      return;
    }

    setLoading(true);
    try {
      await subscribeMutation.mutateAsync({ email, source: "exit_intent_lead_magnet" });
      setSubmitted(true);
      sessionStorage.setItem("leadMagnetExitDismissed", "true");
      toast.success(
        isEn
          ? "PDF Guide sent! Check your email inbox."
          : "PDF Průvodce odeslán! Zkontrolujte svou e-mailovou schránku."
      );
    } catch {
      toast.error(isEn ? "Subscription failed. Please try again." : "Přihlášení selhalo. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border border-purple-300/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {isEn
              ? "Free PDF Guide: 5 Common Human Design Pitfalls"
              : "Zdarma PDF Průvodce: 5 nejčastějších pastí vášho HD Typu"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Before you leave, grab our concise PDF guide on how to avoid decision burnout and align with your true authority."
              : "Než odejdete, stáhněte si náš stručný PDF průvodce o tom, jak se vyhnout rozhodovacímu vyhoření a žít v souladu se svou autoritou."}
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                placeholder={isEn ? "Enter your email..." : "Zadejte váš e-mail..."}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 text-xs h-11 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-medium text-xs h-11 rounded-xl shadow-md gap-2"
            >
              {loading ? (
                <span>{isEn ? "Sending..." : "Odesílám..."}</span>
              ) : (
                <>
                  <span>{isEn ? "Download Free PDF" : "Stáhnout zdarma PDF"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground/70">
              {isEn ? "No spam. Unsubscribe anytime in 1 click." : "Žádný spam. Odhlášení jedním kliknutím kdykoliv."}
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-xs text-foreground font-medium">
              {isEn
                ? "Your PDF guide is on its way to your inbox!"
                : "Váš PDF průvodce byl právě odeslán na váš e-mail!"}
            </p>
            <Button variant="outline" size="sm" onClick={handleClose} className="text-xs rounded-xl">
              {isEn ? "Close Window" : "Zavřít okno"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
