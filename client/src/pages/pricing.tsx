import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, Sparkles } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";

const plans = [
  {
    name: "Free",
    price: "R0",
    period: "forever",
    features: [
      "Up to 5 active toy listings",
      "Up to 3 exchange requests/month",
      "Up to 2 active exchanges",
      "Basic search & filters",
      "Community access",
    ],
    highlight: false,
  },
  {
    name: "Premium Monthly",
    price: "R89",
    period: "/month",
    features: [
      "Unlimited toy listings",
      "Unlimited exchange requests",
      "Unlimited active exchanges",
      "Priority support",
      "Advanced search & filters",
      "Early access to new features",
    ],
    highlight: true,
    planType: "monthly" as const,
  },
  {
    name: "Premium Yearly",
    price: "R449",
    period: "/year",
    features: [
      "Everything in Monthly",
      "Save 58% vs monthly",
      "Exclusive badges",
      "Featured listings",
      "Analytics dashboard",
    ],
    highlight: false,
    planType: "yearly" as const,
  },
];

export default function Pricing() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: "monthly" | "yearly") => {
    setLoading(planType);
    try {
      const res = await fetch("/api/billing/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast({ title: "Error", description: data.message || "Failed to initialize payment", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to payment service", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <PageContainer>
      <div className="px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/profile">
            <button className="w-8 h-8 flex items-center justify-center mr-3 min-h-[44px] min-w-[44px]">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Pricing</h1>
        </div>

        <div className="text-center mb-8">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Upgrade Your Experience</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Get more out of ToyX with unlimited listings and exchanges</p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border-2 transition-all ${
                plan.highlight
                  ? "bg-white dark:bg-gray-900 border-purple-400 dark:border-purple-500 shadow-sm"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.highlight && (
                <div className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full mb-3">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">{plan.name}</h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.planType ? (
                <Button
                  onClick={() => handleSubscribe(plan.planType)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl font-semibold min-h-[44px] ${
                    plan.highlight
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {loading === plan.planType ? "Redirecting..." : `Subscribe ${plan.planType}`}
                </Button>
              ) : (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">You're on the Free plan</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
