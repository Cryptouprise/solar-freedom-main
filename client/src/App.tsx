import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ExitIntentPopup from "./components/ExitIntentPopup";
import StickyMobileBar from "./components/StickyMobileBar";
import CallbackWidget from "./components/CallbackWidget";
import DesktopCallButton from "./components/DesktopCallButton";

const CityPage = lazy(() => import("./pages/CityPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const CompanyPage = lazy(() => import("./pages/CompanyPage"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const SeoCommandCenter = lazy(() => import("./pages/SeoCommandCenter"));
const SolarFraudReport = lazy(() => import("./pages/SolarFraudReport"));
const SolarContractHelp = lazy(() => import("./pages/SolarContractHelp"));
const SolarPanelScam = lazy(() => import("./pages/SolarPanelScam"));
const SolarExitOptions = lazy(() => import("./pages/SolarExitOptions"));
const StateLawsIndex = lazy(() => import("./pages/StateLawsIndex"));
const StateLawPage = lazy(() => import("@/pages/StateLawPage"));
const SellingHouseWithSolar = lazy(() => import("@/pages/SellingHouseWithSolar"));
const SolarLienRemoval = lazy(() => import("@/pages/SolarLienRemoval"));
const SolarLoanHelp = lazy(() => import("@/pages/SolarLoanHelp"));
const AdminLeads = lazy(() => import("@/pages/AdminLeads"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const AdminContent = lazy(() => import("@/pages/AdminContent"));
const PressReleaseAdmin = lazy(() => import("@/pages/admin/PressReleaseAdmin"));
const PostEditor = lazy(() => import("@/pages/admin/PostEditor"));
const BlogStudio = lazy(() => import("@/pages/admin/BlogStudio"));
const Login = lazy(() => import("@/pages/Login"));
const YouTubeLanding = lazy(() => import("@/pages/YouTubeLanding"));
const Yt2Landing = lazy(() => import("@/pages/Yt2Landing"));
const Yt3Landing = lazy(() => import("@/pages/Yt3Landing"));
const AutomationBuilder = lazy(() => import("@/pages/admin/AutomationBuilder"));
const MediaHub = lazy(() => import("@/pages/MediaHub"));
const SitemapPage = lazy(() => import("@/pages/SitemapPage"));
const SolarCompanyHub = lazy(() => import("@/pages/SolarCompanyHub"));
const SunrunPage = lazy(() => import("@/pages/SunrunPage"));

// Normalize trailing slashes: redirect /foo/ to /foo so wouter routes always match.
function TrailingSlashRedirect() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (location !== "/" && location.endsWith("/")) {
      navigate(location.slice(0, -1), { replace: true });
    }
  }, [location, navigate]);
  return null;
}

// Redirect legacy dash-format URLs to the new slash-format routes.
function LegacyCityRedirect() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    const match = location.match(/^\/cancel-solar-contract-([a-z0-9-]+)$/);
    if (match) {
      navigate(`/cancel-solar-contract/${match[1]}`, { replace: true });
    }
  }, [location, navigate]);
  return null;
}

function Router() {
  return (
    <>
      <TrailingSlashRedirect />
      <LegacyCityRedirect />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/cancel-solar-contract/:slug"} component={CityPage} />
          <Route path={"/blog"} component={Blog} />
          <Route path={"/blog/:slug"} component={BlogPost} />
          <Route path={/^\/cancel-(.+)-solar-contract$/}>
            {() => {
              // RegExp route: matches /cancel-{any-slug}-solar-contract.
              return <CompanyPage />;
            }}
          </Route>
          <Route path={"/how-it-works"} component={HowItWorks} />
          <Route path={"/seo-command-center"} component={SeoCommandCenter} />
          <Route path={"/solar-fraud-report"} component={SolarFraudReport} />
          <Route path={"/solar-panel-scam"} component={SolarPanelScam} />
          <Route path={"/solar-contract-help"} component={SolarContractHelp} />
          <Route path={"/solar-exit-options"} component={SolarExitOptions} />
          <Route path={"/sunrun"} component={SunrunPage} />
          <Route path={"/solar-contract-laws"} component={StateLawsIndex} />
          <Route path={"/solar-contract-laws/:state"} component={StateLawPage} />
          <Route
            path={"/selling-house-with-solar"}
            component={SellingHouseWithSolar}
          />
          <Route path={"/solar-lien-removal"} component={SolarLienRemoval} />
          <Route path={"/solar-loan-help"} component={SolarLoanHelp} />
          <Route path={"/solar-companies"} component={SolarCompanyHub} />
          <Route path={"/admin/leads"} component={AdminLeads} />
          <Route path={"/admin/analytics"} component={AdminAnalytics} />
          <Route path={"/admin/content"} component={AdminContent} />
          <Route path={"/admin/press-releases"} component={PressReleaseAdmin} />
          <Route path={"/admin/posts"} component={PostEditor} />
          <Route path={"/admin/blog-studio"} component={BlogStudio} />
          <Route path={"/admin/automations"} component={AutomationBuilder} />
          <Route path={"/youtube"} component={YouTubeLanding} />
          <Route path={"/yt"} component={YouTubeLanding} />
          <Route path={"/yt2"} component={Yt2Landing} />
          <Route path={"/yt3"} component={Yt3Landing} />
          <Route path={"/media"} component={MediaHub} />
          <Route path={"/watch"} component={MediaHub} />
          <Route path={"/sitemap"} component={SitemapPage} />
          <Route path={"/login"} component={Login} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ExitIntentPopup />
          <StickyMobileBar />
          <DesktopCallButton />
          <CallbackWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
