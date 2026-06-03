import { Link } from "wouter";
import {
  Orbit,
  Eye,
  Sun,
  Star,
  GitCompare,
  LayoutDashboard,
  BookOpen,
  Hexagon,
  Target,
  Layers,
  RotateCcw,
  Flame,
  Gem,
  Share2,
  Users,
  Calendar,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarItem {
  href: string;
  labelCs: string;
  labelEn: string;
  icon: React.ElementType;
  group?: string;
  badge?: boolean; // show notification dot
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Core
  { href: "/dashboard",        labelCs: "Dashboard",          labelEn: "Dashboard",       icon: LayoutDashboard, group: "core" },
  { href: "/calculate",        labelCs: "Tvoje mapa",          labelEn: "Your Chart",      icon: Orbit,           group: "core" },
  { href: "/ai-guide",         labelCs: "HD Guru",             labelEn: "HD Guru",         icon: Eye,             group: "core",  badge: true },
  // Transits & Time
  { href: "/daily-transit",    labelCs: "Denní tranzit",       labelEn: "Daily Transit",   icon: Sun,             group: "time",  badge: true },
  { href: "/transits",         labelCs: "Tranzity",            labelEn: "Transits",        icon: Star,            group: "time" },
  { href: "/transit-calendar", labelCs: "Tranzitní kalendář",  labelEn: "Transit Calendar",icon: Calendar,        group: "time" },
  { href: "/return-chart",     labelCs: "Return charty",       labelEn: "Return Charts",   icon: RotateCcw,       group: "time" },
  // Analysis
  { href: "/compare",          labelCs: "Srovnání",            labelEn: "Compare",         icon: GitCompare,      group: "analysis" },
  { href: "/variables",        labelCs: "Proměnné (PHS)",      labelEn: "Variables (PHS)", icon: Gem,             group: "analysis" },
  { href: "/incarnation-cross",labelCs: "Inkarnační kříž",     labelEn: "Incarnation Cross",icon: Target,         group: "analysis" },
  // Explore
  { href: "/encyclopedia",     labelCs: "Encyklopedie",        labelEn: "Encyclopedia",    icon: Layers,          group: "explore" },
  { href: "/iching",           labelCs: "I-Ťing",              labelEn: "I Ching",         icon: Hexagon,         group: "explore" },
  { href: "/celebrities",      labelCs: "Celebrity",           labelEn: "Celebrities",     icon: Users,           group: "explore" },
  { href: "/blog",             labelCs: "Blog",                labelEn: "Blog",            icon: BookOpen,        group: "explore" },
  // Tools
  { href: "/social-scheduler", labelCs: "Plánovač sítí",       labelEn: "Social Scheduler",icon: Share2,          group: "tools" },
];

const GROUP_DIVIDERS: Record<string, boolean> = {
  time: true,
  analysis: true,
  explore: true,
  tools: true,
};

export function AuthSidebar() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { locale } = useLanguage();

  if (!isAuthenticated) return null;

  const localePath = (path: string) => `/${locale}${path}`;

  const isActive = (href: string) => {
    const full = localePath(href);
    return location === full || location.startsWith(full + "/");
  };

  let lastGroup = "";

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col items-center py-3 gap-1"
      style={{
        width: "56px",
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: "2px 0 12px 0 oklch(0.55 0.22 300 / 0.06)",
      }}
    >
      {/* Logo dot */}
      <Link href={localePath("/")} className="mb-2 mt-1 flex items-center justify-center w-9 h-9 rounded-xl no-underline"
        style={{ background: "var(--primary)", boxShadow: "0 2px 8px oklch(0.55 0.22 300 / 0.35)" }}
      >
        <span className="text-white font-bold text-sm select-none">HD</span>
      </Link>

      <div className="flex flex-col items-center gap-0.5 w-full px-1.5 flex-1 overflow-y-auto scrollbar-none">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = locale === "cs" ? item.labelCs : item.labelEn;
          const showDivider = item.group && item.group !== lastGroup && GROUP_DIVIDERS[item.group];
          if (item.group) lastGroup = item.group;

          return (
            <div key={item.href} className="w-full">
              {showDivider && (
                <div className="mx-2 my-1.5 h-px" style={{ background: "var(--sidebar-border)" }} />
              )}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    href={localePath(item.href)}
                    className="relative flex items-center justify-center w-full h-9 rounded-lg transition-all duration-150 no-underline group"
                    style={
                      active
                        ? {
                            background: "var(--sidebar-accent)",
                            color: "var(--sidebar-primary)",
                          }
                        : {
                            color: "var(--sidebar-foreground)",
                          }
                    }
                  >
              <Icon
                  className="transition-transform duration-150 group-hover:scale-110"
                  style={{
                    width: "18px",
                    height: "18px",
                    opacity: active ? 1 : 0.65,
                    color: active ? "var(--sidebar-primary)" : "inherit",
                  }}
                />
                {/* Notification badge dot */}
                {item.badge && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full border-2"
                    style={{
                      background: "oklch(0.72 0.22 25)",
                      borderColor: "var(--sidebar)",
                      animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                    }}
                  />
                )}
                {/* Active indicator dot */}
                {active && (
                  <span
                    className="absolute left-0 w-0.5 h-5 rounded-r-full"
                    style={{ background: "var(--sidebar-primary)" }}
                  />
                )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <span className="text-xs font-medium">{label}</span>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
