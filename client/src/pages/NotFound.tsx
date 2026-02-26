import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 bg-card border-border/50">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-400" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

          <h2 className="text-xl font-semibold text-foreground/80 mb-4">
            Stránka Nenalezena
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Omlouváme se, ale tato stránka neexistuje.
            <br />
            Mohla být přesunuta nebo smazána.
          </p>

          <Button
            onClick={() => setLocation("/")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="w-4 h-4 mr-2" />
            Zpět na Hlavní Stránku
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
