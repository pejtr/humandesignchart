import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Copy, Mail, Sparkles, Sun, Moon } from "lucide-react";

export type DailyAgentView = {
  date: string; timestamp: string; timezone: string; locale: "cs" | "en";
  transitGates: { planet: string; gate: number; line: number; longitude: number }[];
  themes: { planet: string; gate: number; line: number; theme?: string }[];
  interpretation: string; reflection: string; disclaimer: string;
};
const endpoint = "/api/daily-agent/email/preferences";

export default function DailyAgentPage({ daily }: { daily: DailyAgentView }) {
  const { locale, localePath } = useLanguage();
  const en = locale === "en";
  const { isAuthenticated, loading } = useAuth();
  const [prefs, setPrefs] = useState<{available: boolean; enabled: boolean; locale?: string} | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const base = en ? "https://humandesignchart.app" : "https://humandesignmapa.cz";
  const mcp = base + "/mcp";
  useEffect(() => {
    let active = true;
    setPrefs(null);
    setConsent(false);
    if (isAuthenticated) {
      fetch(endpoint, { credentials: "same-origin", cache: "no-store" })
        .then(async res => {
          if (!res.ok) throw new Error("Unavailable");
          const value = await res.json();
          if (active) setPrefs(value);
        })
        .catch(() => { if (active) setPrefs({available: false, enabled: false}); });
    }
    return () => { active = false; };
  }, [isAuthenticated]);
  async function save(enabled: boolean) {
    setBusy(true); setNotice("");
    try {
      const res = await fetch(endpoint, {
        method: "POST", credentials: "same-origin", headers: {"content-type": "application/json"},
        body: JSON.stringify({enabled, locale: en ? "en" : "cs", consent: enabled && consent}),
      });
      if (!res.ok) throw new Error("Save failed");
      const value = await res.json();
      setPrefs(p => ({available: p?.available ?? false, enabled: value.enabled, locale: value.locale}));
      setConsent(false);
      setNotice(enabled ? (en ? "Daily email preference saved." : "Denní odběr uložen.") :
        (en ? "Daily email disabled." : "Denní e-maily vypnuty."));
    } catch { setNotice(en ? "Could not save. Please try again." : "Nastavení se nepodařilo uložit. Zkuste to znovu."); }
    finally { setBusy(false); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopyNotice(en ? "Copied." : "Zkopírováno."); }
    catch { setCopyNotice(en ? "Copy the address or prompt manually." : "Zkopírujte adresu nebo pokyn ručně."); }
  }
  const prompt = en
    ? "Use Human Design Daily MCP at " + mcp + ". Retrieve get_daily_chart and get_daily_reading in English. Explain the symbolic themes and offer a short reflection. If this client supports recurring tasks, schedule this only with my approval."
    : "Použij Human Design Daily MCP na " + mcp + ". Načti get_daily_chart a get_daily_reading v češtině. Vysvětli symbolická témata a nabídni krátkou reflexi. Pokud klient podporuje opakované úlohy, naplánuj je pouze s mým souhlasem.";
  function copyPersonalPrompt() {
    try {
      const chart = JSON.parse(sessionStorage.getItem("chartResult") || "null");
      const gates = chart?.activatedGates;
      if (!Array.isArray(gates) || !gates.length || gates.length > 64 ||
        gates.some(g => !Number.isInteger(g) || g < 1 || g > 64)) throw new Error("No chart");
      // Copy only on explicit user action. No network request or birth data.
      void copy(prompt + "\n" + (en ? "I choose to share these natal gate numbers: " : "Souhlasím se sdílením těchto nativních bran: ") + Array.from(new Set(gates)).join(", "));
    } catch { setCopyNotice(en ? "Calculate your own chart first." : "Nejdříve vypočítejte svou mapu."); }
  }
  return <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-16 sm:px-8">
      <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-6 sm:p-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> HUMAN DESIGN DAILY</p>
        <h1 className="mt-4 font-serif text-3xl font-bold sm:text-5xl">{en ? "Your daily transit chart" : "Vaše dnešní tranzitová mapa"}</h1>
        <p className="mt-3 text-muted-foreground">{daily.date} · {daily.timezone} · {en ? "Daily snapshot at midnight" : "Denní snímek o půlnoci"}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{daily.themes.map(t => <article key={t.planet} className="rounded-2xl border bg-background/80 p-4">
          {t.planet === "Moon" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
          <p className="mt-3 text-sm text-muted-foreground">{t.planet} · {t.gate}.{t.line}</p>
          <p className="mt-1 font-semibold">{t.theme}</p>
        </article>)}</div>
        <p className="mt-5">{daily.reflection}</p>
        <p className="mt-3 text-xs text-muted-foreground">{daily.disclaimer}</p>
      </header>
      <section className="rounded-3xl border p-6">
        <h2 className="font-serif text-2xl font-semibold">{en ? "Planetary transits" : "Planetární tranzity"}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{daily.transitGates.map(t => <div key={t.planet} className="rounded-lg border px-3 py-2 text-sm"><span>{t.planet}</span><span className="float-right font-semibold">{t.gate}.{t.line}</span></div>)}</div>
      </section>
      <section className="space-y-4 rounded-3xl border p-6">
        <h2 className="font-serif text-2xl font-semibold">{en ? "Connect your AI assistant" : "Připojte svého AI asistenta"}</h2>
        <p className="text-sm text-muted-foreground">{en ? "Use the remote MCP address in a compatible ChatGPT, Claude, Gemini or Atomic Chat client. Daily scheduling requires a supported task feature; connecting does not schedule messages automatically." : "Použijte vzdálenou MCP adresu v kompatibilním klientovi ChatGPT, Claude, Gemini nebo Atomic Chat. Denní doručování vyžaduje podporu plánovaných úloh; samotné připojení zprávy nenaplánuje."}</p>
        <div className="break-all rounded-xl bg-muted p-3 font-mono text-sm">{mcp}</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => copy(mcp)}><Copy className="mr-2 h-4 w-4" />{en ? "Copy MCP URL" : "Kopírovat MCP URL"}</Button>
          <Button onClick={() => copy(prompt)}>{en ? "Copy daily prompt" : "Kopírovat denní pokyn"}</Button>
          <Button variant="outline" onClick={copyPersonalPrompt}>{en ? "Copy prompt with my gate numbers" : "Kopírovat pokyn s mými branami"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">{en ? "The last option copies your calculated gate numbers, not your birth details. Paste into an external assistant only if you want to share them." : "Poslední možnost kopíruje čísla vypočtených bran, nikoli údaje o narození. Do externího asistenta je vložte pouze tehdy, chcete-li je sdílet."}</p>
        <p role="status" className="text-sm">{copyNotice}</p>
      </section>
      <section className="space-y-4 rounded-3xl border p-6">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold"><Mail className="h-5 w-5" />{en ? "Daily email (optional)" : "Denní e-mail (volitelný)"}</h2>
        <p className="text-sm text-muted-foreground">{en ? "Receive the same general daily themes at around 8 AM Prague time. No marketing subscription is created." : "Dostávejte stejná obecná témata dne přibližně v 8 hodin pražského času. Nevzniká tím marketingový odběr."}</p>
        {loading ? <p>{en ? "Loading account…" : "Načítám účet…"}</p> : !isAuthenticated ?
          <a className="font-semibold text-primary underline" href={localePath("/login")}>{en ? "Sign in to manage daily email" : "Přihlaste se pro nastavení denního e-mailu"}</a>
          : prefs?.enabled ? <Button variant="outline" disabled={busy} onClick={() => save(false)}>{en ? "Disable daily email" : "Vypnout denní e-mail"}</Button>
          : prefs?.available ? <>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
              {en ? "I want one daily service email to my verified account address. I can disable it at any time." : "Chci jeden denní servisní e-mail na ověřenou adresu svého účtu. Odběr mohu kdykoli vypnout."}
            </label>
            <Button disabled={!consent || busy} onClick={() => save(true)}>{en ? "Enable daily email" : "Zapnout denní e-mail"}</Button>
          </> : <p className="text-sm text-muted-foreground">{en ? "Daily email is not available yet." : "Denní e-mail zatím není dostupný."}</p>}
        <p role="status" className="text-sm">{notice}</p>
      </section>
    </main>
    <Footer />
  </div>;
}
