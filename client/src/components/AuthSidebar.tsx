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
  Gem,
  Share2,
  Users,
  Calendar,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

interface SidebarItem {
  href: string;
  labelCs: string;
  labelEn: string;
  icon: React.ElementType;
  group?: string;
  badge?: boolean;
  adminOnly?: boolean;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Core
  { href: "/dashboard",        labelCs: "Dashboard",          labelEn: "Dashboard",       icon: LayoutDashboard, group: "core" },
  { href: "/calculate",        labelCs: "Generovat mapu",      labelEn: "Generate Chart", icon: Orbit,           group: "core" },
  { href: "/ai-guide",         labelCs: "HD Guru",             labelEn: "HD Guru",         icon: Eye,             group: "core",  badge: true },
  { href: "/blog",             labelCs: "Blog",                labelEn: "Blog",            icon: BookOpen,        group: "core" },
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
  // Tools
  { href: "/social-scheduler", labelCs: "Plánovač sítí",       labelEn: "Social Scheduler",icon: Share2,          group: "tools",  adminOnly: true },
];

const GROUP_DIVIDERS: Record<string, boolean> = {
  time: true,
  analysis: true,
  explore: true,
  tools: true,
};

const STORAGE_KEY = "hd-sidebar-expanded";

export function AuthSidebar() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const { locale } = useLanguage();
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(expanded));
    } catch {}
    // Update CSS variable so main content shifts accordingly
    document.documentElement.style.setProperty("--sidebar-w", expanded ? "200px" : "56px");
  }, [expanded]);

  // Set initial value on mount
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", expanded ? "200px" : "56px");
  }, []);

  if (!isAuthenticated) return null;

  const isAdmin = (user as any)?.role === "admin";
  const localePath = (path: string) => `/${locale}${path}`;

  const isActive = (href: string) => {
    const full = localePath(href);
    return location === full || location.startsWith(full + "/");
  };

  const sidebarWidth = expanded ? "200px" : "56px";

  let lastGroup = "";

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-16 z-40 flex-col py-3 gap-1 transition-all duration-200"
      style={{
        height: "calc(100vh - 4rem)",
        width: sidebarWidth,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: "2px 0 12px 0 oklch(0.55 0.22 300 / 0.06)",
        overflow: "hidden",
      }}
    >
      {/* Scrollable nav items */}
      <div className="flex flex-col gap-0.5 w-full px-1.5 flex-1 overflow-y-auto scrollbar-none">
        {SIDEBAR_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = locale === "cs" ? item.labelCs : item.labelEn;
          const showDivider = item.group && item.group !== lastGroup && GROUP_DIVIDERS[item.group];
          if (item.group) lastGroup = item.group;

          const linkContent = (
            <Link
              href={localePath(item.href)}
              className="relative flex items-center gap-2.5 w-full h-9 rounded-lg transition-all duration-150 no-underline group px-2"
              style={
                active
                  ? { background: "var(--sidebar-accent)", color: "var(--sidebar-primary)" }
                  : { color: "var(--sidebar-foreground)" }
              }
            >
              <Icon
                className="transition-transform duration-150 group-hover:scale-110 shrink-0"
                style={{
                  width: "18px",
                  height: "18px",
                  opacity: active ? 1 : 0.65,
                  color: active ? "var(--sidebar-primary)" : "inherit",
                }}
              />
              {expanded && (
                <span
                  className="text-xs font-medium truncate"
                  style={{
                    opacity: active ? 1 : 0.75,
                    color: active ? "var(--sidebar-primary)" : "var(--sidebar-foreground)",
                  }}
                >
                  {label}
                </span>
              )}
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
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 w-0.5 h-5 rounded-r-full"
                  style={{ background: "var(--sidebar-primary)" }}
                />
              )}
            </Link>
          );

          return (
            <div key={item.href} className="w-full">
              {showDivider && (
                <div className="mx-2 my-1.5 h-px" style={{ background: "var(--sidebar-border)" }} />
              )}
              {expanded ? (
                linkContent
              ) : (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <span className="text-xs font-medium">{label}</span>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>

      {/* Toggle expand/collapse button at bottom */}
      <div className="px-1.5 pt-1 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2.5 w-full h-9 rounded-lg px-2 transition-all duration-150 hover:bg-sidebar-accent/60 group"
          style={{ color: "var(--sidebar-foreground)" }}
          title={expanded ? (locale === "cs" ? "Sbalit menu" : "Collapse menu") : (locale === "cs" ? "Rozbalit menu" : "Expand menu")}
        >
          {expanded ? (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                {locale === "cs" ? "Sbalit" : "Collapse"}
              </span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity mx-auto" />
          )}
        </button>
      </div>
    </aside>
  );
}
