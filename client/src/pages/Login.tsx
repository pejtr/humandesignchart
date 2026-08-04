import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

const providers = [
  {
    id: "google" as const,
    name: { cs: "Google", en: "Google" },
    url: "/api/oauth/login/google",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
    bgClass: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300",
  },
  {
    id: "facebook" as const,
    name: { cs: "Facebook", en: "Facebook" },
    url: "/api/oauth/login/facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bgClass: "bg-[#1877F2] hover:bg-[#166FE5] text-white",
  },
  {
    id: "apple" as const,
    name: { cs: "Apple", en: "Apple" },
    url: "/api/oauth/login/apple",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    bgClass: "bg-black hover:bg-gray-900 text-white",
  },
];

export default function Login() {
  const { locale, localePath } = useLanguage();
  const [, navigate] = useLocation();
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-serif text-2xl font-bold">
            {isEn ? "Sign in" : "Přihlásit se"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isEn
              ? "Choose your preferred login method"
              : "Vyberte způsob přihlášení"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.map((p, i) => (
            <a key={p.id} href={p.url} className="block">
              <Button
                variant="outline"
                className={`w-full justify-center gap-3 h-12 text-sm font-medium ${p.bgClass}`}
              >
                {p.icon}
                {isEn ? `Continue with ${p.name.en}` : `Pokračovat přes ${p.name.cs}`}
              </Button>
            </a>
          ))}

          <div className="relative my-4">
            <Separator />
          </div>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "By signing in, you agree to our Terms of Service and Privacy Policy."
              : "Přihlášením souhlasíte s našimi Podmínkami použití a Zásadami ochrany soukromí."}
          </p>

          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => navigate(localePath("/"))}
            >
              <ArrowLeft className="w-4 h-4" />
              {isEn ? "Back to home" : "Zpět na úvod"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
