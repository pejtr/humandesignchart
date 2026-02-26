import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";

const ChartCalculator = lazy(() => import("./pages/ChartCalculator"));
const ChartResult = lazy(() => import("./pages/ChartResult"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChartComparison = lazy(() => import("./pages/ChartComparison"));
const Transits = lazy(() => import("./pages/Transits"));
const IChing = lazy(() => import("./pages/IChing"));
const Celebrities = lazy(() => import("./pages/Celebrities"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif text-lg">Načítání...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calculate" component={ChartCalculator} />
        <Route path="/chart/:id" component={ChartResult} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/compare" component={ChartComparison} />
        <Route path="/transits" component={Transits} />
        <Route path="/iching" component={IChing} />
        <Route path="/celebrities" component={Celebrities} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
