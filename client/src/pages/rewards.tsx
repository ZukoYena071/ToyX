import { Link } from "wouter";
import { ArrowLeft, Coins, Gift, Zap, Plus, Star, Trophy, HelpCircle, Camera, RefreshCw, MessageSquare, Star as StarIcon, Users, Sparkles, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ListingSelectionModal from "@/components/toys/ListingSelectionModal";

const EARNING_RULES = [
  { icon: Camera, label: "List a quality toy", desc: "Include 2+ photos and a description (30+ chars)", points: 5, note: "Once daily, first publish only" },
  { icon: RefreshCw, label: "Complete an exchange", desc: "Both parties confirm the exchange", points: 50, note: "Per exchange" },
  { icon: MessageSquare, label: "Leave a review", desc: "Review your exchange partner after completion", points: 10, note: "Per review, must include text" },
  { icon: StarIcon, label: "Receive a 5-star review", desc: "5 stars with 30+ characters review text", points: 5, note: "Per rating" },
  { icon: Users, label: "Refer a friend", desc: "Friend completes their first exchange", points: 200, note: "Max 5 referrals/month" },
];

const FREE_REWARDS = [
  { key: "ADD_REQUESTS_1", label: "+1 Request Token", desc: "One extra outgoing exchange request", cost: 50, icon: Plus, tag: null },
  { key: "ADD_REQUESTS_5_30D", label: "+5 Requests", desc: "Extra 5 outgoing requests for 30 days", cost: 200, icon: Plus, tag: null },
  { key: "ADD_LISTINGS_5_30D", label: "+5 Listings", desc: "Extra 5 active listing slots for 30 days", cost: 250, icon: Plus, tag: null },
  { key: "BOOST_LISTING_LITE_48H", label: "Boost Listing Lite", desc: "Feature your toy for 48 hours (max 2 boosted)", cost: 300, icon: Zap, tag: null },
  { key: "PREMIUM_PASS_7D", label: "Premium Pass", desc: "Full premium access for 7 days (30-day cooldown)", cost: 1200, icon: Star, tag: null },
];

const PREMIUM_REWARDS = [
  { key: "BUMP_LISTING_8H", label: "Bump Listing", desc: "Refresh your listing to the top for 8 hours", cost: 80, icon: RefreshCw, tag: "Bump" },
  { key: "BOOST_LISTING_LITE_48H", label: "Boost Listing Lite", desc: "Feature your toy for 48 hours (max 2 boosted)", cost: 300, icon: Zap, tag: null },
  { key: "HIGHLIGHT_LISTING_3D", label: "Highlight Listing", desc: "Premium highlight for 3 days with extra visibility", cost: 450, icon: Sparkles, tag: "Hot" },
];

const PAID_BOOSTS = [
  { key: "boost_lite", label: "Boost Lite", desc: "Feature your toy for 24 hours", price: "R19", icon: Zap, hours: 24 },
  { key: "boost_plus", label: "Boost Plus", desc: "Boost visibility for 3 days", price: "R49", icon: Zap, hours: 72 },
  { key: "boost_max", label: "Boost Max", desc: "Maximum exposure for 7 days", price: "R99", icon: Sparkles, hours: 168 },
];

export default function Rewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewardData, setRewardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [storeTab, setStoreTab] = useState<"for-me" | "all">("for-me");
  const [payBoosting, setPayBoosting] = useState<string | null>(null);
  const [boostFlow, setBoostFlow] = useState<{ mode: "points" | "paid"; rewardKey?: string } | null>(null);

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards/me", { credentials: "include" });
      const data = await res.json();
      setRewardData(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleRedeem = async (rewardKey: string, toyId?: number) => {
    setRedeeming(rewardKey);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardType: rewardKey, toyId }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Redeemed!", description: "Reward activated successfully." });
        fetchRewards();
      } else {
        toast({ title: "Error", description: data.message || "Redemption failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to redeem", variant: "destructive" });
    }
    setRedeeming(null);
  };

  const handlePayBoost = async (boostType: string) => {
    setPayBoosting(boostType);
    try {
      const res = await fetch("/api/billing/paystack/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boostType, toyId: rewardData?.activeBoostedToys?.[0]?.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast({ title: "Error", description: data.message || "Payment initiation failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to start payment", variant: "destructive" });
    }
    setPayBoosting(null);
  };

  const isPremium = rewardData?.isPremium || false;
  const activeRewards = isPremium ? PREMIUM_REWARDS : FREE_REWARDS;

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title={isPremium ? "Premium Rewards" : "Rewards Store"}
        rightAction={
          <Link href="/profile">
            <button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </Link>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="text-center py-12"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <>
            {/* Balance card */}
            <div className={`rounded-2xl shadow-sm text-white ${isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-purple-500'}`}>
              <div className="p-6 text-center">
                {isPremium && <Shield className="w-6 h-6 mx-auto mb-1 opacity-80" />}
                <Coins className="w-10 h-10 mx-auto mb-2" />
                <div className="text-3xl font-bold">{rewardData?.pointsBalance || 0}</div>
                <div className="text-sm opacity-80">{isPremium ? "Premium Points" : "Points Available"}</div>
                <div className="text-xs opacity-60 mt-1">Lifetime: {rewardData?.pointsLifetime || 0} pts</div>
              </div>
            </div>

            {/* How to earn */}
            <SectionCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">How to Earn Points</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px] text-xs">
                    Points never expire. Redeem them for rewards in the store below.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                {EARNING_RULES.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                      <rule.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{rule.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{rule.desc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-green-500">+{rule.points}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{rule.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Store tabs */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setStoreTab("for-me")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${storeTab === "for-me" ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}`}
              >
                For Me
              </button>
              <button
                onClick={() => setStoreTab("all")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${storeTab === "all" ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}`}
              >
                All
              </button>
            </div>

            {/* Points store */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              {storeTab === "for-me" ? (isPremium ? "Premium Perks" : "Free Tier Rewards") : "All Rewards"}
            </h3>
            <div className="space-y-3">
              {(storeTab === "all" ? [...FREE_REWARDS, ...PREMIUM_REWARDS] : activeRewards).map((r) => {
                const canAfford = (rewardData?.pointsBalance || 0) >= r.cost;
                return (
                  <SectionCard key={r.key}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium && PREMIUM_REWARDS.includes(r) ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-purple-50 dark:bg-purple-900/30'}`}>
                        <r.icon className={`w-5 h-5 ${isPremium && PREMIUM_REWARDS.includes(r) ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">{r.label}</h4>
                          {r.tag && <Badge variant="default" className="text-[10px] px-1.5 py-0">{r.tag}</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const boostKeys = ["BOOST_LISTING_LITE_48H", "BUMP_LISTING_8H", "HIGHLIGHT_LISTING_3D"];
                          if (boostKeys.includes(r.key)) {
                            setBoostFlow({ mode: "points", rewardKey: r.key });
                          } else {
                            handleRedeem(r.key);
                          }
                        }}
                        disabled={redeeming === r.key || !canAfford}
                      >
                        {redeeming === r.key ? "..." : `${r.cost} pts`}
                      </Button>
                    </div>
                  </SectionCard>
                );
              })}
            </div>

            {/* Active boosted toys */}
            {rewardData?.activeBoostedToys?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Active Boosts</h3>
                {rewardData.activeBoostedToys.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{t.name}</div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">Boosted until {new Date(t.boostedUntil).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paid boosts */}
            <SectionCard>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Pay to Boost</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Skip the points — pay directly for instant boost.</p>
              <div className="space-y-2">
                {PAID_BOOSTS.map((b) => (
                  <div key={b.key} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <b.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{b.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{b.desc}</div>
                    </div>
                      <Button
                        size="sm"
                        onClick={() => setBoostFlow({ mode: "paid", rewardKey: b.key })}
                        disabled={payBoosting === b.key}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {payBoosting === b.key ? "..." : b.price}
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Recent ledger */}
            {rewardData?.recentLedger?.length > 0 && (
              <>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Recent Activity</h3>
                <div className="space-y-2">
                  {rewardData.recentLedger.slice(0, 10).map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{entry.eventType}</div>
                        <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className={`font-bold shrink-0 ${entry.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.points > 0 ? '+' : ''}{entry.points}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />

      <ListingSelectionModal
        open={!!boostFlow}
        onClose={() => setBoostFlow(null)}
        mode={boostFlow?.mode || "points"}
        onSelect={async (toyId) => {
          if (boostFlow?.mode === "points") {
            setBoostFlow(null);
            setRedeeming("BOOST_LISTING_LITE_48H");
            try {
              const res = await fetch(`/api/toys/${toyId}/boost/redeem`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hours: 48, costPoints: 300 }),
                credentials: "include",
              });
              const data = await res.json();
              if (data.ok) {
                toast({ title: "Boosted!", description: "Your toy is boosted for 48 hours." });
                fetchRewards();
              } else {
                toast({ title: "Error", description: data.message || "Failed to boost", variant: "destructive" });
              }
            } catch {
              toast({ title: "Error", description: "Failed to boost", variant: "destructive" });
            }
            setRedeeming(null);
          } else {
            setBoostFlow(null);
            setPayBoosting(boostFlow?.rewardKey || "boost_lite");
            try {
              const res = await fetch(`/api/toys/${toyId}/boost/paystack/init`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boostType: boostFlow?.rewardKey || "boost_lite" }),
                credentials: "include",
              });
              const data = await res.json();
              if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
              } else {
                toast({ title: "Error", description: data.message || "Failed to initiate payment", variant: "destructive" });
              }
            } catch {
              toast({ title: "Error", description: "Failed to initiate payment", variant: "destructive" });
            }
            setPayBoosting(null);
          }
        }}
      />
    </PageContainer>
  );
}
