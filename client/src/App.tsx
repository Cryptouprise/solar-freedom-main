import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CityPage from "./pages/CityPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CompanyPage from "./pages/CompanyPage";
import SeoCommandCenter from "./pages/SeoCommandCenter";
import SolarFraudReport from "./pages/SolarFraudReport";
import SolarContractHelp from "./pages/SolarContractHelp";
import SolarPanelScam from "./pages/SolarPanelScam";
import SolarExitOptions from "./pages/SolarExitOptions";
import StateLawsIndex from "./pages/StateLawsIndex";
import StateLawPage from "@/pages/StateLawPage";
import SellingHouseWithSolar from "@/pages/SellingHouseWithSolar";
import SolarLienRemoval from "@/pages/SolarLienRemoval";
import SolarLoanHelp from "@/pages/SolarLoanHelp";
import AdminLeads from "@/pages/AdminLeads";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminContent from "@/pages/AdminContent";
import SolarCompanyHub from "@/pages/SolarCompanyHub";
import { useEffect } from "react";
import ExitIntentPopup from "./components/ExitIntentPopup";
import StickyMobileBar from "./components/StickyMobileBar";

// Normalize trailing slashes — redirect /foo/ → /foo so wouter routes always match
function TrailingSlashRedirect() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (location !== "/" && location.endsWith("/")) {
      navigate(location.slice(0, -1), { replace: true });
    }
  }, [location, navigate]);
  return null;
}

// Redirect legacy dash-format URLs → new slash-format
// e.g. /cancel-solar-contract-dallas-tx → /cancel-solar-contract/dallas-tx
function LegacyCityRedirect() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    // Match /cancel-solar-contract-{city}-{state} (old format)
    const match = location.match(/^\/cancel-solar-contract-([a-z0-9-]+)$/);
    if (match) {
      navigate(`/cancel-solar-contract/${match[1]}`, { replace: true });
    }
  }, [location, navigate]);
  return null;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <TrailingSlashRedirect />
      <LegacyCityRedirect />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/cancel-solar-contract/:slug"} component={CityPage} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/blog/:slug"} component={BlogPost} />
        <Route path={/^\/cancel-(.+)-solar-contract$/}>{() => {
          // RegExp route: matches /cancel-{any-slug}-solar-contract
          // CompanyPage extracts slug from URL via useLocation()
          return <CompanyPage />;
        }}</Route>
        <Route path={"/seo-command-center"} component={SeoCommandCenter} />
        <Route path={"/solar-fraud-report"} component={SolarFraudReport} />
        <Route path={"/solar-panel-scam"} component={SolarPanelScam} />
        <Route path={"/solar-contract-help"} component={SolarContractHelp} />
        <Route path={"/solar-exit-options"} component={SolarExitOptions} />
        <Route path={"/solar-contract-laws"} component={StateLawsIndex} />
        <Route path={"/solar-contract-laws/:state"} component={StateLawPage} />
        <Route path={"/selling-house-with-solar"} component={SellingHouseWithSolar} />
        <Route path={"/solar-lien-removal"} component={SolarLienRemoval} />
        <Route path={"/solar-loan-help"} component={SolarLoanHelp} />
        <Route path={"/solar-companies"} component={SolarCompanyHub} />
        <Route path={"/admin/leads"} component={AdminLeads} />
        <Route path={"/admin/analytics"} component={AdminAnalytics} />
        <Route path={"/admin/content"} component={AdminContent} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
