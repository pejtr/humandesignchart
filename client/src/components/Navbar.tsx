import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Menu, X, User, LogOut, LayoutDashboard, Compass, Star, Users,
  Sparkles, GitCompare, BookOpen, Bot, RotateCcw, ChevronDown,
  Calendar, Hexagon, UtensilsCrossed, ChevronRight, Sun,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();

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

  const isActive = (href: string) => location === href;

  const primaryLinks = [
    { href: "/calculate", label: t.nav.calculateChart, icon: Compass },
    { href: "/encyclopedia", label: "Encyklopedie", icon: BookOpen },
    { href: "/ai-guide", label: "AI průvodce", icon: Bot },
  ];

  const toolsLinks = [
    { href: "/daily-transit", label: "Denní tranzit", icon: Sun, desc: "Jak dnešní planety ovlivňují tvůj design" },
    { href: "/return-chart", label: "Return charty", icon: RotateCcw, desc: "Solární, Saturnův a další Return charty" },
    { href: "/compare", label: t.nav.compare, icon: GitCompare, desc: "Porovnání dvou Human Design map" },
    { href: "/transits", label: t.nav.transits, icon: Star, desc: "Aktuální planetární tranzity" },
    { href: "/transit-calendar", label: "Tranzitní kalendář", icon: Calendar, desc: "Denní a týdní přehled tranzitů" },
    { href: "/variables", label: "Proměnné (PHS)", icon: UtensilsCrossed, desc: "Strávení, prostředí, perspektiva, vědomí" },
  ];

  const exploreLinks = [
    { href: "/celebrities", label: t.nav.celebrities, icon: Users, desc: "Mapy známých osobností" },
    { href: "/iching", label: t.nav.iChing, icon: Hexagon, desc: "I-Ťing orákulum" },
    { href: "/blog", label: "Blog", icon: BookOpen, desc: "Články o Human Design" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              {t.common.appName}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {primaryLinks.map(link => (
              <Link key={link.href} href={link.href}>
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
                  Nástroje
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-popover text-popover-foreground">
                {toolsLinks.map(link => (
                  <Link key={link.href} href={link.href}>
                    <DropdownMenuItem className="cursor-pointer py-2.5">
                      <link.icon className="w-4 h-4 mr-2.5 text-primary" />
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
                  Prozkoumat
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 bg-popover text-popover-foreground">
                {exploreLinks.map(link => (
                  <Link key={link.href} href={link.href}>
                    <DropdownMenuItem className="cursor-pointer py-2.5">
                      <link.icon className="w-4 h-4 mr-2.5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop auth section */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm max-w-[120px] truncate">{user?.name || t.common.account}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground">
                  <Link href="/dashboard">
                    <DropdownMenuItem>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {t.common.dashboard}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.common.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t.common.signIn}
                </Button>
              </a>
            )}
          </div>

          {/* Mobile: auth + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="p-2">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Otevřít menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] bg-background shadow-2xl lg:hidden flex flex-col"
        style={{
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderLeft: '1px solid var(--border)',
        }}
        aria-hidden={!mobileOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-serif text-lg font-semibold">{t.common.appName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 -mr-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Zavřít menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Drawer content — scrollable */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {/* Primary links */}
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-3 pt-2 pb-1.5">Hlavní</p>
          {primaryLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                {link.label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
              </button>
            </Link>
          ))}

          <div className="border-t border-border/40 my-3" />
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-3 pb-1.5">Nástroje</p>
          {toolsLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0 text-primary/70" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium leading-tight">{link.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{link.desc}</p>
                </div>
              </button>
            </Link>
          ))}

          <div className="border-t border-border/40 my-3" />
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest px-3 pb-1.5">Prozkoumat</p>
          {exploreLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0 text-primary/70" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium leading-tight">{link.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{link.desc}</p>
                </div>
              </button>
            </Link>
          ))}
        </div>

        {/* Drawer footer — auth */}
        <div className="border-t border-border/50 px-3 py-3">
          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium truncate">{user?.name || t.common.account}</span>
              </div>
              <Link href="/dashboard">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <LayoutDashboard className="w-4 h-4 text-primary/70" />
                  {t.common.dashboard}
                </button>
              </Link>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
                {t.common.signOut}
              </button>
            </div>
          ) : (
            <a href={getLoginUrl()} className="block">
              <Button className="w-full bg-primary text-primary-foreground">
                {t.common.signIn}
              </Button>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
