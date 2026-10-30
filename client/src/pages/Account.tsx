import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Compass, Info, Loader2, LogOut } from "lucide-react";

/**
 * Cloudflare-native signed-in landing: does not pretend legacy chart/credit
 * endpoints are wired, or silently grant paid entitlements by matching email.
 */
export default function Account() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { locale, localePath } = useLanguage();
  const [, navigate] = useLocation();
  const [logoutError, setLogoutError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const en = locale === "en";

  const endSession = async () => {
    setLogoutError(false);
    setLoggingOut(true);
    try {
      await logout();
      navigate(localePath("/login"));
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {en ? "Your Human Design account" : "Váš Human Design účet"}
          </CardTitle>
          <CardDescription>
            {en ? "Secure Google sign-in" : "Bezpečné přihlášení přes Google"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div role="status" className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {en ? "Checking your session…" : "Ověřuji přihlášení…"}
            </div>
          ) : isAuthenticated ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">
                    {en ? "You are signed in" : "Jste přihlášeni"}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {user?.name || user?.email}
                  </p>
                  {user?.name && <p className="text-xs text-muted-foreground break-all">{user.email}</p>}
                </div>
              </div>
              <div role="note" className="flex items-start gap-2 rounded-lg bg-muted/60 p-4 text-sm">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  {en
                    ? "Sign-in is active. Previously saved charts, purchases, and premium credits from the legacy account system are not yet linked to this Google identity."
                    : "Přihlášení je aktivní. Dříve uložené mapy, nákupy a prémiové kredity ze staršího systému zatím nejsou propojeny s tímto Google účtem."}
                </p>
              </div>
              <Button className="w-full gap-2" onClick={() => navigate(localePath("/calculate"))}>
                <Compass className="h-4 w-4" />
                {en ? "Calculate a free chart" : "Vypočítat mapu zdarma"}
              </Button>
              {logoutError && (
                <p role="alert" className="text-sm text-destructive">
                  {en ? "Sign-out failed. Your session may still be active." : "Odhlášení se nezdařilo. Relace může být stále aktivní."}
                </p>
              )}
              <Button variant="outline" className="w-full gap-2" disabled={loggingOut} onClick={endSession}>
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {en ? "Sign out" : "Odhlásit se"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {en ? "You're not signed in. Sign in to continue." : "Nejste přihlášeni. Pro pokračování se přihlaste."}
              </p>
              <Button className="w-full" onClick={() => navigate(localePath("/login"))}>
                {en ? "Sign in" : "Přihlásit se"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
