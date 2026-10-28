import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Compass, Info, LockKeyhole } from "lucide-react";

export default function Login() {
  const { locale, localePath } = useLanguage();
  const [, navigate] = useLocation();
  const isEn = locale === "en";

  // Authentication endpoints live in the legacy Express server. The current
  // Cloudflare Pages application does not have OAuth sessions or user storage.
  // Never expose a clickable Google / Facebook / Apple button leading to a
  // missing API route, or pretend that a sign-in succeeded.
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
            {isEn ? "A quick update on account access" : "Aktuální informace o přihlášení"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">
                  {isEn ? "Google sign-in is temporarily unavailable" : "Přihlášení přes Google je dočasně nedostupné"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {isEn
                    ? "We are connecting secure account access to our new hosting infrastructure. Google, Facebook and Apple buttons are disabled until the complete sign-in flow is verified. We won't ask you to sign in through a broken page."
                    : "Dokončujeme bezpečné přihlášení v nové infrastruktuře. Tlačítka Google, Facebook a Apple zůstanou vypnutá, dokud neověříme celé přihlášení. Nebudeme vás přesměrovávat na nefunkční stránku."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary/[0.06] px-4 py-4">
            <p className="text-sm font-semibold">
              {isEn ? "You can still explore your free chart" : "Svou mapu můžete prozkoumat i bez účtu"}
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
