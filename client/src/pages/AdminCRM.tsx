import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Users, TrendingUp, ShoppingCart, Mail, RefreshCw,
  AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, Filter, Send, ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  qualified: "bg-purple-100 text-purple-700 border-purple-200",
  converted: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nový",
  contacted: "Kontaktován",
  qualified: "Kvalifikovaný",
  converted: "Konvertovaný",
  lost: "Ztracený",
};

export default function AdminCRM() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { locale } = useLanguage();

  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "orders" | "email">("overview");
  const [leadsPage, setLeadsPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      navigate("/");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const analyticsQuery = trpc.leados.getAnalytics.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "overview",
    retry: false,
  });

  const leadsQuery = trpc.leados.getLeads.useQuery(
    { status: statusFilter, limit: 20, offset: leadsPage * 20 },
    {
      enabled: isAuthenticated && user?.role === "admin" && activeTab === "leads",
      retry: false,
    }
  );

  const ordersQuery = trpc.leados.getOrders.useQuery(
    { limit: 20, offset: 0 },
    {
      enabled: isAuthenticated && user?.role === "admin" && activeTab === "orders",
      retry: false,
    }
  );

  const sequencesQuery = trpc.leados.getEmailSequences.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "email",
    retry: false,
  });

  const updateLeadMutation = trpc.leados.updateLead.useMutation({
    onSuccess: () => {
      toast.success("Lead aktualizován");
      leadsQuery.refetch();
    },
    onError: (err) => toast.error(`Chyba: ${err.message}`),
  });

  const sendEmailMutation = trpc.leados.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email odeslán přes LeadOS");
      setEmailTo("");
      setEmailSubject("");
      setEmailHtml("");
    },
    onError: (err) => toast.error(`Chyba: ${err.message}`),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const analytics = analyticsQuery.data;
  const leads = leadsQuery.data;
  const orders = ordersQuery.data;
  const sequences = sequencesQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-7xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              LeadOS CRM
            </h1>
            <p className="text-muted-foreground mt-1">
              Správa leadů, objednávek a emailových kampaní
            </p>
          </div>
          <a
            href="https://ai-lead-gen.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Otevřít LeadOS Dashboard
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(["overview", "leads", "orders", "email"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" && "Přehled"}
              {tab === "leads" && "Leads"}
              {tab === "orders" && "Objednávky"}
              {tab === "email" && "Email"}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div>
            {analyticsQuery.isLoading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mr-2" />
                <span className="text-muted-foreground">Načítám statistiky z LeadOS...</span>
              </div>
            )}
            {analyticsQuery.error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Nelze načíst data z LeadOS</p>
                  <p className="text-sm mt-1">{analyticsQuery.error.message}</p>
                  <p className="text-sm mt-1 text-red-600">
                    Zkontroluj API klíč v{" "}
                    <a href="https://ai-lead-gen.com" target="_blank" rel="noopener noreferrer" className="underline">
                      LeadOS Dashboard → Admin → Integrace & API
                    </a>
                  </p>
                </div>
              </div>
            )}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Celkem leads"
                  value={analytics.totalLeads ?? 0}
                  icon={<Users className="w-5 h-5" />}
                  color="purple"
                />
                <StatCard
                  title="Nové leads"
                  value={analytics.newLeads ?? 0}
                  icon={<ArrowUpRight className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Konvertované"
                  value={analytics.convertedLeads ?? 0}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Konverzní poměr"
                  value={`${((analytics.conversionRate ?? 0) * 100).toFixed(1)}%`}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="amber"
                />
                {analytics.totalRevenue !== undefined && (
                  <StatCard
                    title="Celkové tržby"
                    value={`${analytics.totalRevenue.toLocaleString("cs-CZ")} Kč`}
                    icon={<ShoppingCart className="w-5 h-5" />}
                    color="emerald"
                  />
                )}
                {analytics.totalOrders !== undefined && (
                  <StatCard
                    title="Objednávky"
                    value={analytics.totalOrders}
                    icon={<ShoppingCart className="w-5 h-5" />}
                    color="orange"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Leads Tab ── */}
        {activeTab === "leads" && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => { setStatusFilter(undefined); setLeadsPage(0); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !statusFilter ? "bg-purple-100 text-purple-700" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Všechny
              </button>
              {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setLeadsPage(0); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === s ? "bg-purple-100 text-purple-700" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {leadsQuery.isLoading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mr-2" />
                <span className="text-muted-foreground">Načítám leads...</span>
              </div>
            )}
            {leadsQuery.error && (
              <LeadOSError message={leadsQuery.error.message} />
            )}
            {leads && (
              <>
                <div className="text-sm text-muted-foreground mb-3">
                  Celkem: {leads.total} leads
                </div>
                <div className="space-y-3">
                  {leads.leads.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Žádné leads nenalezeny
                    </div>
                  )}
                  {leads.leads.map((lead) => (
                    <Card key={lead.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground truncate">
                                {lead.name || "Neznámý"}
                              </span>
                              {lead.company && (
                                <span className="text-muted-foreground text-sm">— {lead.company}</span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{lead.email}</div>
                            {lead.score !== undefined && (
                              <div className="text-xs text-purple-600 mt-1">Skóre: {lead.score}/100</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={STATUS_COLORS[lead.status as LeadStatus] || ""}>
                              {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                            </Badge>
                            <select
                              className="text-xs border border-border rounded px-2 py-1 bg-background"
                              value={lead.status}
                              onChange={(e) =>
                                updateLeadMutation.mutate({
                                  id: lead.id,
                                  status: e.target.value as LeadStatus,
                                })
                              }
                            >
                              {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadsPage((p) => Math.max(0, p - 1))}
                    disabled={leadsPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Předchozí
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Strana {leadsPage + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadsPage((p) => p + 1)}
                    disabled={leads.leads.length < 20}
                  >
                    Další <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {activeTab === "orders" && (
          <div>
            {ordersQuery.isLoading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mr-2" />
                <span className="text-muted-foreground">Načítám objednávky...</span>
              </div>
            )}
            {ordersQuery.error && <LeadOSError message={ordersQuery.error.message} />}
            {orders && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-3">
                  Celkem: {orders.total} objednávek
                </div>
                {orders.orders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Žádné objednávky nenalezeny
                  </div>
                )}
                {orders.orders.map((order) => (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{order.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            {order.amount.toLocaleString("cs-CZ")} {order.currency?.toUpperCase()}
                          </div>
                          <Badge
                            className={
                              order.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Email Tab ── */}
        {activeTab === "email" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Send email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-500" />
                  Odeslat email přes LeadOS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Příjemce</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="jan.novak@firma.cz"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Předmět</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Personalizovaný výklad Human Design"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">HTML obsah</label>
                  <textarea
                    value={emailHtml}
                    onChange={(e) => setEmailHtml(e.target.value)}
                    rows={6}
                    placeholder="<p>Ahoj, tvůj Human Design výklad je připraven...</p>"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() =>
                    sendEmailMutation.mutate({ to: emailTo, subject: emailSubject, html: emailHtml })
                  }
                  disabled={!emailTo || !emailSubject || !emailHtml || sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Odeslat email
                </Button>
              </CardContent>
            </Card>

            {/* Email sequences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-500" />
                  Email sekvence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sequencesQuery.isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                )}
                {sequencesQuery.error && <LeadOSError message={sequencesQuery.error.message} />}
                {sequences && (
                  <div className="space-y-3">
                    {sequences.sequences.length === 0 && (
                      <p className="text-muted-foreground text-sm">Žádné sekvence nenalezeny</p>
                    )}
                    {sequences.sequences.map((seq) => (
                      <div
                        key={seq.id}
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-sm text-foreground">{seq.name}</div>
                          {seq.steps !== undefined && (
                            <div className="text-xs text-muted-foreground">{seq.steps} kroků</div>
                          )}
                        </div>
                        <Badge
                          className={
                            seq.status === "active"
                              ? "bg-green-100 text-green-700"
                              : seq.status === "paused"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {seq.status === "active" ? "Aktivní" : seq.status === "paused" ? "Pozastavená" : "Koncept"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "purple" | "blue" | "green" | "amber" | "emerald" | "orange";
}) {
  const colorMap = {
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };
  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className={colorMap[color]}>{icon}</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function LeadOSError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Chyba při komunikaci s LeadOS</p>
        <p className="text-sm mt-1">{message}</p>
        <p className="text-sm mt-2">
          Zkontroluj API klíč v{" "}
          <a
            href="https://ai-lead-gen.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            LeadOS Dashboard → Admin → Integrace & API → API Keys
          </a>
        </p>
      </div>
    </div>
  );
}
