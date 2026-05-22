import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import PageContainer from "@/components/ui/PageContainer";

function getSafeRedirect(fallback = "/"): string {
  const saved = sessionStorage.getItem("toyx_redirect_after_login");
  if (saved) {
    sessionStorage.removeItem("toyx_redirect_after_login");
    return saved;
  }
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (/https?:\/\//i.test(next)) return fallback;
  if (next === "/login" || next.startsWith("/login")) return fallback;
  return next;
}

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    loginEmail: '',
    loginPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("toyx_session_expired")) {
      sessionStorage.removeItem("toyx_session_expired");
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.loginEmail, password: formData.loginPassword }),
        credentials: "include",
      });
      if (res.ok) {
        setLocation(getSafeRedirect());
      } else {
        const err = await res.json();
        alert(err.message || "Login failed");
      }
    } catch (err) {
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "" }),
        credentials: "include",
      });
      if (res.ok) {
        setLocation(getSafeRedirect());
      } else {
        const err = await res.json();
        alert(err.message || "Login failed");
      }
    } catch (err) {
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer className="flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <Link href="/welcome">
          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="text-gray-500 dark:text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img src={toyxLogo} alt="ToyX Logo" className="h-28 w-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Log In</h2>
      </div>

      <div className="flex-1 px-8">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={formData.loginEmail}
              onChange={(e) => handleInputChange("loginEmail", e.target.value)}
              placeholder="Enter your email"
              className="min-h-[48px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-purple-500 hover:text-purple-600">
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.loginPassword}
                onChange={(e) => handleInputChange("loginPassword", e.target.value)}
                className="pr-12 min-h-[48px]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full text-base h-14 rounded-2xl mb-5"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Logging in...</span>
            </span>
          ) : 'Log In'}
        </Button>

        <div className="mb-5">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">
            Or continue with
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.location.href = "/api/auth/google"}
              className="min-w-[44px] min-h-[44px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

          </div>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-sm font-semibold text-purple-500 hover:text-purple-600">
            Sign up
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
