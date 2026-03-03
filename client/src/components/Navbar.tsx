import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Menu, X, User, LogOut, LayoutDashboard, Compass, Star, Users,
  Sparkles, GitCompare, BookOpen, Bot, RotateCcw, ChevronDown,
  Calendar, Hexagon, UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useTranslation();

  const isActive = (href: string) => location === href;

  const primaryLinks = [
    { href: "/calculate", label: t.nav.calculateChart, icon: Compass },
    { href: "/encyclopedia", label: "Encyklopedie", icon: BookOpen },
    { href: "/ai-guide", label: "AI průvodce", icon: Bot },
  ];

  const toolsLinks = [
    { href: "/return-chart", label: "Return charty", icon: RotateCcw, desc: "Solární, Saturnův a další Return charty" },
    { href: "/compare", label: t.nav.compare, icon: GitCompare, desc: "Porovnání dvou Human Design map" },
    { href: "/transits", label: t.nav.transits, icon: Star, desc: "Aktuální planetární tranzity" },
    { href: "/transit-calendar", label: "Tranzitní kalendář", icon: Calendar, desc: "Denní a týdenní přehled tranzitů" },
    { href: "/variables", label: "Proměnné (PHS)", icon: UtensilsCrossed, desc: "Strávení, prostředí, perspektiva, vědomí" },
  ];

  const exploreLinks = [
    { href: "/celebrities", label: t.nav.celebrities, icon: Users, desc: "Mapy známých osobností" },
    { href: "/iching", label: t.nav.iChing, icon: Hexagon, desc: "I-Ťing orákulum" },
    { href: "/blog", label: "Blog", icon: BookOpen, desc: "Články o Human Design" },
  ];

  const allMobileLinks = [...primaryLinks, ...toolsLinks, ...exploreLinks];

  return (
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

        {/* Auth section */}
        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
          <div className="container py-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 py-1">Hlavní</p>
            {primaryLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}

            <div className="border-t border-border/50 my-2" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 py-1">Nástroje</p>
            {toolsLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}

            <div className="border-t border-border/50 my-2" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 py-1">Prozkoumat</p>
            {exploreLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}

            <div className="border-t border-border/50 my-2" />
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t.common.dashboard}
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t.common.signOut}
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="w-full bg-primary text-primary-foreground">
                  {t.common.signIn}
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
