import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Compass, Info, LockKeyhole, LogIn, Loader2 } from "lucide-react";

type ProviderStatus = "checking" | "available" | "unavailable";

/**
 * Show real Google sign-in only after the deployed Pages Worker confirms
 * credentials and persistent D1 user/session tables. Never show a fake login.
 */
export default function Login() {
  const { locale, localePath } = useLanguage();
  const [, navigate] = useLocation();
  const isEn = locale === "en";
  const [provider, setProvider] = useState<ProviderStatus>("checking");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(new URLSearchParams(window.location.search).get("auth") === "failed");
    fetch("/api/auth/config", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok && (await response.json())?.google === true)
      .then((enabled) => { if (!controller.signal.aborted) setProvider(enabled ? "available" : "unavailable"); })
      .catch(() => { if (!controller.signal.aborted) setProvider("unavailable"); });
    return () => controller.abort();
  }, []);

  const signIn = () => {
    if (provider !== "available") return;
    const params = new URLSearchParams(window.location.search);
    const intended = params.get("returnTo");
    const fallback = localePath("/dashboard");
    const local = intended && intended.startsWith("/") && !intended.startsWith("//") &&
      !intended.includes("\\") && !/^\/api(\/|$)/i.test(intended) ? intended : fallback;
    window.location.assign("/api/oauth/login/google?returnTo=" + encodeURIComponent(local));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif text-2xl font-bold">
            {isEn ? "Sign in securely" : "Bezpečné přihlášení"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isEn ? "Access your Human Design account" : "Přístup k vašemu Human Design účtu"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {failed && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
              {isEn
                ? "Google sign-in could not be completed. Please try again or use the free chart without signing in."
                : "Přihlášení přes Google se nepodařilo dokončit. Zkuste to znovu nebo pokračujte k mapě zdarma."}
            </div>
          )}

          {provider === "available" ? (
            <Button className="w-full gap-2" onClick={signIn} data-testid="google-sign-in">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isEn ? "Continue with Google" : "Pokračovat přes Google"}
            </Button>
          ) : provider === "checking" ? (
            <div role="status" className="flex justify-center items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {isEn ? "Checking sign-in availability…" : "Ověřuji dostupnost přihlášení…"}
            </div>
          ) : (
            <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">
                    {isEn ? "Google sign-in is temporarily unavailable" : "Google přihlášení je dočasně nedostupné"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {isEn
                      ? "The secure Google connection is not yet configured on this domain. Your free Human Design chart remains available without signing in."
                      : "Bezpečné propojení s Googlem zatím na této doméně není dokončené. Bezplatnou Human Design mapu můžete vytvořit bez přihlášení."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-primary/[0.06] px-4 py-4">
            <p className="text-sm font-semibold">
              {isEn ? "Explore your free chart" : "Vytvořit mapu zdarma"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {isEn
                ? "Calculate your Human Design chart without an account or payment."
                : "Spočítejte si Human Design mapu bez účtu a bez platby."}
            </p>
            <Button className="mt-4 w-full gap-2" variant="outline"
              onClick={() => navigate(localePath("/calculate"))}>
              <Compass className="h-4 w-4" aria-hidden="true" />
              {isEn ? "Calculate my free chart" : "Vypočítat mapu zdarma"}
            </Button>
          </div>

          <Button variant="ghost" className="w-full gap-2 text-muted-foreground"
            onClick={() => navigate(localePath("/"))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {isEn ? "Back to home" : "Zpět na úvod"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
