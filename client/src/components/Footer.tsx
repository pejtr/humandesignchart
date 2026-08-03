import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

function ProjectDomainBadge({ domain }: { domain: string }) {
  const extensionStart = domain.lastIndexOf(".");
  const name = extensionStart > 0 ? domain.slice(0, extensionStart) : domain;
  const extension = extensionStart > 0 ? domain.slice(extensionStart) : "";

  return (
    <span className="inline-flex overflow-hidden rounded-full border border-white/40 bg-white/90 text-[9px] font-extrabold uppercase tracking-wider shadow-md">
      <span className="px-2.5 py-1 text-slate-900">{name}</span>
      {extension && (
        <span className="border-l border-slate-300 bg-amber-400 px-1.5 py-1 text-slate-900 font-bold">
          {extension}
        </span>
      )}
    </span>
  );
}

export default function Footer() {
  const { t, locale, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
const projects = [
    {
      name: "Akčni Letenky",
      domain: "AKCNI-LETENKY.COM",
      href: "https://www.akcni-letenky.com",
      image: "https://www.akcni-letenky.com/hero-bg.jpg",
      cs: "Sledujeme ceny letenek za vás – ušetřete tisíce",
      en: "We track flight prices so you don't have to – save thousands",
    },
    {
      name: "Last Minute Dovolené",
      domain: "LASTMINUTEDOVOLENE.CZ",
      href: "https://www.lastminutedovolene.cz",
      image:
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=900&h=560&fit=crop",
      cs: "Volné termíny za hubičku – stačí si vybrat a odletět",
      en: "Last-minute deals at unbeatable prices – just pick and fly",
    },
    {
      name: "Bezmasá Jídla",
      domain: "BEZMASAJIDLA.CZ",
      href: "https://www.bezmasajidla.cz",
      image:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&h=560&fit=crop",
      cs: "Recepty, které chutnají i masožravcům",
      en: "Plant-based recipes even meat lovers can't resist",
    },
    {
      name: "Katastr Online",
      domain: "KATASTR-ONLINE.CZ",
      href: "https://www.katastr-online.cz",
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&h=560&fit=crop",
      imagePosition: "center 55%",
      cs: "Vše o nemovitostech na jednom místě – parcely, vlastníci, ceny",
      en: "Everything about properties in one place – parcels, owners, prices",
    },
    {
      name: "Čajovny Praha",
      domain: "CAJOVNY-PRAHA.CZ",
      href: "https://www.cajovny-praha.cz",
      image:
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=900&h=560&fit=crop",
      imagePosition: "center 50%",
      cs: "Oázy klidu uprostřed Prahy – kam zajít na čaj",
      en: "Oases of calm in the heart of Prague – where to enjoy tea",
    },
    {
      name: "Do Itálie",
      domain: "DO-ITALIE.CZ",
      href: "https://www.do-italie.cz",
      image:
        "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=900&h=560&fit=crop",
      cs: "Rady od místních – jak Itálii opravdu zažít",
      en: "Local tips – how to truly experience Italy",
    },
  ];

  return (
    <footer
      className={`footer-mystical bg-background/50 backdrop-blur-sm relative${isAuthenticated ? " lg:pl-14" : ""}`}
    >
      {/* Mystical sacred geometry decoration */}
      <div className="absolute inset-0 bg-sacred-geometry pointer-events-none opacity-50" />
      <div className="container py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href={localePath("/")}
              className="flex items-center gap-2.5 no-underline mb-4 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-sm group-hover:shadow-purple-500/20 transition-shadow">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
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
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">
              {t.footer.features}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={localePath("/calculate")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.chartCalculator}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/transits")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.dailyTransits}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/compare")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.chartComparison}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/celebrities")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.celebrityCharts}
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">
              {t.footer.learn}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={localePath("/iching")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.iChingOracle}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/andelska-cisla")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {locale === "cs" ? "Andělská čísla" : "Angel Numbers"}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/blog")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {locale === "cs" ? "Typy a strategie" : "Types & Strategy"}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/blog")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {locale === "cs" ? "Autorita" : "Authority"}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/encyclopedia")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {locale === "cs" ? "Brány a dráhy" : "Gates & Channels"}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/blog")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">
              {t.footer.accountLabel}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={localePath("/dashboard")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.myCharts}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath("/dashboard?tab=readings")}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {t.footer.aiReadings}
                </Link>
              </li>
            </ul>
          </div>

          {/* Partner Sites */}
          <div className="md:hidden">
            <h4 className="font-serif text-sm font-semibold text-foreground mb-4">
              {locale === "cs" ? "Další projekty" : "Partner Sites"}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="relative group/tip">
                <a
                  href="https://www.akcni-letenky.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Akční Letenky
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Akční letenky do celého světa — tipy na levné letenky, výhodné
                  nabídky a chybných tarifů.
                </span>
              </li>
              <li className="relative group/tip">
                <a
                  href="https://www.lastminutedovolene.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Last Minute Dovolené
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Nejlepší last minute zájezdy a vyhledávač výhodných dovolených
                  u moře.
                </span>
              </li>
              <li className="relative group/tip">
                <a
                  href="https://www.bezmasajidla.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Bezmasá Jídla
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Recepty bez masa — zdravé, chutné a jednoduché vaření pro
                  každý den.
                </span>
              </li>
              <li className="relative group/tip">
                <a
                  href="https://www.katastr-online.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Katastr Online
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Vyhledávání v katastru nemovitostí — parcely, vlastníci a
                  listy vlastnictví online.
                </span>
              </li>
              <li className="relative group/tip">
                <a
                  href="https://www.cajovny-praha.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Čajovny Praha
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Průvodce čajovnami v Praze — klidná místa pro relaxaci s
                  výběrovým čajem.
                </span>
              </li>
              <li className="relative group/tip">
                <a
                  href="https://www.do-italie.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Do Itálie
                </a>
                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded-md bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg border border-border/40 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
                  Průvodce cestováním po Itálii — destinace, tipy a inspirace na
                  dovolenou.
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
          <p className="text-xs text-muted-foreground">{t.footer.foundedBy}</p>
        </div>
      </div>

      <div className="relative z-10 hidden border-t border-amber-900/10 bg-[#FAF8F5] py-10 md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-[#A38A5A]">
            {locale === "cs" ? "Naše další projekty" : "Our other projects"}
          </p>
          <div
            className="projects-marquee"
            aria-label={locale === "cs" ? "Další projekty" : "Other projects"}
          >
            <div className="projects-marquee-track">
              {[0, 1].map(groupIndex => (
                <div
                  key={groupIndex}
                  className="projects-marquee-group"
                  aria-hidden={groupIndex === 1 ? true : undefined}
                >
                  {projects.map(project => (
                    <a
                      key={`${groupIndex}-${project.href}`}
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={groupIndex === 1 ? -1 : undefined}
                      className="group relative flex h-44 w-[240px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-black/5 bg-slate-100 p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:w-[200px]"
                    >
                      <img
                        src={project.image}
                        alt={project.name}
                        loading="lazy"
                        style={{
                          objectPosition: project.imagePosition || "center",
                        }}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent transition-colors group-hover:from-black/80" />
                      <div className="relative z-10 self-start">
                        <ProjectDomainBadge domain={project.domain} />
                      </div>
                      <div className="relative z-10 mt-auto flex items-end justify-between gap-2 text-white drop-shadow-lg">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-serif text-base font-bold leading-snug transition-colors group-hover:text-amber-200">
                            {project.name}
                          </h3>
                          <p className="truncate text-[11px] font-medium text-white/90">
                            {locale === "cs" ? project.cs : project.en}
                          </p>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-black">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
