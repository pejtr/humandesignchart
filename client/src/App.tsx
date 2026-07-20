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
import NewsletterPopup from "./components/NewsletterPopup";
import ExitIntentPopup from "./components/ExitIntentPopup";
import WelcomeModal, { useWelcomeModal } from "./components/WelcomeModal";
import PageTransition from "./components/PageTransition";
import { ScrollToTop } from "./components/ScrollToTop";
import { CookieConsent } from "./components/CookieConsent";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AuthSidebar } from "./components/AuthSidebar";
import { FloatingChatGuide } from "./components/FloatingChatGuide";
import { useAuth } from "./_core/hooks/useAuth";

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
const EmbedCalculator = lazy(() => import("./pages/EmbedCalculator"));
const TypeDetail = lazy(() => import("./pages/TypeDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const IncarnationCross = lazy(() => import("./pages/IncarnationCross"));
const DailyTransit = lazy(() => import("./pages/DailyTransit"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding"));
const SocialScheduler = lazy(() => import("./pages/SocialScheduler"));
const CompositeChart = lazy(() => import("./pages/CompositeChart"));
const AndelskaCisla = lazy(() => import("./pages/AndelskaCisla"));
const AndelskaCislaDetail = lazy(() => import("./pages/AndelskaCislaDetail"));
const AdminCRM = lazy(() => import("./pages/AdminCRM"));
const RoleCompatibility = lazy(() => import("./pages/RoleCompatibility"));
const CrmDashboard = lazy(() => import("./pages/CrmDashboard"));
const HumanDesignTest = lazy(() => import("./pages/HumanDesignTest"));
const AdminAds = lazy(() => import("./pages/AdminAds"));

function PageLoader() {
  return <HDLoader />;
}

/** Wraps a lazy-loaded component in its own ErrorBoundary so a crash in one route doesn't take down the whole app. */
function SafeRoute({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
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
  const { isAuthenticated } = useAuth();
  return (
    <div className={isAuthenticated ? "lg:pl-[var(--sidebar-w,56px)]" : ""} style={{ transition: "padding-left 0.2s" }}>
      <PageTransition>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            {/* Locale root = home */}
            <Route path="/:locale" component={Home} />

            {/* Core pages */}
            <Route path="/:locale/calculate">
              {() => <SafeRoute><ChartCalculator /></SafeRoute>}
            </Route>
            <Route path="/:locale/human-design-kalkulacka">
              {() => <SafeRoute><ChartCalculator seoType="kalkulacka" /></SafeRoute>}
            </Route>
            <Route path="/:locale/human-design-test">
              {() => <SafeRoute><HumanDesignTest /></SafeRoute>}
            </Route>
            <Route path="/:locale/human-design-typy">
              {() => <SafeRoute><ChartCalculator seoType="typy" /></SafeRoute>}
            </Route>
            <Route path="/:locale/chart/:id">
              {(params: any) => <SafeRoute><ChartResult id={params.id} /></SafeRoute>}
            </Route>
            <Route path="/:locale/dashboard">
              {() => <SafeRoute><Dashboard /></SafeRoute>}
            </Route>
            <Route path="/:locale/compare">
              {() => <SafeRoute><ChartComparison /></SafeRoute>}
            </Route>
            <Route path="/:locale/transits">
              {() => <SafeRoute><Transits /></SafeRoute>}
            </Route>
            <Route path="/:locale/iching">
              {() => <SafeRoute><IChing /></SafeRoute>}
            </Route>
            <Route path="/:locale/celebrities">
              {() => <SafeRoute><Celebrities /></SafeRoute>}
            </Route>
            <Route path="/:locale/encyclopedia">
              {() => <SafeRoute><Encyclopedia /></SafeRoute>}
            </Route>
            <Route path="/:locale/ai-guide">
              {() => <SafeRoute><AiGuide /></SafeRoute>}
            </Route>
            <Route path="/:locale/return-chart">
              {() => <SafeRoute><ReturnChart /></SafeRoute>}
            </Route>
            <Route path="/:locale/transit-calendar">
              {() => <SafeRoute><TransitCalendar /></SafeRoute>}
            </Route>
            <Route path="/:locale/variables">
              {() => <SafeRoute><VariablesAnalysis /></SafeRoute>}
            </Route>
            <Route path="/:locale/types/:type">
              {(params: any) => <SafeRoute><TypeDetail type={params.type} /></SafeRoute>}
            </Route>
            <Route path="/:locale/blog">
              {() => <SafeRoute><Blog /></SafeRoute>}
            </Route>
            <Route path="/:locale/blog/:slug">
              {(params: any) => <SafeRoute><BlogArticle slug={params.slug} /></SafeRoute>}
            </Route>
            <Route path="/:locale/incarnation-cross">
              {() => <SafeRoute><IncarnationCross /></SafeRoute>}
            </Route>
            <Route path="/:locale/andelska-cisla">
              {() => <SafeRoute><AndelskaCisla /></SafeRoute>}
            </Route>
            <Route path="/:locale/andelska-cisla/:slug">
              {(params: any) => <SafeRoute><AndelskaCislaDetail slug={params.slug} /></SafeRoute>}
            </Route>
            <Route path="/:locale/daily-transit">
              {() => <SafeRoute><DailyTransit /></SafeRoute>}
            </Route>
            <Route path="/:locale/social-scheduler">
              {() => <SafeRoute><SocialScheduler /></SafeRoute>}
            </Route>
            <Route path="/:locale/composite">
              {() => <SafeRoute><CompositeChart /></SafeRoute>}
            </Route>
            <Route path="/:locale/role-compatibility">
              {() => <SafeRoute><RoleCompatibility /></SafeRoute>}
            </Route>
            <Route path="/:locale/admin/crm">
              {() => <SafeRoute><AdminCRM /></SafeRoute>}
            </Route>
            <Route path="/:locale/admin/ads">
              {() => <SafeRoute><AdminAds /></SafeRoute>}
            </Route>
            <Route path="/:locale/crm-dashboard">
              {() => <SafeRoute><CrmDashboard /></SafeRoute>}
            </Route>
            <Route path="/:locale/pricing">
              {() => <SafeRoute><Pricing /></SafeRoute>}
            </Route>
            <Route path="/:locale/payment/success">
              {() => <SafeRoute><PaymentSuccess /></SafeRoute>}
            </Route>
            <Route path="/:locale/payment/cancel">
              {() => <SafeRoute><PaymentCancel /></SafeRoute>}
            </Route>

            {/* Referral landing pages */}
            <Route path="/:locale/refer/:code">
              {(params: any) => <ReferralLanding code={params.code} />}
            </Route>

            {/* Shared charts (no locale prefix — public links) */}
            <Route path="/embed/calculator">
              {() => <SafeRoute><EmbedCalculator /></SafeRoute>}
            </Route>
            <Route path="/shared/:token">
              {(params: any) => <SafeRoute><SharedChart token={params.token} /></SafeRoute>}
            </Route>
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
            <Route path="/human-design-kalkulacka"><LegacyRedirect path="/human-design-kalkulacka" /></Route>
            <Route path="/human-design-test"><LegacyRedirect path="/human-design-test" /></Route>
            <Route path="/human-design-typy"><LegacyRedirect path="/human-design-typy" /></Route>
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
            <Route path="/composite"><LegacyRedirect path="/composite" /></Route>
            <Route path="/crm-dashboard"><LegacyRedirect path="/crm-dashboard" /></Route>

            {/* 404 */}
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch >
        </Suspense >
      </PageTransition >
    </div >
  );
}

function WelcomeModalWrapper() {
  const { shouldShow, dismiss } = useWelcomeModal();
  if (!shouldShow) return null;
  return <WelcomeModal onClose={dismiss} />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <LanguageProvider>
            <Toaster />
            <ReferralApplier />
            <WelcomeModalWrapper />
            <NewsletterPopup />
            <ExitIntentPopup />
            <ScrollToTop />
            <CookieConsent />
            <AuthSidebar />
            <MobileBottomNav />
            <FloatingChatGuide />
            <LocaleRoutes />
          </LanguageProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
