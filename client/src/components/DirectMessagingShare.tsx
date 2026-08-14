import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface DirectMessagingShareProps {
  title?: string;
  shareUrl?: string;
}

export function DirectMessagingShare({ title, shareUrl }: DirectMessagingShareProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const url = shareUrl || window.location.href;
  const message = isEn
    ? `Check out my Human Design energetic chart! Calculate yours here: ${url}`
    : `Ahoj! Právě jsem si spočítal/a svou Human Design mapu. Spočti si ji taky a porovnejme kompatibilitu: ${url}`;

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Human Design Mapa",
          text: message,
          url,
        });
      } catch {
        // The native share sheet reports cancellation as an exception.
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success(isEn ? "Link copied!" : "Odkaz zkopírován!");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 my-3">
      <Button
        size="sm"
        onClick={handleWhatsApp}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl gap-1.5 h-9 px-3.5 shadow-sm"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </Button>

      <Button
        size="sm"
        onClick={handleTelegram}
        className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl gap-1.5 h-9 px-3.5 shadow-sm"
      >
        <Send className="w-3.5 h-3.5" />
        Telegram
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleWebShare}
        className="text-xs rounded-xl gap-1.5 h-9 px-3.5 border-border"
      >
        <Share2 className="w-3.5 h-3.5" />
        {isEn ? "Share Link" : "Sdílet mapu"}
      </Button>
    </div>
  );
}
