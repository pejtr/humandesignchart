import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, switchLocaleUrl } = useLanguage();
  const [, setLocation] = useLocation();

  const otherLocale: Locale = locale === "cs" ? "en" : "cs";
  const label = locale === "cs" ? "EN" : "CS";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-1.5 text-sm font-medium ${className || ""}`}
      onClick={() => setLocation(switchLocaleUrl(otherLocale))}
      title={locale === "cs" ? "Switch to English" : "Přepnout do češtiny"}
    >
      <div className="flex shrink-0 items-center overflow-hidden rounded-[2px] shadow-sm ring-1 ring-black/10 w-[18px] h-[12px]">
        {locale === "cs" ? (
          // UK Flag
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="100%" height="100%" preserveAspectRatio="none">
            <clipPath id="s">
              <path d="M0,0 v30 h60 v-30 z" />
            </clipPath>
            <clipPath id="t">
              <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
            </clipPath>
            <g clipPath="url(#s)">
              <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
              <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
              <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
              <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
            </g>
          </svg>
        ) : (
          // CZ Flag
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="100%" height="100%" preserveAspectRatio="none">
            <rect width="900" height="600" fill="#d7141a" />
            <rect width="900" height="300" fill="#fff" />
            <polygon points="0,0 0,600 450,300" fill="#11457e" />
          </svg>
        )}
      </div>
      {label}
    </Button>
  );
}
