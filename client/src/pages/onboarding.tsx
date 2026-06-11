import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, Gift, Sparkles } from "lucide-react";
import OnboardingIllustration from "@/components/ui/OnboardingIllustration";

interface StepData {
  title: string;
  subtitle: string;
  micro: string;
}

const STEPS: StepData[] = [
  {
    title: "Turn old toys into new smiles",
    subtitle:
      'Swap toys your kids have outgrown for "new-to-them" surprises from parents near you',
    micro: "No addresses shown \u2022 In-app chat \u2022 Reviews after swaps",
  },
  {
    title: "List a toy in under a minute",
    subtitle:
      "Snap a few photos, choose the age range & condition, and watch requests come in",
    micro: "Tip: Listings with 2+ photos get 3x more requests",
  },
  {
    title: "Discover toys nearby",
    subtitle:
      "Filter by age, category & distance to find the perfect match for your child",
    micro: "Durban \u2022 Johannesburg \u2022 Cape Town \u2022 Pretoria",
  },
  {
    title: "Request, chat & swap safely",
    subtitle:
      "Message other parents, agree on a public meetup, and exchange when ready",
    micro: "Safety tips built-in \u00B7 Report anything suspicious",
  },
];

const CONTENT_VARIANTS = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

const ILLO_VARIANTS = {
  enter: { opacity: 0, scale: 0.96 },
  center: { opacity: 1, scale: 1 },
};

const TOTAL_STEPS = STEPS.length + 1; // 4 content + 1 premium

export default function Onboarding() {
  const { toast } = useToast();
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("toyxOnboardingStep");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly"
  );

  useEffect(() => {
    if (step < STEPS.length) {
      localStorage.setItem("toyxOnboardingStep", String(step));
    }
  }, [step]);

  const complete = async () => {
    try {
      await fetch("/api/users/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onboardingVersion: 2 }), credentials: "include" });
    } catch (e) {
      console.warn("onboarding PATCH failed, but continuing:", e);
    }
    localStorage.removeItem("toyxOnboardingStep");
    // Use a timeout to ensure the PATCH has time to persist before navigating
    setTimeout(() => { window.location.href = "/"; }, 100);
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
        await fetch("/api/users/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onboardingVersion: 2 }), credentials: "include" }).catch(() => {});
        localStorage.removeItem("toyxOnboardingStep");
        window.location.href = data.authorizationUrl;
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to initialize payment",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to payment service",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  /* ---------- Steps 1-4 ---------- */
  if (step < STEPS.length) {
    const s = STEPS[step];
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/10 dark:bg-pink-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-4 relative z-10">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${
              step === 0 ? "invisible" : ""
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={complete}
            className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] px-2"
          >
            Skip
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-4 relative z-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 24 : 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`h-2 rounded-full ${
                i <= step
                  ? "bg-purple-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`illo-${step}`}
              variants={ILLO_VARIANTS}
              initial="enter"
              animate="center"
              transition={{ duration: 0.45, delay: 0.08 }}
              className="w-full"
            >
              <OnboardingIllustration stepIndex={step} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${step}`}
              variants={CONTENT_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="w-full"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mt-10">
                {s.title}
              </h1>
              <p className="text-base text-center text-gray-500 dark:text-gray-400 mt-2 leading-relaxed px-2">
                {s.subtitle}
              </p>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3 leading-relaxed px-4">
                {s.micro}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <div className="mt-auto pb-8 pt-6 px-6 w-full relative z-10">
          <motion.button
            onClick={() => setStep(step + 1)}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl py-3.5 text-base font-semibold min-h-[52px] flex items-center justify-center shadow-lg shadow-purple-500/25 transition-all"
          >
            Continue
          </motion.button>
        </div>
      </div>
    );
  }

  /* ---------- Step 5 — Premium ---------- */
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/10 dark:bg-pink-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Back + progress */}
      <div className="flex flex-col items-center px-6 pt-4 relative z-10">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setStep(step - 1)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="w-[44px]" />
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 24 : 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`h-2 rounded-full ${
                i <= step
                  ? "bg-purple-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-10 relative z-10">
        {/* Title */}
        <div className="text-center mb-4">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
            Unlock ToyX Premium
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
            Swap without limits. Cancel anytime.
          </p>
        </div>

        {/* Welcome points banner */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-6">
          <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
            <Gift className="w-4 h-4 shrink-0" />
            Earn +100 points when you complete your first exchange!
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Monthly */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedPlan("monthly")}
            className={`rounded-2xl p-5 text-center relative transition-all ${
              selectedPlan === "monthly"
                ? "bg-white dark:bg-gray-900 border-2 border-purple-500 shadow-sm"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Monthly
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              R89
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
              /month
            </p>
            <ul className="space-y-1.5 text-left">
              {[
                "Unlimited listings",
                "Unlimited requests",
                "Priority support",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                >
                  <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.button>

          {/* Yearly */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedPlan("yearly")}
            className={`rounded-2xl p-5 text-center relative transition-all ${
              selectedPlan === "yearly"
                ? "bg-white dark:bg-gray-900 border-2 border-purple-500 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-950 shadow-sm"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* Best Value badge */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm">
              Best Value
            </span>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Yearly
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              R449
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
              /year
            </p>
            <ul className="space-y-1.5 text-left">
              {[
                "Everything in Monthly",
                "Save 58%",
                "Exclusive badges",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                >
                  <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.button>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-6 pb-8 pt-2 relative z-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePremium(selectedPlan)}
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl py-3.5 text-base font-semibold min-h-[52px] flex items-center justify-center shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : selectedPlan === "yearly"
            ? "Start Premium (Save 58%)"
            : "Start Premium"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={complete}
          className="w-full border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-3.5 text-base font-semibold min-h-[52px] flex items-center justify-center mt-3 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
        >
          Continue with Free
        </motion.button>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[36px]">
            Terms
          </button>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <button className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[36px]">
            Privacy
          </button>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <button className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[36px]">
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}
