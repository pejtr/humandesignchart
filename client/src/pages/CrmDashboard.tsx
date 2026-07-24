/**
 * CRM Dashboard — /crm-dashboard
 * Admin-only page: LeadOS leads enriched with Human Design data
 * Layout: Top Lead Profiles (left) | D3 Relationship Map (center) | Live SSE Stream (right)
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  select,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceSimulation,
  drag,
  type Selection,
  type BaseType,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowLeft, RefreshCw, Users, Zap, TrendingUp, Activity } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrichedLead {
  id: number;
  name: string;
  email: string;
  score?: number;
  status: string;
  source?: string;
  notes?: string;
  createdAt?: string;
  hdm: {
    registeredAt: Date;
    crmStatus: string | null;
    primaryHdType: string | null;
    chartCount: number;
    charts: Array<{
      name: string;
      hdType: string | null;
      roleTag: string | null;
      isFavorite: boolean;
    }>;
  } | null;
}

interface SseEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  qualified: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  converted: "bg-green-500/20 text-green-300 border-green-500/30",
  lost: "bg-red-500/20 text-red-300 border-red-500/30",
};

const HD_TYPE_COLORS: Record<string, string> = {
  Generator: "#6366f1",
  "Manifesting Generator": "#8b5cf6",
  MG: "#8b5cf6",
  Projector: "#06b6d4",
  Manifestor: "#f59e0b",
  Reflector: "#10b981",
};

const SSE_TYPE_ICONS: Record<string, string> = {
  crm_status: "🎯",
  campaign: "📧",
  system: "ℹ️",
  credit: "⭐",
  achievement: "🏆",
  lead_activity: "👤",
  automation: "⚡",
  default: "🔔",
};

// ─── Score Ring Component ─────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#6366f1" : "#6b7280";
  const label =
    score >= 80 ? "Hot" : score >= 60 ? "Warm" : score >= 40 ? "Cool" : "Cold";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="relative flex items-center justify-center w-12 h-12 rounded-full border-2"
        style={{ borderColor: color }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-[10px]" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  selected,
  onClick,
}: {
  lead: EnrichedLead;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hdType = lead.hdm?.primaryHdType ?? null;
  const hdColor = hdType ? (HD_TYPE_COLORS[hdType] ?? "#6366f1") : "#4b5563";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:border-purple-500/50 ${selected
          ? "border-purple-500 bg-purple-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/8"
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border"
          style={{ backgroundColor: hdColor + "33", borderColor: hdColor + "66", color: hdColor }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-white truncate">{lead.name}</span>
            {lead.hdm && (
              <span className="text-[10px] text-purple-400 shrink-0">
                {lead.hdm.chartCount} map
              </span>
            )}
          </div>
          {hdType && (
            <div className="text-xs mb-1" style={{ color: hdColor }}>
              {hdType}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[lead.status] ?? "bg-gray-500/20 text-gray-300"
                }`}
            >
              {lead.status}
            </span>
            {lead.hdm?.crmStatus && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                {lead.hdm.crmStatus}
              </span>
            )}
            {lead.source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-white/5 text-gray-400 border-white/10">
                {lead.source}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <ScoreRing score={lead.score ?? 0} />
      </div>

      {/* Charts list */}
      {lead.hdm?.charts && lead.hdm.charts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.hdm.charts.slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
            >
              {c.name} {c.roleTag ? `(${c.roleTag})` : ""}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── D3 Relationship Map ──────────────────────────────────────────────────────

interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  hdType: string | null;
  score: number;
  status: string;
  isCenter?: boolean;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  label: string;
}

