import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, CreditCard, HelpCircle } from "lucide-react";
import { Link } from "wouter";

export default function PaymentCancel() {
  const { locale, localePath } = useLanguage();
  const [, navigate] = useLocation();
  const isEn = locale === "en";

  useEffect(() => {
    document.title = isEn ? "Payment Cancelled — Human Design" : "Platba zrušena — Human Design";
  }, [isEn]);

  const reasons = isEn ? [
    { q: "Changed your mind?", a: "No problem — you can upgrade anytime from the Pricing page." },
    { q: "Had a technical issue?", a: "Try again with card 4242 4242 4242 4242 (test mode) or contact support." },
    { q: "Not sure if it's worth it?", a: "You still have 5 free AI readings — try them first, then decide." },
  ] : [
    { q: "Rozmysleli jste si to?", a: "Žádný problém — můžete upgradovat kdykoli ze stránky Ceník." },
    { q: "Měli jste technický problém?", a: "Zkuste to znovu nebo nás kontaktujte na podpoře." },
    { q: "Nejste si jisti hodnotou?", a: "Stále máte 5 bezplatných AI výkladů — nejprve je vyzkouejte, pak se rozhodněte." },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-10 h-10 text-red-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold mb-3">
              {isEn ? "Payment cancelled" : "Platba zrušena"}
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isEn
                ? "No charge was made. Your free account is still active."
                : "Žádná platba nebyla provedena. Váš bezplatný účet je stále aktivní."}
            </p>
          </motion.div>

          {/* Reasons / FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 mb-8 text-left"
          >
            {reasons.map((r, i) => (
              <Card key={i} className="border-border/40">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-0.5">{r.q}</p>
                      <p className="text-xs text-muted-foreground">{r.a}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href={localePath("/pricing")}>
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                <CreditCard className="w-4 h-4" />
                {isEn ? "Try again" : "Zkusit znovu"}
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => navigate(localePath("/calculate"))}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {isEn ? "Back to free chart" : "Zpět na bezplatnou mapu"}
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
