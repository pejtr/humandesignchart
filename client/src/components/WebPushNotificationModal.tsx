import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, Check, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export function WebPushNotificationModal() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision about notifications
    const promptSeen = localStorage.getItem("hd_push_prompt_seen");
    if (!promptSeen && typeof window !== "undefined" && "Notification" in window) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 5000); // Prompt 5 seconds after page load
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    localStorage.setItem("hd_push_prompt_seen", "true");
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setEnabled(true);
          toast.success(
            isEn
              ? "Web push notifications enabled! You will get daily HD transit gate alerts."
              : "Notifikace povoleny! Budete dostávat osobní upozornění na denní tranzity v hranách."
          );
        } else {
          toast.info(isEn ? "Notifications dismissed." : "Notifikace byly zamítnuty.");
        }
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("hd_push_prompt_seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-background border border-amber-400/40 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <DialogTitle className="text-xl font-serif font-bold text-foreground">
            {isEn ? "Enable Daily HD Transit Alerts" : "Zapnout Denní HD Tranzitní Upozornění"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEn
              ? "Get instant browser notifications when daily planetary transits activate your open gates."
              : "Získejte okamžitá upozornění přímo na plochu nebo mobil, když planeta na obloze aktivuje vaši neobsazenou bránu."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              {isEn ? "What you will receive:" : "Co budete dostávat:"}
            </div>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>{isEn ? "Morning gate activation alerts" : "Ranní upozornění na Sluneční bránu"}</li>
              <li>{isEn ? "New Moon & Full Moon transit cycles" : "Cyklace Novoluní a Úplňků"}</li>
              <li>{isEn ? "No spam — 1 optional push daily" : "Žádný spam — max 1 zpráva denně"}</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDismiss} className="w-1/2 text-xs h-10 rounded-xl">
              {isEn ? "Not Now" : "Nyní Ne"}
            </Button>
            <Button
              onClick={handleEnableNotifications}
              className="w-1/2 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs h-10 rounded-xl gap-1.5 shadow-md"
            >
              <Bell className="w-4 h-4 text-purple-950" />
              {isEn ? "Enable Push" : "Zapnout Notifikace"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
