import { useState, useEffect } from "react";
import { Link } from "wouter";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import PageContainer from "@/components/ui/PageContainer";

export default function Signup() {
  const [providers, setProviders] = useState<{ google: boolean; facebook: boolean }>({ google: true, facebook: true });

  useEffect(() => {
    fetch("/api/auth/providers", { credentials: "include" })
      .then(r => r.json())
      .then(data => setProviders(data))
      .catch(() => {});
  }, []);

  return (
    <PageContainer className="flex flex-col">
      <div className="flex items-center justify-between px-6 pt-12 pb-8">
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
          <img src={toyxLogo} alt="ToyX Logo" className="h-48 w-auto" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Join ToyX</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-8">
          Sign in securely with Google or Facebook to start swapping toys.
        </p>
      </div>

      <div className="flex-1 px-8">
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = "/api/auth/google"}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[48px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
          </button>

          {providers.facebook && (
            <button
              onClick={() => window.location.href = "/api/auth/facebook"}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[48px]"
            >
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Facebook</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="text-center mt-8">
          <span className="text-sm text-gray-500 dark:text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-sm font-semibold text-purple-500 hover:text-purple-600">
            Log in
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
