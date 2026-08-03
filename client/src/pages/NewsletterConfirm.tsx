import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsletterConfirm() {
  const { locale, localePath } = useLanguage();
  const isEn = locale === "en";
  const [, params] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Extract token from URL search params
  const token = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("token")
    : null;

  const confirmMutation = trpc.newsletter.confirm.useMutation({
    onSuccess: () => setStatus("success"),
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message);
    },
  });

  useEffect(() => {
    if (token) {
      confirmMutation.mutate({ token });
    } else {
      setStatus("error");
      setErrorMsg(isEn ? "No confirmation token found" : "Chybí potvrzovací token");
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 flex justify-center">
        <div className="container max-w-md text-center">
          {status === "loading" && (
            <div className="py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isEn ? "Confirming your subscription..." : "Potvrzuji vaše přihlášení..."}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-12">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-3">
                {isEn ? "You're all set!" : "Vše je hotové!"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isEn
                  ? "Your subscription has been confirmed. You'll receive your first cosmic insight next Monday."
                  : "Vaše přihlášení bylo potvrzeno. První kosmický vhled obdržíte příští pondělí."}
              </p>
              <Button asChild>
                <a href={localePath("/")}>
                  {isEn ? "Back to Home" : "Zpět na úvod"}
                </a>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="py-12">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-3">
                {isEn ? "Confirmation Failed" : "Potvrzení se nepodařilo"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {errorMsg || (isEn
                  ? "This confirmation link is invalid or has expired."
                  : "Tento potvrzovací odkaz je neplatný nebo vypršel.")}
              </p>
              <Button asChild>
                <a href={localePath("/")}>
                  {isEn ? "Back to Home" : "Zpět na úvod"}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
