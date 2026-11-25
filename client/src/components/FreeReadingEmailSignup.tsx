import { Mail, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/** Public hosted signup URL only. Never expose a Brevo API key in a VITE variable. */
export function safeSignupUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (!(url.hostname === "sibforms.com" || url.hostname.endsWith(".sibforms.com"))) return null;
    if (url.pathname === "/" || url.search || url.hash) return null;
    return url.href;
  } catch { return null; }
}

/**
 * Optional email education after a free reading. Brevo hosts the email form,
 * CAPTCHA, consent record and double opt-in. No chart or identity data is sent
 * by this component, and no external iframe or tracking loads before a click.
 * Hide until the operator has configured the actual verified public form.
 */
export default function FreeReadingEmailSignup() {
  const { locale } = useLanguage();
  if (locale !== "cs" && locale !== "en") return null;
  const en = locale === "en";
  const href = safeSignupUrl(en
    ? import.meta.env.VITE_HD_BREVO_SIGNUP_EN
    : import.meta.env.VITE_HD_BREVO_SIGNUP_CS);
  if (!href) return null;
  return (
    <section data-testid="hd-free-reading-email-signup"
      className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {en ? "Free email series" : "E-mailový minikurz zdarma"}
          </p>
          <h2 className="font-serif text-xl font-bold sm:text-2xl">
            {en ? "Make more of your Human Design reading" : "Rozumějte své Human Design mapě lépe"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {en
              ? "Get five short lessons on your type, strategy and authority, plus optional Blueprint offers. Confirm your subscription by email. Your free chart stays available without subscribing."
              : "Získejte pět krátkých lekcí o typu, strategii a autoritě i nabídky osobního Blueprintu. Odběr potvrdíte e-mailem. Vaše bezplatná mapa zůstává dostupná i bez odběru."}
          </p>
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          {en ? "Join the free series" : "Chci minikurz zdarma"}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{en ? " (opens in a new tab)" : " (otevře se na nové kartě)"}</span>
        </a>
      </div>
    </section>
  );
}
