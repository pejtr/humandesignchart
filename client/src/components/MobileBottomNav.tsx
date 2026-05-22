import { useLocation, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Map, BookOpen, Sparkles, User, Home } from "lucide-react";

/**
 * Fixed bottom navigation bar for mobile devices.
 * Shows key actions: Home, Chart, AI Guide, Blog, Profile.
 * Hidden on desktop (md: breakpoint).
 */
export function MobileBottomNav() {
  const [location] = useLocation();
  const { locale, localePath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const isCs = locale === "cs";

  const navItems = [
    {
      href: localePath("/"),
      icon: Home,
      label: isCs ? "Domů" : "Home",
    },
    {
      href: localePath("/calculate"),
      icon: Map,
      label: isCs ? "Mapa" : "Chart",
    },
    {
      href: localePath("/ai-guide"),
      icon: Sparkles,
      label: "AI Guide",
    },
    {
      href: localePath("/blog"),
      icon: BookOpen,
      label: "Blog",
    },
    {
      href: isAuthenticated ? localePath("/dashboard") : localePath("/calculate"),
      icon: User,
      label: isCs ? "Profil" : "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== localePath("/") && location.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <button className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-all">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-purple-500" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