function RelationshipMap({
  leads,
  selectedId,
  onSelect,
}: {
  leads: EnrichedLead[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || leads.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Clear previous
    select(svgRef.current).selectAll("*").remove();

    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Defs: glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Build nodes: top 8 leads by score
    const topLeads = [...leads]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 8);

    const nodes: GraphNode[] = topLeads.map((l) => ({
      id: String(l.id),
      name: l.name.split(" ")[0],
      hdType: l.hdm?.primaryHdType ?? null,
      score: l.score ?? 0,
      status: l.status,
    }));

    // Build links: connect nodes with similar HD type or status
    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = topLeads[i];
        const b = topLeads[j];
        const sameHd = a.hdm?.primaryHdType && a.hdm.primaryHdType === b.hdm?.primaryHdType;
        const sameStatus = a.status === b.status;
        if (sameHd || sameStatus) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: sameHd ? 0.8 : 0.4,
            label: sameHd ? "Strong" : "Neutral",
          });
        }
      }
    }

    // Force simulation
    const simulation = forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80)
          .strength((d) => d.strength * 0.3)
      )
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide(36));

    // Links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (d.strength > 0.6 ? "#6366f1" : "#374151"))
      .attr("stroke-width", (d) => (d.strength > 0.6 ? 1.5 : 0.8))
      .attr("stroke-dasharray", (d) => (d.strength > 0.6 ? "none" : "4 3"))
      .attr("opacity", 0.6);

    // Node groups
    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as unknown as (selection: Selection<BaseType, GraphNode, SVGGElement, unknown>) => void
      )
      .on("click", (_, d) => {
        const lead = topLeads.find((l) => String(l.id) === d.id);
        if (lead) onSelect(lead.id);
      });

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => 16 + (d.score / 100) * 8)
      .attr("fill", (d) => {
        const color = d.hdType ? (HD_TYPE_COLORS[d.hdType] ?? "#6366f1") : "#4b5563";
        return color + "33";
      })
      .attr("stroke", (d) => {
        const color = d.hdType ? (HD_TYPE_COLORS[d.hdType] ?? "#6366f1") : "#4b5563";
        return color;
      })
      .attr("stroke-width", (d) => (selectedId && String(selectedId) === d.id ? 3 : 1.5))
      .attr("filter", "url(#glow)");

    // Node labels
    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#e5e7eb")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("pointer-events", "none");

    // HD type sub-label
    node
      .append("text")
      .text((d) => {
        if (!d.hdType) return "";
        const parts = d.hdType.split(" ");
        return parts.length > 1 ? parts.map((p) => p[0]).join("") : d.hdType.slice(0, 2);
      })
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .attr("fill", (d) => d.hdType ? (HD_TYPE_COLORS[d.hdType] ?? "#6366f1") : "#6b7280")
      .attr("font-size", "8px")
      .attr("pointer-events", "none");

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [leads, selectedId, onSelect]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

// ─── SSE Stream Panel ─────────────────────────────────────────────────────────

