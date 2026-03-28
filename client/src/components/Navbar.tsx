import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Menu, X, User, LogOut, LayoutDashboard, Compass, Star, Users,
  Sparkles, GitCompare, BookOpen, Bot, RotateCcw, ChevronDown,
  Calendar, Hexagon, UtensilsCrossed, Sun, Target, CreditCard, Zap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { t, locale, localePath } = useLanguage();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const isActive = (href: string) => location === localePath(href);

  // Subscription status
  const { data: subStatus } = trpc.subscription.status.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const isPremium = subStatus?.isPremium ?? false;
  // Credits: for premium users show ∞, for free users show numeric credits (incl. referral credits)
  const credits = subStatus?.aiReadingCredits ?? 0;
  const freeLeft = subStatus?.freeReadingsLeft ?? 0;
  // Total available readings = free tier left + bonus credits
  const totalAvailable = isPremium ? null : freeLeft + credits;
  const creditsLabel = isPremium
    ? "∞"
    : totalAvailable !== null
    ? String(totalAvailable)
    : null;

  // Pulse animation when credits increase
  const prevCreditsRef = useRef<number | null>(null);
  const [creditsPulse, setCreditsPulse] = useState(false);
  useEffect(() => {
    if (totalAvailable !== null && prevCreditsRef.current !== null && totalAvailable > prevCreditsRef.current) {
      setCreditsPulse(true);
      const timer = setTimeout(() => setCreditsPulse(false), 1500);
      return () => clearTimeout(timer);
    }
    if (totalAvailable !== null) {
      prevCreditsRef.current = totalAvailable;
    }
  }, [totalAvailable]);

  // Primary nav links — keep short to avoid overflow
  const primaryLinks = [
    { href: "/calculate", label: t.nav.calculateChart, icon: Compass },
    { href: "/encyclopedia", label: locale === "cs" ? "Encyklopedie" : "Encyclopedia", icon: BookOpen },
    { href: "/ai-guide", label: locale === "cs" ? "AI průvodce" : "AI Guide", icon: Bot },
  ];

  const toolsLinks = [
    { href: "/daily-transit", label: locale === "cs" ? "Denní tranzit" : "Daily Transit", icon: Sun, desc: locale === "cs" ? "Jak dnešní planety ovlivňují tvůj design" : "How today's planets affect your design" },
    { href: "/return-chart", label: locale === "cs" ? "Return charty" : "Return Charts", icon: RotateCcw, desc: locale === "cs" ? "Solární, Saturnův a další Return charty" : "Solar, Saturn, and other Return charts" },
    { href: "/compare", label: t.nav.compare, icon: GitCompare, desc: locale === "cs" ? "Porovnání dvou Human Design map" : "Compare two Human Design charts" },
    { href: "/transits", label: t.nav.transits, icon: Star, desc: locale === "cs" ? "Aktuální planetární tranzity" : "Current planetary transits" },
    { href: "/transit-calendar", label: locale === "cs" ? "Tranzitní kalendář" : "Transit Calendar", icon: Calendar, desc: locale === "cs" ? "Denní a týdní přehled tranzitů" : "Daily and weekly transit overview" },
    { href: "/variables", label: locale === "cs" ? "Proměnné (PHS)" : "Variables (PHS)", icon: UtensilsCrossed, desc: locale === "cs" ? "Strávení, prostředí, perspektiva, vědomí" : "Digestion, environment, perspective, awareness" },
  ];

  const exploreLinks = [
    { href: "/celebrities", label: t.nav.celebrities, icon: Users, desc: locale === "cs" ? "Mapy známých osobností" : "Charts of famous people" },
    { href: "/iching", label: t.nav.iChing, icon: Hexagon, desc: locale === "cs" ? "I-Ťing orákulum" : "I Ching Oracle" },
    { href: "/incarnation-cross", label: locale === "cs" ? "Inkarnační kříž" : "Incarnation Cross", icon: Target, desc: locale === "cs" ? "Životní poslání a 4 brány kříže" : "Life purpose and 4 gates of the cross" },
    { href: "/blog", label: "Blog", icon: BookOpen, desc: locale === "cs" ? "Články o Human Design" : "Human Design articles" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="container flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link href={localePath("/")} className="flex items-center gap-2 no-underline shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground hidden sm:block">
              {t.common.appName}
            </span>
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {primaryLinks.map(link => (
              <Link key={link.href} href={localePath(link.href)}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm"
                >
                  <link.icon className="w-4 h-4 mr-1.5" />
                  {link.label}
                </Button>
              </Link>
            ))}

            {/* Tools dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm gap-1">
                  <Calendar className="w-4 h-4" />
                  {locale === "cs" ? "Nástroje" : "Tools"}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-popover text-popover-foreground">
                {toolsLinks.map(link => (
                  <Link key={link.href} href={localePath(link.href)}>
                    <DropdownMenuItem className="cursor-pointer py-2.5">
                      <link.icon className="w-4 h-4 mr-2.5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Explore dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm gap-1">
                  <Sparkles className="w-4 h-4" />
                  {locale === "cs" ? "Prozkoumat" : "Explore"}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-popover text-popover-foreground">
                {exploreLinks.map(link => (
                  <Link key={link.href} href={localePath(link.href)}>
                    <DropdownMenuItem className="cursor-pointer py-2.5">
                      <link.icon className="w-4 h-4 mr-2.5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pricing link */}
            <Link href={localePath("/pricing")}>
              <Button
                variant={isActive("/pricing") ? "secondary" : "ghost"}
                size="sm"
                className="text-sm"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                {locale === "cs" ? "Ceník" : "Pricing"}
              </Button>
            </Link>
          </div>

          {/* Desktop right section: language + user */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                {/* Credits badge — links to Dashboard subscription tab */}
                {creditsLabel !== null && (
                  <Link href={localePath("/dashboard")}>
                    <button
                      title={locale === "cs" ? `${creditsLabel === "∞" ? "Neomezené" : creditsLabel} AI výkladů k dispozici` : `${creditsLabel === "∞" ? "Unlimited" : creditsLabel} AI readings available`}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all
                        bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20
                        hover:bg-purple-500/20 hover:border-purple-500/40
                        ${creditsPulse ? 'ring-2 ring-purple-400 ring-offset-1 scale-110 bg-purple-500/20' : ''}`}
                    >
                      <Sparkles className={`w-3 h-3 ${creditsPulse ? 'animate-spin' : ''}`} />
                      {creditsLabel}
                    </button>
                  </Link>
                )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" title={user?.name || t.common.account}>
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-popover text-popover-foreground">
                  {/* User name + plan badge */}
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-sm font-semibold truncate">{user?.name || t.common.account}</p>
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 mt-0.5">
                        👑 Premium
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">{locale === "cs" ? "Free plán" : "Free plan"}</span>
                    )}
                  </div>
                  <Link href={localePath("/dashboard")}>
                    <DropdownMenuItem>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {t.common.dashboard}
                    </DropdownMenuItem>
                  </Link>
                  {/* Credit pack quick-buy — only for non-premium */}
                  {!isPremium && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href={localePath("/pricing")}>
                        <DropdownMenuItem className="text-primary focus:text-primary">
                          <Zap className="w-4 h-4 mr-2" />
                          {locale === "cs" ? "5 výkladů za 49 Kč" : "5 readings – €1.99"}
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.common.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t.common.signIn}
                </Button>
              </a>
            )}
          </div>

          {/* Mobile: hamburger only */}
          <div className="flex lg:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => setMobileOpen(true)}
              aria-label={locale === "cs" ? "Otevřít menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Full-screen mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          aria-hidden="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Full-screen slide-in drawer */}
      <div
        id="mobile-menu"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={locale === "cs" ? "Navigační menu" : "Navigation menu"}
        className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm z-[70] bg-background flex flex-col lg:hidden"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderLeft: "1px solid var(--border)",
        }}
        aria-hidden={!mobileOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <Link href={localePath("/")} className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">{t.common.appName}</span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              className="p-2 -mr-1"
              onClick={() => setMobileOpen(false)}
              aria-label={locale === "cs" ? "Zavřít menu" : "Close menu"}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Drawer content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Main section */}
          <div className="px-3 pt-4 pb-2">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-3 pb-2">
              {locale === "cs" ? "Hlavní" : "Main"}
            </p>
            {primaryLinks.map(link => (
              <Link key={link.href} href={localePath(link.href)}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors mb-1 ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive(link.href) ? "bg-primary/20" : "bg-muted"}`}>
                    <link.icon className="w-4 h-4" />
                  </div>
                  <span>{link.label}</span>
                </button>
              </Link>
            ))}
            {/* Pricing in main section */}
            <Link href={localePath("/pricing")}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors mb-1 ${
                  isActive("/pricing")
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive("/pricing") ? "bg-primary/20" : "bg-muted"}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span>{locale === "cs" ? "Ceník" : "Pricing"}</span>
              </button>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-border/40 mx-3 my-1" />

          {/* Tools section */}
          <div className="px-3 py-2">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-3 pb-2">
              {locale === "cs" ? "Nástroje" : "Tools"}
            </p>
            {toolsLinks.map(link => (
              <Link key={link.href} href={localePath(link.href)}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive(link.href) ? "bg-primary/20" : "bg-muted"}`}>
                    <link.icon className="w-4 h-4 text-primary/70" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium leading-tight">{link.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{link.desc}</p>
                  </div>
                </button>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border/40 mx-3 my-1" />

          {/* Explore section */}
          <div className="px-3 py-2">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-3 pb-2">
              {locale === "cs" ? "Prozkoumat" : "Explore"}
            </p>
            {exploreLinks.map(link => (
              <Link key={link.href} href={localePath(link.href)}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive(link.href) ? "bg-primary/20" : "bg-muted"}`}>
                    <link.icon className="w-4 h-4 text-primary/70" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium leading-tight">{link.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{link.desc}</p>
                  </div>
                </button>
              </Link>
            ))}
          </div>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>

        {/* Drawer footer — auth */}
        <div className="border-t border-border/50 px-3 py-3 shrink-0 bg-muted/20">
          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background border border-border/50 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name || t.common.account}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        👑 Premium
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">{locale === "cs" ? "Free plán" : "Free plan"}</span>
                    )}
                    {creditsLabel !== null && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all ${creditsPulse ? 'ring-1 ring-purple-400 scale-110' : ''}`}>
                        <Sparkles className={`w-2.5 h-2.5 ${creditsPulse ? 'animate-spin' : ''}`} />
                        {creditsLabel} {locale === "cs" ? "výkladů" : "readings"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Upgrade CTA for non-premium users */}
              {!isPremium && (
                <Link href={localePath("/pricing")}>
                  <button
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mb-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Zap className="w-4 h-4" />
                    {locale === "cs" ? "Upgradovat na Premium" : "Upgrade to Premium"}
                  </button>
                </Link>
              )}
              <Link href={localePath("/dashboard")}>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4 text-primary/70" />
                  {t.common.dashboard}
                </button>
              </Link>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
                {t.common.signOut}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <a href={getLoginUrl()} className="block">
                <Button className="w-full bg-primary text-primary-foreground">
                  <User className="w-4 h-4 mr-2" />
                  {t.common.signIn}
                </Button>
              </a>
              <p className="text-[11px] text-muted-foreground text-center px-2">
                {locale === "cs"
                  ? "Přihlaste se pro uložení map a AI výklady"
                  : "Sign in to save charts and get AI readings"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
