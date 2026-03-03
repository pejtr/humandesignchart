import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import HDLoader from "./components/HDLoader";

const ChartCalculator = lazy(() => import("./pages/ChartCalculator"));
const ChartResult = lazy(() => import("./pages/ChartResult"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChartComparison = lazy(() => import("./pages/ChartComparison"));
const Transits = lazy(() => import("./pages/Transits"));
const IChing = lazy(() => import("./pages/IChing"));
const Celebrities = lazy(() => import("./pages/Celebrities"));
const Encyclopedia = lazy(() => import("./pages/Encyclopedia"));
const AiGuide = lazy(() => import("./pages/AiGuide"));
const ReturnChart = lazy(() => import("./pages/ReturnChart"));
const TransitCalendar = lazy(() => import("./pages/TransitCalendar"));
const VariablesAnalysis = lazy(() => import("./pages/VariablesAnalysis"));
const SharedChart = lazy(() => import("./pages/SharedChart"));
const TypeDetail = lazy(() => import("./pages/TypeDetail"));

function PageLoader() {
  return <HDLoader />;
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
        <Route path="/encyclopedia" component={Encyclopedia} />
        <Route path="/ai-guide" component={AiGuide} />
        <Route path="/return-chart" component={ReturnChart} />
        <Route path="/transit-calendar" component={TransitCalendar} />
        <Route path="/variables" component={VariablesAnalysis} />
        <Route path="/shared/:token" component={SharedChart} />
        <Route path="/types/:type" component={TypeDetail} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
