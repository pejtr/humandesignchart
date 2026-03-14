import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import { lazy, Suspense, useEffect } from "react";
import HDLoader from "./components/HDLoader";
import ReferralApplier from "./components/ReferralApplier";

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
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const IncarnationCross = lazy(() => import("./pages/IncarnationCross"));
const DailyTransit = lazy(() => import("./pages/DailyTransit"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding"));

function PageLoader() {
  return <HDLoader />;
}

/**
 * Detect preferred language from browser settings.
 * Returns "cs" if Czech/Slovak is preferred, "en" otherwise.
 */
function detectPreferredLocale(): "cs" | "en" {
  const langs = navigator.languages || [navigator.language];
  for (const lang of langs) {
    const code = lang.toLowerCase().split("-")[0];
    if (code === "cs" || code === "sk") return "cs";
    if (code === "en") return "en";
  }
  return "en";
}

/**
 * Root redirect: / → /cs or /en based on browser language.
 * Also handles legacy routes without locale prefix.
 */
function RootRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const locale = detectPreferredLocale();
    setLocation(`/${locale}`, { replace: true });
  }, [setLocation]);
  return <HDLoader />;
}

/**
 * Legacy route redirect: /calculate → /cs/calculate (or /en/calculate)
 */
function LegacyRedirect({ path }: { path: string }) {
  const locale = detectPreferredLocale();
  return <Redirect to={`/${locale}${path}`} />;
}

/** All app routes, rendered inside a locale prefix */
function LocaleRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Locale root = home */}
        <Route path="/:locale" component={Home} />

        {/* Core pages */}
        <Route path="/:locale/calculate" component={ChartCalculator} />
        <Route path="/:locale/chart/:id" component={ChartResult} />
        <Route path="/:locale/dashboard" component={Dashboard} />
        <Route path="/:locale/compare" component={ChartComparison} />
        <Route path="/:locale/transits" component={Transits} />
        <Route path="/:locale/iching" component={IChing} />
        <Route path="/:locale/celebrities" component={Celebrities} />
        <Route path="/:locale/encyclopedia" component={Encyclopedia} />
        <Route path="/:locale/ai-guide" component={AiGuide} />
        <Route path="/:locale/return-chart" component={ReturnChart} />
        <Route path="/:locale/transit-calendar" component={TransitCalendar} />
        <Route path="/:locale/variables" component={VariablesAnalysis} />
        <Route path="/:locale/types/:type" component={TypeDetail} />
        <Route path="/:locale/blog" component={Blog} />
        <Route path="/:locale/blog/:slug" component={BlogArticle} />
        <Route path="/:locale/incarnation-cross" component={IncarnationCross} />
        <Route path="/:locale/daily-transit" component={DailyTransit} />
        <Route path="/:locale/pricing" component={Pricing} />
        <Route path="/:locale/payment/success" component={PaymentSuccess} />
        <Route path="/:locale/payment/cancel" component={PaymentCancel} />

        {/* Referral landing pages */}
        <Route path="/:locale/refer/:code">
          {(params: any) => <ReferralLanding code={params.code} />}
        </Route>

        {/* Shared charts (no locale prefix — public links) */}
        <Route path="/shared/:token" component={SharedChart} />
        {/* Referral without locale prefix */}
        <Route path="/refer/:code">
          {(params: any) => {
            const locale = detectPreferredLocale();
            return <Redirect to={`/${locale}/refer/${params.code}`} />;
          }}
        </Route>

        {/* Root redirect */}
        <Route path="/">
          <RootRedirect />
        </Route>

        {/* Legacy routes without locale prefix → redirect */}
        <Route path="/calculate"><LegacyRedirect path="/calculate" /></Route>
        <Route path="/chart/:id">{(params: any) => <LegacyRedirect path={`/chart/${params.id}`} />}</Route>
        <Route path="/dashboard"><LegacyRedirect path="/dashboard" /></Route>
        <Route path="/compare"><LegacyRedirect path="/compare" /></Route>
        <Route path="/transits"><LegacyRedirect path="/transits" /></Route>
        <Route path="/iching"><LegacyRedirect path="/iching" /></Route>
        <Route path="/celebrities"><LegacyRedirect path="/celebrities" /></Route>
        <Route path="/encyclopedia"><LegacyRedirect path="/encyclopedia" /></Route>
        <Route path="/ai-guide"><LegacyRedirect path="/ai-guide" /></Route>
        <Route path="/return-chart"><LegacyRedirect path="/return-chart" /></Route>
        <Route path="/transit-calendar"><LegacyRedirect path="/transit-calendar" /></Route>
        <Route path="/variables"><LegacyRedirect path="/variables" /></Route>
        <Route path="/types/:type">{(params: any) => <LegacyRedirect path={`/types/${params.type}`} />}</Route>
        <Route path="/blog"><LegacyRedirect path="/blog" /></Route>
        <Route path="/blog/:slug">{(params: any) => <LegacyRedirect path={`/blog/${params.slug}`} />}</Route>
        <Route path="/incarnation-cross"><LegacyRedirect path="/incarnation-cross" /></Route>
        <Route path="/daily-transit"><LegacyRedirect path="/daily-transit" /></Route>
        <Route path="/pricing"><LegacyRedirect path="/pricing" /></Route>
        <Route path="/payment/success"><LegacyRedirect path="/payment/success" /></Route>
        <Route path="/payment/cancel"><LegacyRedirect path="/payment/cancel" /></Route>

        {/* 404 */}
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
          <LanguageProvider>
            <Toaster />
            <ReferralApplier />
            <LocaleRoutes />
          </LanguageProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
