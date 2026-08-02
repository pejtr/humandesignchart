import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Check, Sparkles, Globe } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CalendarIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarIntegrationModal({ open, onOpenChange }: CalendarIntegrationModalProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [downloaded, setDownloaded] = useState(false);

  const handleExportICal = () => {
    // Generate iCal file for HD transit events
    const icalContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HumanDesignApp//NONSGML Transit Calendar//EN\nBEGIN:VEVENT\nSUMMARY:HD Transit: Slunce v Bráně 33\nDESCRIPTION:Dnešní tranzit aktivuje Bránu 33 (Ústup a Soukromí). Udělejte si čas na denní reflexi.\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", "hd_transits_2026.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    toast.success(
      isEn
        ? "Human Design iCal calendar downloaded! Import it into Google or Apple Calendar."
        : "iCal kalendář s HD tranzity stažen! Importujte jej do Google nebo Apple Kalendáře."
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border border-amber-300/40 dark:border-amber-800/40 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-serif font-bold text-foreground">
            {isEn ? "Sync HD Transits to Google / Apple Calendar" : "Synchronizovat HD Tranzity do Kalendáře"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEn
              ? "Get daily planetary transit notifications directly inside your smartphone's native calendar app."
              : "Získejte přehled o klíčových tranzitech planet a aktivacích bran přímo ve vašem mobilním či pracovní kalendáři."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {isEn ? "What gets synchronized:" : "Co bude synchronizováno:"}
            </div>
            <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
              <li>{isEn ? "Daily Sun & Earth gate movement" : "Denní posuny Slunce a Země v branách I-Čing"}</li>
              <li>{isEn ? "New Moon & Full Moon transit cycles" : "Cyklace Novoluní a Úplňků v branách"}</li>
              <li>{isEn ? "Personal gate activation alerts" : "Upozornění na aktivaci neobsazených bran"}</li>
            </ul>
          </div>

          <Button
            onClick={handleExportICal}
            className="w-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white font-bold text-xs h-11 rounded-xl shadow-lg gap-2"
          >
            {downloaded ? <Check className="w-4 h-4 text-emerald-300" /> : <Download className="w-4 h-4" />}
            {isEn ? "Download .ics Calendar File" : "Stáhnout .ics Soubor do Kalendáře"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
