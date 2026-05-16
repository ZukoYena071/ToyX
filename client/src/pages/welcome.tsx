import { useLocation } from "wouter";
import { Search, Plus, MessageCircle, ChevronRight } from "lucide-react";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import heroLight from "@/assets/welcome/hero-light.png";

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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 pt-10 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <img src={toyxLogo} alt="ToyX" className="h-9 w-auto mx-auto mt-6" />

        {/* Accent line */}
        <p className="mt-6 text-sm font-semibold text-purple-600 dark:text-purple-400 text-center">
          Welcome to ToyX!
        </p>

        {/* Main headline */}
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-50 text-center">
          Share toys,<br /> spread joy
        </h1>

        {/* Hero image */}
        <div className="mt-8 w-full max-w-md mx-auto p-6 rounded-3xl border border-gray-200/70 shadow-sm">
          <img src={heroLight} alt="ToyX app preview" className="w-full h-auto rounded-xl" />
        </div>

        {/* Feature list grouped card */}
        <div className="mt-6 rounded-3xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
          {FEATURES.map((f, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-gray-200/70 mx-4" />}
              <div className="flex items-start gap-3 px-4 py-4">
                {f.icon}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{f.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-0.5">{f.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
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
