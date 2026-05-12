import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "R0",
    period: "forever",
    color: "gray",
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
    color: "purple",
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
    color: "pink",
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
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/profile">
            <button className="w-8 h-8 flex items-center justify-center mr-3">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pricing</h1>
        </div>

        <div className="text-center mb-8">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Upgrade Your Experience
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Get more out of ToyX with unlimited listings and exchanges
          </p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border-2 transition-all ${
                plan.highlight
                  ? "bg-white dark:bg-gray-800 border-purple-400 dark:border-purple-500 shadow-lg shadow-purple-100 dark:shadow-purple-900/20"
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
              }`}
            >
              {plan.highlight && (
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full mb-3">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.planType ? (
                <Button
                  onClick={() => handleSubscribe(plan.planType)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl font-semibold ${
                    plan.highlight
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {loading === plan.planType ? "Redirecting..." : `Subscribe ${plan.planType}`}
                </Button>
              ) : (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
                  You're on the Free plan
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
