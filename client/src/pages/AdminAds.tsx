import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  BarChart3,
  MousePointerClick,
  Eye,
  Coins,
  Target,
} from "lucide-react";

const RANGES = [
  { value: "LAST_7_DAYS", label: "Posledních 7 dní" },
  { value: "LAST_14_DAYS", label: "Posledních 14 dní" },
  { value: "LAST_30_DAYS", label: "Posledních 30 dní" },
  { value: "THIS_MONTH", label: "Tento měsíc" },
  { value: "LAST_MONTH", label: "Minulý měsíc" },
] as const;
type Range = (typeof RANGES)[number]["value"];

const STATUS_COLORS: Record<string, string> = {
  ENABLED: "bg-green-100 text-green-700 border-green-200",
  PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REMOVED: "bg-gray-100 text-gray-500 border-gray-200",
};

const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pct = (v: number) =>
  `${(v * 100).toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} %`;

export default function AdminAds() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [range, setRange] = useState<Range>("LAST_30_DAYS");

  const isAdmin = isAuthenticated && user?.role === "admin";

  // Redirect non-admins away.
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [loading, isAdmin, navigate]);

  const statusQuery = trpc.ads.status.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  const configured = statusQuery.data?.configured ?? false;

  const reportQuery = trpc.ads.campaignReport.useQuery(
    { range },
    {
      enabled: isAdmin && configured,
      retry: false,
    }
  );

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-7xl py-8">
          <p className="text-muted-foreground">Načítání…</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totals = reportQuery.data?.totals;
  const rows = reportQuery.data?.rows ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Google Ads — výkon kampaní</h1>
              <p className="text-sm text-muted-foreground">
                Reporting (jen pro čtení) z propojeného Google Ads účtu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={v => setRange(v as Range)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => reportQuery.refetch()}
              disabled={reportQuery.isFetching || !configured}
              title="Obnovit"
            >
              <RefreshCw
                className={`h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Not configured */}
        {!statusQuery.isLoading && !configured && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                Google Ads není propojený
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 space-y-2">
              <p>
                Nastav v Railway tyto proměnné, pak se report načte automaticky:
              </p>
              <code className="block rounded bg-amber-100 p-3 text-xs leading-relaxed">
                GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID,
                GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN,
                GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_LOGIN_CUSTOMER_ID
              </code>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {configured && reportQuery.isError && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Chyba při načítání reportu
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-900">
              <code className="block whitespace-pre-wrap break-words rounded bg-red-100 p-3 text-xs">
                {reportQuery.error?.message}
              </code>
            </CardContent>
          </Card>
        )}

        {/* Totals */}
        {configured && totals && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard
              icon={<Eye className="h-4 w-4" />}
              label="Zobrazení"
              value={nf.format(totals.impressions)}
            />
            <SummaryCard
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Prokliky"
              value={nf.format(totals.clicks)}
            />
            <SummaryCard
              icon={<Coins className="h-4 w-4" />}
              label="Náklad"
              value={nf2.format(totals.cost)}
            />
            <SummaryCard
              icon={<Target className="h-4 w-4" />}
              label="Konverze"
              value={nf2.format(totals.conversions)}
            />
          </div>
        )}

        {/* Table */}
        {configured && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kampaň</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Zobrazení</TableHead>
                    <TableHead className="text-right">Prokliky</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Náklad</TableHead>
                    <TableHead className="text-right">Konverze</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportQuery.isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Načítání reportu…
                      </TableCell>
                    </TableRow>
                  )}
                  {!reportQuery.isLoading && rows.length === 0 && !reportQuery.isError && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Žádná data pro zvolené období.
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map(r => (
                    <TableRow key={r.campaignId}>
                      <TableCell className="font-medium">{r.campaignName}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-xs ${
                            STATUS_COLORS[r.status] ??
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{nf.format(r.impressions)}</TableCell>
                      <TableCell className="text-right">{nf.format(r.clicks)}</TableCell>
                      <TableCell className="text-right">{pct(r.ctr)}</TableCell>
                      <TableCell className="text-right">{nf2.format(r.cost)}</TableCell>
                      <TableCell className="text-right">{nf2.format(r.conversions)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
