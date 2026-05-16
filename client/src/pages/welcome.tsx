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
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 pt-10 pb-10 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col">
        {/* Logo */}
        <div className="text-center mb-4">
          <img src={toyxLogo} alt="ToyX" className="h-16 w-auto mx-auto mb-4 drop-shadow-sm" />
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 tracking-wide">
            Welcome to ToyX!
          </p>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-50 text-center mb-6">
          Share toys,<br /> spread joy
        </h1>

        {/* Hero image */}
        <div className="w-full rounded-3xl overflow-hidden shadow-sm mb-6">
          <img src={heroLight} alt="ToyX app preview" className="w-full h-auto" />
        </div>

        {/* Feature list card */}
        <div className="rounded-3xl bg-white/80 dark:bg-gray-900/60 border border-gray-200/60 dark:border-white/10 shadow-sm backdrop-blur-sm p-2 mb-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              {f.icon}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => setLocation("/signup")}
          className="w-full h-14 rounded-2xl bg-[color:var(--toyx-welcome-cta)] text-slate-900 text-base font-semibold shadow-sm hover:brightness-95 active:brightness-90 transition-all"
        >
          Get Started with ToyX
        </button>

        {/* Secondary */}
        <div className="text-center mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Already have an account? </span>
          <button onClick={() => setLocation("/login")} className="text-sm font-semibold text-purple-500 hover:text-purple-600">
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
