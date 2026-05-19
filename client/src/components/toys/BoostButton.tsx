import { useState, useEffect } from "react";
import { Zap, Sparkles, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isToyBoosted, formatBoostTimeLeft, useNow } from "@/lib/boostUtils";

interface BoostButtonProps {
  toyId: number;
  isBoosted?: boolean;
  boostedUntil?: string | null;
  onSuccess?: () => void;
  variant?: "button" | "chip";
  disabled?: boolean;
  disabledReason?: string;
}

const PAID_PLANS = [
  { key: "boost_lite", label: "Boost Lite", price: "R19", hours: 24, desc: "24h feature" },
  { key: "boost_plus", label: "Boost Plus", price: "R49", hours: 72, desc: "3 day boost" },
  { key: "boost_max", label: "Boost Max", price: "R99", hours: 168, desc: "7 day max" },
];

export default function BoostButton({ toyId, isBoosted: _ignored, boostedUntil, onSuccess, variant = "button", disabled, disabledReason }: BoostButtonProps) {
  const { toast } = useToast();
  const now = useNow(60000);
  const active = isToyBoosted(boostedUntil);
  const timeLeft = formatBoostTimeLeft(boostedUntil);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (showMenu) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [showMenu]);

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

  if (active && variant === "chip") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
        <Zap className="w-3 h-3" />
        Boosted \u00b7 {timeLeft}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => {
          if (disabled) {
            toast({ title: "Boost unavailable", description: disabledReason || "Make this listing available to boost it.", variant: "destructive" });
            return;
          }
          setShowMenu(!showMenu);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px] ${
          disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700' :
          active
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700'
            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:bg-purple-500/20'
        }`}
      >
        <Zap className="w-3 h-3" />
        {disabled ? "Boost disabled" : (active ? `Boosted \u00b7 ${timeLeft}` : "Boost")}
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[100] rounded-t-2xl bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-hidden h-[85dvh]">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{active ? "Extend Boost" : "Boost"}</h3>
              <button onClick={() => setShowMenu(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+100px)]" style={{ WebkitOverflowScrolling: "touch" }}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Boost with Points</p>
              <button
                onClick={handlePointsBoost}
                disabled={loading === "points"}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors min-h-[48px] disabled:opacity-50 mb-3"
              >
                <Coins className="w-5 h-5 text-purple-500 shrink-0" />
                <span className="flex-1 text-left font-medium">Boost Lite 48h</span>
                <span className="text-xs font-semibold text-purple-500">300 pts</span>
              </button>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Pay to Boost</p>
              <div className="space-y-2">
                {PAID_PLANS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePayBoost(p.key, p.hours)}
                    disabled={loading === p.key}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] disabled:opacity-50"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-gray-400">{p.desc}</div>
                    </div>
                    <span className="text-sm font-semibold text-amber-500">{p.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
