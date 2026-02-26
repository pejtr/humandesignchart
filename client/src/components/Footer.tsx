import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 no-underline mb-4">
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
              <li><Link href="/calculate" className="hover:text-primary transition-colors">{t.footer.chartCalculator}</Link></li>
              <li><Link href="/transits" className="hover:text-primary transition-colors">{t.footer.dailyTransits}</Link></li>
              <li><Link href="/compare" className="hover:text-primary transition-colors">{t.footer.chartComparison}</Link></li>
              <li><Link href="/celebrities" className="hover:text-primary transition-colors">{t.footer.celebrityCharts}</Link></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.learn}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/iching" className="hover:text-primary transition-colors">{t.footer.iChingOracle}</Link></li>
              <li><Link href="/calculate" className="hover:text-primary transition-colors">{t.footer.typesStrategy}</Link></li>
              <li><Link href="/calculate" className="hover:text-primary transition-colors">{t.footer.authorityLabel}</Link></li>
              <li><Link href="/calculate" className="hover:text-primary transition-colors">{t.footer.gatesChannels}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.accountLabel}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">{t.common.dashboard}</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">{t.footer.myCharts}</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">{t.footer.aiReadings}</Link></li>
            </ul>
          </div>

          {/* Partner Sites */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">Další projekty</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://cajovny-praha.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Čajovny Praha
                </a>
              </li>
              <li>
                <a href="https://katastr-online.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Katastr Online
                </a>
              </li>
              <li>
                <a href="https://akcni-letenky.com" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Akční Letenky
                </a>
              </li>
              <li>
                <a href="https://do-italie.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Do Itálie
                </a>
              </li>
              <li>
                <a href="https://amulets.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Amulets.cz
                </a>
              </li>
              <li>
                <a href="https://ohorai.com" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Ohorai
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
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
