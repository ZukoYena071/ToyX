import { Switch, Route } from "wouter";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log("Router render:", { isAuthenticated, isLoading });

  // Check if user has completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('toyxOnboardingCompleted') === 'true';

  // Show loading screen while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render only one route configuration at a time to prevent double rendering
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/welcome" component={Welcome} />
        <Route path="/signup" component={Signup} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/billing-success" component={BillingSuccess} />
        <Route path="/billing-cancel" component={BillingCancel} />
        <Route path="/exchange-request" component={Landing} />
        <Route component={Landing} />
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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/toy/:id" component={ToyDetail} />
      <Route path="/toys/:id" component={ToyDetail} />
      <Route path="/chat/:exchangeId?" component={Chat} />
        <Route path="/profile" component={Profile} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/billing-success" component={BillingSuccess} />
        <Route path="/billing-cancel" component={BillingCancel} />
      <Route path="/users/:userId" component={UserProfile} />
      <Route path="/exchange-request" component={ExchangeRequest} />
      <Route path="/loading-demo" component={LoadingDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
