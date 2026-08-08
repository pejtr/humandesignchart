import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, FileText, Download, Crown, Gift, Settings, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function CustomerPortal() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const { user } = useAuth();

  const [invoices] = useState([
    { id: "2026-4019", date: "2026-08-07", amount: "390 Kč", item: "Kompletní HD Blueprint + AI Marie" },
    { id: "2026-3812", date: "2026-07-28", amount: "99 Kč", item: "10-Minutový Audio Výklad z Marie" },
  ]);

  const handleDownloadInvoice = (id: string) => {
    toast.success(
      isEn
        ? `Downloading Fakturoid PDF Invoice #${id}...`
        : `Stahování daňového dokladu / faktury z Fakturoidu #${id}...`
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              {isEn ? "Customer Self-Service Portal" : "Zákaznický Portál Správy Účtu a Faktur"}
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              {isEn ? `Welcome, ${user?.name || "Customer"}` : `Vítejte v portálu, ${user?.name || "Zákazníku"}`}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email || "prihlaseny-uzivatel@email.cz"}</p>
          </div>

          <Button
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl px-4 h-9 gap-1.5 shrink-0"
            asChild
          >
            <Link href={localePath("/pricing") + "#vip"}>
              <Crown className="w-4 h-4" />
              {isEn ? "VIP Club Member" : "Spravovat VIP Členství"}
            </Link>
          </Button>
        </div>

        {/* Fakturoid PDF Invoices Download Card */}
        <Card className="border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                {isEn ? "Fakturoid Tax Invoices & Receipts" : "Moje Faktury & Daňové Doklady (Fakturoid)"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEn ? "Download PDF invoices for all your purchases." : "Stáhněte si PDF daňové doklady pro vaše nákupy."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {invoices.map((inv, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-foreground">{inv.item}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Faktura #{inv.id} · {inv.date}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{inv.amount}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadInvoice(inv.id)}
                    className="h-8 text-[11px] gap-1 rounded-xl"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Purchased Assets Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-border rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {isEn ? "Purchased HD Blueprints" : "Zakoupené Osobní Blueprinty"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn ? "Access all your generated family blueprints anytime." : "Přistupujte ke všem vygenerovaným rodinným rozborům kdykoliv."}
            </p>
            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 rounded-xl" asChild>
              <Link href={localePath("/dashboard")}>
                {isEn ? "Go to My Dashboard" : "Přejít do Klientského Dashboardu"}
              </Link>
            </Button>
          </Card>

          <Card className="border border-border rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Gift className="w-4 h-4 text-emerald-500" />
              {isEn ? "Gift Vouchers & Promos" : "Dárkové Poukazy & Slevové Kódy"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn ? "Redeem or generate gift reading vouchers." : "Uplatněte nebo vytvořte dárkový poukaz na výklad pro své blízké."}
            </p>
            <Button size="sm" variant="outline" className="w-full text-xs h-9 rounded-xl" asChild>
              <Link href={localePath("/pricing")}>
                {isEn ? "Redeem Voucher" : "Uplatnit Dárkový Poukaz"}
              </Link>
            </Button>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
