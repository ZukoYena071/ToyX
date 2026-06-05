import { useEffect, useState, useRef } from "react";
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
import FullscreenLoader from "@/components/ui/FullscreenLoader";
import PrivacySafety from "@/pages/privacy-safety";
import PrivacyMessages from "@/pages/privacy-messages";
import AdminModeration from "@/pages/admin-moderation";
import AdminFoundingMembers from "@/pages/admin-founding-members";
import FoundingFamilyHub from "@/pages/founding-family-hub";
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
  const [loadState, setLoadState] = useState<"loading" | "fading" | "ready">("loading");
  const startPerf = useRef(performance.now());
  const prefetched = useRef(false);

  console.log("Router render:", { isAuthenticated, isLoading });

  function preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(); img.onerror = () => resolve(); img.src = url; });
  }

  // When auth resolves: prefetch home data + above-the-fold images, then fade out
  useEffect(() => {
    if (isLoading || prefetched.current) return;
    prefetched.current = true;
    performance.mark("auth-resolved");

        const fade = () => {
      performance.mark("ready-to-fade");
      const remaining = Math.max(0, 500 - (performance.now() - startPerf.current));
      setTimeout(() => { performance.mark("fade-start"); setLoadState("fading"); }, remaining);
    };

    if (isAuthenticated) {
      const ref = localStorage.getItem("pendingReferralRef");
      if (ref) {
        fetch("/api/referrals/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: ref }), credentials: "include" })
          .then((res) => { if (!res.ok) console.warn("[referral] claim failed:", res.status, res.statusText); else localStorage.removeItem("pendingReferralRef"); })
          .catch((err) => console.warn("[referral] claim network error:", err));
      }
      // Only prefetch the critical toys query — recommendations and favorites
      // load naturally via useQuery on the Home page (they're secondary content)
      const pfStart = performance.now();
      queryClient.prefetchQuery({ queryKey: ["/api/toys"] }).then(() => {
        performance.mark("prefetch-done");
        performance.measure("prefetch-duration", { start: pfStart, end: "prefetch-done" });
        const toysData = queryClient.getQueryData(["/api/toys"]);
        const urls = (Array.isArray(toysData) ? toysData : []).slice(0, 6).map((t: any) => t.imageUrls?.[0]).filter(Boolean);
        const imgStart = performance.now();
        (urls.length > 0
          ? Promise.race([Promise.all(urls.map(preloadImage)), new Promise<void>(r => setTimeout(r, 3000))])
          : Promise.resolve()
        ).then(() => {
          performance.mark("images-done");
          performance.measure("image-preload-duration", { start: imgStart, end: "images-done" });
          fade();
        });
      }).catch(() => fade());
    } else {
      fade();
    }
  }, [isLoading, isAuthenticated]);

  // Log performance summary once app is ready
  useEffect(() => {
    if (loadState !== "ready") return;
    setTimeout(() => {
      const nav = performance.getEntriesByType("navigation")[0] as any;
      const authMs = performance.measure("auth-ms", { start: 0, end: "auth-resolved" }).duration;
      const prefetchMs = (performance.getEntriesByName("prefetch-duration")[0] as any)?.duration;
      const imgMs = (performance.getEntriesByName("image-preload-duration")[0] as any)?.duration;
      const totalToFade = performance.now() - startPerf.current;
      const res = (name: string) => {
        const e = performance.getEntriesByType("resource").find((r: any) => r.name.includes(name)) as any;
        if (!e) return "";
        return `TTFB=${(e.responseStart - e.requestStart).toFixed(0)}ms | download=${(e.responseEnd - e.responseStart).toFixed(0)}ms | total=${e.duration.toFixed(0)}ms | size=${(e.transferSize || 0).toFixed(0)}B`;
      };
      console.log(`╔══════════════════════════════════════════════════════╗`);
      console.log(`║           STARTUP PERFORMANCE REPORT               ║`);
      console.log(`╚══════════════════════════════════════════════════════╝`);
      if (nav) {
        console.log(`  Page load:      ${(nav.loadEventEnd - nav.startTime).toFixed(0)}ms`);
        console.log(`    TTFB:         ${(nav.responseStart - nav.requestStart).toFixed(0)}ms`);
        console.log(`    DOM content:  ${(nav.domContentLoadedEventEnd - nav.startTime).toFixed(0)}ms`);
      }
      console.log(`  Auth resolve:   ${authMs.toFixed(0)}ms`);
      console.log(`    ${res("/api/auth/user")}`);
      if (prefetchMs != null) {
        console.log(`  Toys prefetch:  ${prefetchMs.toFixed(0)}ms`);
        console.log(`    ${res("/api/toys")}`);
      }
      if (imgMs != null) console.log(`  Image preload:  ${imgMs.toFixed(0)}ms`);
      console.log(`  App mount→fade: ${totalToFade.toFixed(0)}ms`);
      console.log(`──`);
      console.log(`Total page resources: ${performance.getEntriesByType("resource").length}`);
      console.log(`Largest Contentful Paint: check DevTools → Performance`);
      performance.clearMeasures();
      performance.clearMarks();
    }, 1500);
  }, [loadState]);

  // After fade animation, mark ready and log performance summary
  useEffect(() => {
    if (loadState === "fading") {
      performance.mark("loader-fade-start");
      const t = setTimeout(() => {
        performance.mark("app-ready");
        setLoadState("ready");
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loadState]);

  // Manage inline splash (index.html) — keeps it visible during loading, fades on ready
  useEffect(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    if (loadState === "fading") {
      splash.style.transition = "opacity 0.5s";
      splash.style.opacity = "0";
    }
    if (loadState === "ready") {
      splash.remove();
    }
  }, [loadState]);

  // Save protected route path for redirect after login
  if (!isLoading && !isAuthenticated) {
    const path = location.split("?")[0];
    if (!PUBLIC_ROUTES.has(path) && path !== "/login" && !path.startsWith("/login")) {
      sessionStorage.setItem("toyx_redirect_after_login", location);
    }
  }

  // Check if user has completed onboarding from their profile (with localStorage fallback for migration)
  const hasCompletedOnboarding = (user as any)?.onboardingVersion >= 2 || localStorage.getItem('toyxOnboardingVersion') === '2';

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

  // Waitlist users see the Founding Family Hub instead of the marketplace home
  // but listing a toy temporarily shows the home page with the upload modal
  // (user is cast because useAuth returns untyped API response — see useAuth.ts)
  const u = user as any;
  const listingMode = sessionStorage.getItem("toyx_pending_action") === "list" || new URLSearchParams(location.split("?")[1]).has("list-toy");
  const HomeComponent = listingMode || u?.accessStatus !== "waitlist" ? Home : FoundingFamilyHub;

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
      <Route path="/" component={HomeComponent} />
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
        <Route path="/hub" component={FoundingFamilyHub} />
        <Route path="/admin/moderation" component={AdminModeration} />
        <Route path="/admin/founding-members" component={AdminFoundingMembers} />
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
