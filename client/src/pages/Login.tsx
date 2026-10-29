import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Compass, Info, LockKeyhole, LogIn } from "lucide-react";

export default function Login() {
  const { locale, localePath } = useLanguage();
  const [, navigate] = useLocation();
  const isEn = locale === "en";
  const [googleReady, setGoogleReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/auth/status", { credentials: "same-origin", cache: "no-store", signal: abort.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((status) => { if (!abort.signal.aborted) setGoogleReady(status?.google === true); })
      .catch(() => { if (!abort.signal.aborted) setGoogleReady(false); })
      .finally(() => { if (!abort.signal.aborted) setChecking(false); });
    return () => abort.abort();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif text-2xl font-bold">
            {isEn ? "Your account, securely" : "Váš účet, bezpečně"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isEn ? "Sign in to your Human Design account" : "Přihlaste se ke svému účtu Human Design"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {googleReady ? (
            <Button className="w-full gap-2" onClick={() => window.location.assign("/api/oauth/login/google")}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isEn ? "Continue with Google" : "Pokračovat přes Google"}
            </Button>
          ) : (
            <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">
                    {checking
                      ? (isEn ? "Checking secure sign-in…" : "Ověřuji zabezpečené přihlášení…")
                      : (isEn ? "Google sign-in is temporarily unavailable" : "Přihlášení přes Google je dočasně nedostupné")}
                  </p>
                  {!checking && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {isEn
                        ? "Account access will reopen once Google OAuth and secure account storage are configured. You can still calculate a free chart."
                        : "Přihlášení obnovíme po dokončení konfigurace Google OAuth a bezpečného ukládání účtů. Mapu zdarma lze stále vypočítat."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-primary/[0.06] px-4 py-4">
            <p className="text-sm font-semibold">
              {isEn ? "You can also explore your free chart" : "Svou mapu můžete prozkoumat i bez účtu"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {isEn
                ? "Calculate a Human Design bodygraph with your birth details without signing in or paying."
                : "Vypočítejte si Human Design mapu ze svých údajů o narození bez přihlášení a bez platby."}
            </p>
            <Button className="mt-4 w-full gap-2" onClick={() => navigate(localePath("/calculate"))}>
              <Compass className="h-4 w-4" aria-hidden="true" />
              {isEn ? "Calculate my free chart" : "Vypočítat mapu zdarma"}
            </Button>
          </div>

          <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => navigate(localePath("/"))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {isEn ? "Back to home" : "Zpět na úvod"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
