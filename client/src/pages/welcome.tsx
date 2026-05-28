import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, MessageCircle } from "lucide-react";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import heroLight from "@/assets/welcome/hero-light.png";
import heroDark from "@/assets/welcome/hero-dark.png";

const FEATURES = [
  {
    icon: <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0"><Search className="w-5 h-5 text-white" /></div>,
    title: "Browse Toys",
    desc: "Discover amazing toys shared by families in your community",
  },
  {
    icon: <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0"><Plus className="w-5 h-5 text-white" /></div>,
    title: "Share Your Toys",
    desc: "List toys your children have outgrown for other families to enjoy",
  },
  {
    icon: <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-400 rounded-xl flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 text-white" /></div>,
    title: "Connect & Exchange",
    desc: "Chat with other parents and arrange safe toy exchanges",
  },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [referred, setReferred] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("pendingReferralRef", ref);
      setReferred(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <img src={toyxLogo} alt="ToyX" className="h-[200px] w-auto mx-auto mt-0 -mb-6" />

        {/* Accent line */}
        <p className="mt-0 text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
          Welcome to ToyX!
        </p>

        {referred && (
          <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl px-4 py-3 text-center text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
            🎉 You were invited to join ToyX! Complete your first exchange to unlock <strong>7 days of Premium</strong> ✨
          </div>
        )}

        {/* Main headline — gradient */}
        <h1
          className="
            mt-1 text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1] text-center
            pb-1
            bg-gradient-to-r from-purple-700 via-fuchsia-500 to-orange-500
            bg-clip-text text-transparent
          "
        >
          Share toys,<br />spread joy
        </h1>

        {/* Hero image */}
        <div className="mt-6 w-full max-w-md mx-auto rounded-3xl border border-gray-200/70 shadow-sm overflow-hidden bg-white dark:bg-gray-900/40 dark:border-white/10">
          <div className="aspect-[4/3] w-full">
            <img
              src={heroLight}
              alt="ToyX app preview"
              className="block dark:hidden w-full h-full object-cover object-[50%_35%]"
            />
            <img
              src={heroDark}
              alt="ToyX app preview"
              className="hidden dark:block w-full h-full object-cover object-[50%_35%]"
            />
          </div>
        </div>

        {/* Feature list grouped card */}
        <div className="mt-6 rounded-3xl border border-gray-200/70 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-gray-900/60 dark:backdrop-blur-xl">
          {FEATURES.map((f, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-gray-200/70 dark:border-white/10 mx-4" />}
              <div className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {f.icon}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{f.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => setLocation("/signup")}
          className="mt-6 w-full h-14 rounded-2xl bg-[color:var(--toyx-welcome-cta)] text-slate-900 text-base font-semibold shadow-sm active:brightness-95 hover:brightness-95 transition-all"
        >
          Get Started with ToyX
        </button>

        {/* Log in */}
        <div className="text-center mt-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Already have an account? </span>
          <button onClick={() => setLocation("/login")} className="text-sm font-semibold text-purple-600 hover:text-purple-700">
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
