import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Welcome from "@/pages/welcome";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import Home from "@/pages/home";
import Search from "@/pages/search";
import ToyDetail from "@/pages/toy-detail";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import Onboarding from "@/pages/onboarding";
import UserProfile from "@/pages/user-profile";
import LoadingDemo from "@/pages/loading-demo";
import ExchangeRequest from "@/pages/exchange-request";
import Favorites from "@/pages/favorites";
import Pricing from "@/pages/pricing";
import BillingSuccess from "@/pages/billing-success";
import BillingCancel from "@/pages/billing-cancel";
import Rewards from "@/pages/rewards";
import Invite from "@/pages/invite";
import LoadingLogo from "@/components/ui/LoadingLogo";
import PrivacySafety from "@/pages/privacy-safety";
import PrivacyMessages from "@/pages/privacy-messages";
import AdminModeration from "@/pages/admin-moderation";
import TermsPage from "@/pages/terms";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DataDeletionPage from "@/pages/data-deletion";
import SupportPage from "@/pages/support";
import ModerationMessageNotifier from "@/components/ModerationMessageNotifier";
function ListToyRoute() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/", { replace: true });
  }, [setLocation]);
  return <LoadingLogo label="" />;
}

const PUBLIC_ROUTES = new Set([
  "/", "/welcome", "/landing", "/signup", "/login", "/forgot-password",
  "/pricing", "/terms", "/privacy-policy", "/data-deletion", "/support", "/billing-success", "/billing-cancel",
  "/rewards", "/invite", "/exchange-request",
]);

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  console.log("Router render:", { isAuthenticated, isLoading });

  // Save protected route path for redirect after login
  if (!isLoading && !isAuthenticated) {
    const path = location.split("?")[0];
    if (!PUBLIC_ROUTES.has(path) && path !== "/login" && !path.startsWith("/login")) {
      sessionStorage.setItem("toyx_redirect_after_login", location);
    }
  }

  // Check if user has completed onboarding from their profile (with localStorage fallback for migration)
  const hasCompletedOnboarding = (user as any)?.onboardingVersion >= 2 || localStorage.getItem('toyxOnboardingVersion') === '2';

  // Show loading screen while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-slate-950 dark:to-indigo-950">
        <LoadingLogo rotating />
      </div>
    );
  }

  // Render only one route configuration at a time to prevent double rendering
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/welcome" component={Welcome} />
        <Route path="/landing" component={Landing} />
        <Route path="/signup" component={Signup} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/data-deletion" component={DataDeletionPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/billing-success" component={BillingSuccess} />
        <Route path="/billing-cancel" component={BillingCancel} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/invite" component={Invite} />
        <Route path="/exchange-request" component={Landing} />
        <Route component={Welcome} />
      </Switch>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route path="/onboarding" component={Onboarding} />
        <Route component={Onboarding} />
      </Switch>
    );
  }

  return (
    <>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/list-toy" component={ListToyRoute} />
      <Route path="/search" component={Search} />
      <Route path="/toy/:id" component={ToyDetail} />
      <Route path="/toys/:id" component={ToyDetail} />
      <Route path="/chat/:exchangeId?" component={Chat} />
        <Route path="/profile" component={Profile} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/billing-success" component={BillingSuccess} />
        <Route path="/billing-cancel" component={BillingCancel} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/invite" component={Invite} />
        <Route path="/privacy-safety" component={PrivacySafety} />
        <Route path="/privacy/messages" component={PrivacyMessages} />
        <Route path="/privacy/messages/:id" component={PrivacyMessages} />
        <Route path="/admin/moderation" component={AdminModeration} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/data-deletion" component={DataDeletionPage} />
        <Route path="/support" component={SupportPage} />
      <Route path="/users/:userId" component={UserProfile} />
      <Route path="/exchange-request" component={ExchangeRequest} />
      <Route path="/loading-demo" component={LoadingDemo} />
      <Route component={NotFound} />
    </Switch>
    <ModerationMessageNotifier />
    </>
  );
}

function App() {
  // Capture intent from URL on every page load, before any routing checks
  useEffect(() => {
    const path = window.location.pathname;
    console.log("DEBUG: App Root checking path:", path);
    if (path.includes("list-toy")) {
      console.log("DEBUG: Captured /list-toy intent. Writing storage flag.");
      sessionStorage.setItem("toyx_pending_action", "list");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="toyx-ui-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
