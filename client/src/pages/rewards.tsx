import { Link } from "wouter";
import { ArrowLeft, Coins, Gift, Zap, Plus, Star, Trophy, HelpCircle, Camera, RefreshCw, MessageSquare, Star as StarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import LimitMeter from "@/components/ui/LimitMeter";

const EARNING_RULES = [
  { icon: Camera, label: "List a quality toy", desc: "Include 2+ photos and a description (30+ chars)", points: 5, note: "Once daily" },
  { icon: RefreshCw, label: "Complete an exchange", desc: "Successfully swap toys with another parent", points: 50, note: "Per exchange" },
  { icon: MessageSquare, label: "Leave a review", desc: "Review your exchange partner afterward", points: 10, note: "Per review" },
  { icon: StarIcon, label: "Receive a 5-star review", desc: "Your exchange partner rates you 5 stars", points: 10, note: "Per rating" },
  { icon: Users, label: "Refer a friend", desc: "Friend completes their first exchange", points: 200, note: "Per referral" },
];

const REWARDS = [
  { key: "BOOST_LISTING_48H", label: "Boost Listing 48h", desc: "Feature your toy for 48 hours", cost: 300, icon: Zap },
  { key: "ADD_REQUESTS_5_30D", label: "+5 Exchange Requests", desc: "Extra 5 outgoing requests for 30 days", cost: 200, icon: Plus },
  { key: "ADD_LISTINGS_5_30D", label: "+5 Toy Listings", desc: "Extra 5 active listing slots for 30 days", cost: 250, icon: Plus },
  { key: "PREMIUM_PASS_7D", label: "Premium Pass 7 Days", desc: "Full premium access for 7 days (30-day cooldown)", cost: 1200, icon: Star },
];

export default function Rewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewardData, setRewardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards/me", { credentials: "include" });
      const data = await res.json();
      setRewardData(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleRedeem = async (rewardKey: string) => {
    setRedeeming(rewardKey);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardType: rewardKey }),
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

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Rewards Store"
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
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="bg-purple-500 text-white rounded-2xl shadow-sm">
              <div className="p-6 text-center">
                <Coins className="w-10 h-10 mx-auto mb-2" />
                <div className="text-3xl font-bold">{rewardData?.pointsBalance || 0}</div>
                <div className="text-sm opacity-80">Points Available</div>
                <div className="text-xs opacity-60 mt-1">Lifetime: {rewardData?.pointsLifetime || 0} pts</div>
              </div>
            </div>

            {/* How to earn points */}
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

            {rewardData?.entitlements && (
              <SectionCard>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Your Limits</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Listings</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {rewardData.entitlements.isPremium ? "∞" : `10`}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Requests/mo</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {rewardData.entitlements.isPremium ? "∞" : `8`}
                    </div>
                  </div>
                </div>
                {rewardData.entitlements.hasPremiumPass && (
                  <Badge variant="default" className="mt-3">Premium Pass Active</Badge>
                )}
              </SectionCard>
            )}

            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Available Rewards</h3>
            <div className="space-y-3">
              {REWARDS.map((r) => (
                <SectionCard key={r.key}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <r.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">{r.label}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem(r.key)}
                      disabled={redeeming === r.key || (rewardData?.pointsBalance || 0) < r.cost}
                    >
                      {redeeming === r.key ? "..." : `${r.cost} pts`}
                    </Button>
                  </div>
                </SectionCard>
              ))}
            </div>

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
    </PageContainer>
  );
}
