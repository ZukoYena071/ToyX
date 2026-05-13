import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Sparkles, Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  subtitle: string;
  illustration: string;
}

const STEPS: Step[] = [
  {
    id: "discover",
    title: "Discover Amazing Toys",
    subtitle: "Browse thousands of toys shared by families in your community",
    illustration: "🔍",
  },
  {
    id: "share",
    title: "Share Your Toys",
    subtitle: "List toys your kids have outgrown and give them a second life",
    illustration: "🎁",
  },
  {
    id: "exchange",
    title: "Exchange & Connect",
    subtitle: "Chat with other parents and arrange safe toy exchanges",
    illustration: "🔄",
  },
  {
    id: "sustainable",
    title: "Sustainable & Smart",
    subtitle: "Reduce waste, save money, and make other kids happy",
    illustration: "🌱",
  },
];

export default function Onboarding() {
  const { toast } = useToast();
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("toyxOnboardingStep");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step < STEPS.length) {
      localStorage.setItem("toyxOnboardingStep", String(step));
    }
  }, [step]);

  const complete = () => {
    localStorage.setItem("toyxOnboardingVersion", "2");
    localStorage.removeItem("toyxOnboardingStep");
    window.location.href = "/";
  };

  const handlePremium = async (planType: "monthly" | "yearly") => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        localStorage.setItem("toyxOnboardingVersion", "2");
        localStorage.removeItem("toyxOnboardingStep");
        window.location.href = data.authorizationUrl;
      } else {
        toast({ title: "Error", description: data.message || "Failed to initialize payment", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to payment service", variant: "destructive" });
    }
    setLoading(false);
  };

  // Steps 1-4
  if (step < STEPS.length) {
    const s = STEPS[step];
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={complete}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 min-h-[44px] px-4"
          >
            Skip
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-purple-500' : i < step ? 'w-2 bg-purple-300' : 'w-2 bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-7xl mb-8">{s.illustration}</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 text-center mb-3">
            {s.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed max-w-xs">
            {s.subtitle}
          </p>
        </div>

        {/* Continue */}
        <div className="px-8 pb-12">
          <button
            onClick={() => setStep(step + 1)}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors min-h-[44px]"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 5 — Premium
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col px-8 pt-16">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">Go Premium</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Unlock unlimited listings and exchanges. Upgrade anytime.
          </p>
        </div>

        {/* Welcome bonus */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6 text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            🎉 Earn +100 points when you complete your first exchange!
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 border-purple-400 dark:border-purple-500 p-5 text-center">
            <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2">Monthly</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">R89</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">per month</p>
            <ul className="space-y-1.5 text-left">
              {["Unlimited listings", "Unlimited requests", "Priority support"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePremium("monthly")}
              disabled={loading}
              className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Start Premium"}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Yearly</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">R449</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">per year</p>
            <ul className="space-y-1.5 text-left">
              {["Everything in Monthly", "Save 58%", "Exclusive badges"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePremium("yearly")}
              disabled={loading}
              className="w-full mt-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {loading ? "Please wait..." : "Start Premium"}
            </button>
          </div>
        </div>
      </div>

      {/* Continue with Free */}
      <div className="px-8 pb-12">
        <button
          onClick={complete}
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Continue with Free
        </button>
      </div>
    </div>
  );
}
