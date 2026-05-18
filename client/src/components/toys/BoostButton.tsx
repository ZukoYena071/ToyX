import { useState } from "react";
import { Zap, Sparkles, Coins, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BoostButtonProps {
  toyId: number;
  isBoosted?: boolean;
  boostedUntil?: string | null;
  onSuccess?: () => void;
}

const PAID_PLANS = [
  { key: "boost_lite", label: "Boost Lite", price: "R19", hours: 24, desc: "24h feature" },
  { key: "boost_plus", label: "Boost Plus", price: "R49", hours: 72, desc: "3 day boost" },
  { key: "boost_max", label: "Boost Max", price: "R99", hours: 168, desc: "7 day max" },
];

export default function BoostButton({ toyId, isBoosted, boostedUntil, onSuccess }: BoostButtonProps) {
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePointsBoost = async () => {
    setLoading("points");
    try {
      const res = await fetch(`/api/toys/${toyId}/boost/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: 48, costPoints: 300 }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Boosted!", description: "Your toy is now featured for 48 hours." });
        setShowMenu(false);
        onSuccess?.();
      } else {
        toast({ title: "Error", description: data.message || "Failed to boost", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to boost", variant: "destructive" });
    }
    setLoading(null);
  };

  const handlePayBoost = async (boostType: string, hours: number) => {
    setLoading(boostType);
    try {
      const res = await fetch(`/api/toys/${toyId}/boost/paystack/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boostType }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast({ title: "Error", description: data.message || "Payment failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to initiate payment", variant: "destructive" });
    }
    setLoading(null);
  };

  const remainingTime = boostedUntil ? Math.max(0, Math.floor((new Date(boostedUntil).getTime() - Date.now()) / 3600000)) : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] ${
          isBoosted
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700'
            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:bg-purple-500/20'
        }`}
      >
        <Zap className="w-3 h-3" />
        {isBoosted ? `Boosted (${remainingTime}h)` : "Boost"}
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-10 z-50 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              {isBoosted ? "Extend Boost" : "Boost with Points"}
            </div>
            <button
              onClick={handlePointsBoost}
              disabled={loading === "points"}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] disabled:opacity-50"
            >
              <Coins className="w-4 h-4 text-purple-500" />
              <span className="flex-1 text-left">Boost Lite 48h</span>
              <span className="text-xs font-medium text-purple-500">300 pts</span>
            </button>
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">Pay to Boost</div>
            {PAID_PLANS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePayBoost(p.key, p.hours)}
                disabled={loading === p.key}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="flex-1 text-left">{p.label}</span>
                <span className="text-xs text-gray-400">{p.desc}</span>
                <span className="text-xs font-medium text-amber-500">{p.price}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
