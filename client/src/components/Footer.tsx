import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Footer() {
  const { t, locale, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const projects = [
    { name: "Akční Letenky", domain: "AKCNI-LETENKY.COM", href: "https://www.akcni-letenky.com", image: "https://www.akcni-letenky.com/hero-bg.jpg", cs: "Inspirace pro výhodné cestování", en: "Inspiration for affordable travel" },
    { name: "Last Minute Dovolené", domain: "LASTMINUTEDOVOLENE.CZ", href: "https://www.lastminutedovolene.cz", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=900&h=560&fit=crop", cs: "Dovolená, která nepočká", en: "Holidays that cannot wait" },
    { name: "Bezmasá Jídla", domain: "BEZMASAJIDLA.CZ", href: "https://www.bezmasajidla.cz", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&h=560&fit=crop", cs: "Chutná inspirace bez masa", en: "Delicious meat-free inspiration" },
    { name: "Katastr Online", domain: "KATASTR-ONLINE.CZ", href: "https://www.katastr-online.cz", image: "https://katastr-online.cz/og-image.jpg", cs: "Nemovitosti a parcely přehledně", en: "Property records made clear" },
    { name: "Čajovny Praha", domain: "CAJOVNY-PRAHA.CZ", href: "https://www.cajovny-praha.cz", image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663032296198/yxZoXDMoMcHuiGuf.jpg", cs: "Pražské čajovny s atmosférou", en: "Prague tea houses with atmosphere" },
    { name: "Do Itálie", domain: "DO-ITALIE.CZ", href: "https://www.do-italie.cz", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=900&h=560&fit=crop", cs: "Itálie od inspirace po cestu", en: "Italy from inspiration to journey" },
  ];

  return (
    <footer className={`footer-mystical bg-background/50 backdrop-blur-sm relative${isAuthenticated ? " lg:pl-14" : ""}`}>
      {/* Mystical sacred geometry decoration */}
      <div className="absolute inset-0 bg-sacred-geometry pointer-events-none opacity-50" />
      <div className="container py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline mb-4 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-sm group-hover:shadow-purple-500/20 transition-shadow">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="4" r="2" />
                  <circle cx="12" cy="12" r="2.5" />
                  <circle cx="12" cy="20" r="2" />
                  <circle cx="6" cy="8" r="1.5" />
                  <circle cx="18" cy="8" r="1.5" />
                  <line x1="12" y1="6" x2="12" y2="9.5" />
                  <line x1="12" y1="14.5" x2="12" y2="18" />
                  <line x1="7.2" y1="7" x2="10" y2="10.5" />
                  <line x1="16.8" y1="7" x2="14" y2="10.5" />
                </svg>
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                Human Design
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
              <li><Link href={localePath("/calculate")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.chartCalculator}</Link></li>
              <li><Link href={localePath("/transits")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.dailyTransits}</Link></li>
              <li><Link href={localePath("/compare")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.chartComparison}</Link></li>
              <li><Link href={localePath("/celebrities")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.celebrityCharts}</Link></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.learn}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath("/iching")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.iChingOracle}</Link></li>
              <li><Link href={localePath("/andelska-cisla")} className="cursor-pointer hover:text-primary transition-colors">{locale === "cs" ? "Andělská čísla" : "Angel Numbers"}</Link></li>
              <li><Link href={localePath("/blog")} className="cursor-pointer hover:text-primary transition-colors">{locale === "cs" ? "Typy a strategie" : "Types & Strategy"}</Link></li>
              <li><Link href={localePath("/blog")} className="cursor-pointer hover:text-primary transition-colors">{locale === "cs" ? "Autorita" : "Authority"}</Link></li>
              <li><Link href={localePath("/encyclopedia")} className="cursor-pointer hover:text-primary transition-colors">{locale === "cs" ? "Brány a dráhy" : "Gates & Channels"}</Link></li>
              <li><Link href={localePath("/blog")} className="cursor-pointer hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{t.footer.accountLabel}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath("/dashboard")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.myCharts}</Link></li>
              <li><Link href={localePath("/dashboard?tab=readings")} className="cursor-pointer hover:text-primary transition-colors">{t.footer.aiReadings}</Link></li>
            </ul>
          </div>

          {/* Partner Sites */}
          <div className="md:hidden">
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">{locale === "cs" ? "Další projekty" : "Partner Sites"}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="relative group/tip">
                <a href="https://www.akcni-letenky.com" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Akční Letenky
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Akční letenky do celého světa — tipy na levné letenky, výhodné nabídky a chybných tarifů.
                </span>
              </li>
              <li className="relative group/tip">
                <a href="https://www.lastminutedovolene.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Last Minute Dovolené
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Nejlepší last minute zájezdy a vyhledávač výhodných dovolených u moře.
                </span>
              </li>
              <li className="relative group/tip">
                <a href="https://www.bezmasajidla.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Bezmasá Jídla
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Recepty bez masa — zdravé, chutné a jednoduché vaření pro každý den.
                </span>
              </li>
              <li className="relative group/tip">
                <a href="https://www.katastr-online.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Katastr Online
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Vyhledávání v katastru nemovitostí — parcely, vlastníci a listy vlastnictví online.
                </span>
              </li>
              <li className="relative group/tip">
                <a href="https://www.cajovny-praha.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Čajovny Praha
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Průvodce čajovnami v Praze — klidná místa pro relaxaci s výběrovým čajem.
                </span>
              </li>
              <li className="relative group/tip">
                <a href="https://www.do-italie.cz" target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors">
                  Do Itálie
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Průvodce cestováním po Itálii — destinace, tipy a inspirace na dovolenou.
                </span>
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

      <div className="relative z-10 hidden border-t border-amber-200/60 bg-gradient-to-b from-amber-50/70 to-stone-50/80 py-7 md:block">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
          <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-800/65">
            {locale === "cs" ? "Naše další projekty" : "Our other projects"}
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {projects.map(project => (
              <a
                key={project.href}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative h-40 min-w-[260px] flex-1 overflow-hidden rounded-2xl border border-white/50 bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <img src={project.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
                <span className="absolute left-4 top-3 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[9px] font-semibold tracking-wider text-white/85 backdrop-blur-md">
                  {project.domain}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-lg font-semibold leading-tight">{project.name}</h3>
                    <p className="mt-1 truncate text-[11px] text-white/75">{locale === "cs" ? project.cs : project.en}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md transition group-hover:bg-white group-hover:text-slate-900">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