function SseStreamPanel() {
  const [events, setEvents] = useState<SseEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
      setTimeout(connect, 5000);
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "heartbeat") return;
        setEvents((prev) => [
          {
            id: String(Date.now()),
            type: data.type ?? "default",
            title: data.title ?? "Notifikace",
            message: data.message ?? "",
            time: new Date().toLocaleTimeString("cs-CZ", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev.slice(0, 49),
        ]);
      } catch {
        // ignore parse errors
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);

  // Seed with some demo events if empty
  const displayEvents =
    events.length > 0
      ? events
      : [
        {
          id: "demo1",
          type: "lead_activity",
          title: "Čekám na LeadOS data",
          message: "Připojuji se k SSE streamu...",
          time: new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
        },
      ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Live SSE Stream</h3>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
          />
          <span className={`text-xs ${connected ? "text-green-400" : "text-red-400"}`}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {displayEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/8 transition-colors"
            >
              <span className="text-base shrink-0 mt-0.5">
                {SSE_TYPE_ICONS[ev.type] ?? SSE_TYPE_ICONS.default}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white truncate">{ev.title}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{ev.time}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{ev.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Stats Header ─────────────────────────────────────────────────────────────

interface CrmStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  activeSequences: number;
  totalSequences: number;
}

function StatsHeader({ stats }: { stats: CrmStats | undefined }) {
  const items = [
    {
      label: "Total Leads",
      value: stats?.totalLeads ?? "—",
      icon: <Users className="w-4 h-4" />,
      sub: `+${stats?.newLeads ?? 0} nových`,
    },
    {
      label: "Active Sequences",
      value: stats?.activeSequences ?? "—",
      icon: <Zap className="w-4 h-4" />,
      sub: `z ${stats?.totalSequences ?? 0} celkem`,
    },
    {
      label: "Converted",
      value: stats?.convertedLeads ?? "—",
      icon: <TrendingUp className="w-4 h-4" />,
      sub: `${((stats?.conversionRate ?? 0) * 100).toFixed(1)}% rate`,
    },
    {
      label: "SSE Stream",
      value: "Live",
      icon: <Activity className="w-4 h-4" />,
      sub: "real-time",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="bg-white/5 border-white/10 text-white"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{item.label}</span>
              <span className={item.highlight ? "text-green-400" : "text-purple-400"}>
                {item.icon}
              </span>
            </div>
            <div
              className={`text-xl font-bold ${item.highlight ? "text-green-400" : "text-white"}`}
            >
              {item.value}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{item.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CrmDashboard() {
  const { user } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: leadsData, isLoading: leadsLoading, refetch } = trpc.leados.getEnrichedLeads.useQuery(
    { limit: 30, status: statusFilter as "new" | "contacted" | "qualified" | "converted" | "lost" | undefined },
    { refetchInterval: 60_000 }
  );

  const { data: stats, isLoading: statsLoading } = trpc.leados.getCrmStats.useQuery(
    undefined,
    { refetchInterval: 120_000 }
  );

  // Admin guard
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-gray-400">Přihlaste se pro přístup k CRM dashboardu.</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Přístup odepřen — pouze pro administrátory.</p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Zpět na Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const leads = (leadsData && !Array.isArray(leadsData) && "leads" in leadsData ? leadsData.leads : Array.isArray(leadsData) ? leadsData : []) as EnrichedLead[];
  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div>
            <h1 className="text-sm font-semibold text-white">
              Human Design Mapa
            </h1>
            <p className="text-[11px] text-purple-400">Psychographic CRM Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex gap-1">
            {[undefined, "new", "qualified", "converted"].map((s) => (
              <button
                key={s ?? "all"}
                onClick={() => setStatusFilter(s)}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${statusFilter === s
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-white/10 text-gray-400 hover:border-white/30"
                  }`}
              >
                {s ?? "Vše"}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 bg-white/5" />
            ))}
          </div>
        ) : (
          <StatsHeader stats={stats} />
        )}

        {/* 3-panel layout */}
        <div className="flex-1 grid grid-cols-[300px_1fr_280px] gap-4 min-h-0">
          {/* LEFT: Top Lead Profiles */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Top Lead Profiles</h2>
              <span className="text-xs text-gray-500">{leads.length} leadů</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-2">
                {leadsLoading
                  ? [...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 bg-white/5 rounded-lg" />
                  ))
                  : leads.length === 0
                    ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        <p>Žádné leady nenalezeny.</p>
                        <p className="text-xs mt-1">Zkontrolujte LEADOS_API_KEY.</p>
                      </div>
                    )
                    : leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        selected={selectedLeadId === lead.id}
                        onClick={() =>
                          setSelectedLeadId(
                            selectedLeadId === lead.id ? null : lead.id
                          )
                        }
                      />
                    ))}
              </div>
            </ScrollArea>
          </div>

          {/* CENTER: Relationship Map */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Relationship Map</h2>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-4 border-t border-indigo-500" />
                  Strong
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 border-t border-dashed border-gray-600" />
                  Neutral
                </span>
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-white/10 bg-white/3 overflow-hidden">
              {leadsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-48 h-48 rounded-full bg-white/5" />
                </div>
              ) : leads.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  Načítám data z LeadOS...
                </div>
              ) : (
                <RelationshipMap
                  leads={leads}
                  selectedId={selectedLeadId}
                  onSelect={setSelectedLeadId}
                />
              )}
            </div>

            {/* Selected lead detail */}
            {selectedLead && (
              <div className="mt-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{selectedLead.name}</span>
                  <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Score {selectedLead.score ?? 0}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{selectedLead.email}</p>
                {selectedLead.hdm?.primaryHdType && (
                  <p className="text-xs mt-1" style={{ color: HD_TYPE_COLORS[selectedLead.hdm.primaryHdType] ?? "#6366f1" }}>
                    HD Typ: {selectedLead.hdm.primaryHdType}
                  </p>
                )}
                {selectedLead.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{selectedLead.notes}</p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Live SSE Stream */}
          <div className="flex flex-col min-h-0 rounded-xl border border-white/10 bg-white/3 p-3">
            <SseStreamPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
