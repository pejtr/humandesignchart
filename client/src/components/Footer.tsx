import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t, locale, localePath } = useLanguage();

  return (
    <footer className="footer-mystical bg-background/50 backdrop-blur-sm relative">
      {/* Mystical sacred geometry decoration */}
      <div className="absolute inset-0 bg-sacred-geometry pointer-events-none opacity-50" />
      <div className="container py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={localePath("/")} className="flex items-center gap-2 no-underline mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="font-serif text-lg font-semibold text-foreground">
                {t.common.appName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.features}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath("/calculate")} className="hover:text-primary transition-colors">{t.footer.chartCalculator}</Link></li>
              <li><Link href={localePath("/transits")} className="hover:text-primary transition-colors">{t.footer.dailyTransits}</Link></li>
              <li><Link href={localePath("/compare")} className="hover:text-primary transition-colors">{t.footer.chartComparison}</Link></li>
              <li><Link href={localePath("/celebrities")} className="hover:text-primary transition-colors">{t.footer.celebrityCharts}</Link></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.learn}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath("/iching")} className="hover:text-primary transition-colors">{t.footer.iChingOracle}</Link></li>
              <li><Link href={localePath("/calculate")} className="hover:text-primary transition-colors">{t.footer.typesStrategy}</Link></li>
              <li><Link href={localePath("/calculate")} className="hover:text-primary transition-colors">{t.footer.authorityLabel}</Link></li>
              <li><Link href={localePath("/calculate")} className="hover:text-primary transition-colors">{t.footer.gatesChannels}</Link></li>
              <li><Link href={localePath("/blog")} className="hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.accountLabel}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath("/dashboard")} className="hover:text-primary transition-colors">{t.common.dashboard}</Link></li>
              <li><Link href={localePath("/dashboard")} className="hover:text-primary transition-colors">{t.footer.myCharts}</Link></li>
              <li><Link href={localePath("/dashboard")} className="hover:text-primary transition-colors">{t.footer.aiReadings}</Link></li>
            </ul>
          </div>

          {/* Partner Sites */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{locale === "cs" ? "Další projekty" : "Partner Sites"}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://bezmasajidla.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Bezmasá Jídla
                </a>
              </li>
              <li>
                <a href="https://katastr-online.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Katastr Online
                </a>
              </li>
              <li>
                <a href="https://cajovny-praha.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Čajovny Praha
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mystical-divider mt-8 mb-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.footer.foundedBy}
          </p>
        </div>
      </div>
    </footer>
  );
}
