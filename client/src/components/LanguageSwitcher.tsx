import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, switchLocaleUrl } = useLanguage();
  const [, setLocation] = useLocation();

  const otherLocale: Locale = locale === "cs" ? "en" : "cs";
  const label = locale === "cs" ? "EN" : "CZ";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-1.5 text-xs font-medium ${className || ""}`}
      onClick={() => setLocation(switchLocaleUrl(otherLocale))}
      title={locale === "cs" ? "Switch to English" : "Přepnout do češtiny"}
    >
      <Globe className="w-3.5 h-3.5" />
      {label}
    </Button>
  );
}
