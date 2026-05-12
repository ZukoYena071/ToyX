import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Coins, Gift, Zap, Plus, Star, Trophy } from "lucide-react";
import BottomNav from "@/components/bottom-nav";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto flex items-center space-x-3">
          <Link href="/profile"><button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button></Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Rewards Store</h1>
        </div>
      </div>
      <div className="max-w-sm mx-auto p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-6">
              <CardContent className="p-6 text-center">
                <Coins className="w-10 h-10 mx-auto mb-2" />
                <div className="text-3xl font-bold">{rewardData?.pointsBalance || 0}</div>
                <div className="text-sm opacity-80">Points Available</div>
                <div className="text-xs opacity-60 mt-1">Lifetime: {rewardData?.pointsLifetime || 0} pts</div>
              </CardContent>
            </Card>

            {rewardData?.entitlements && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3 text-sm">Your Limits</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                      <div className="text-gray-500 dark:text-gray-400">Listings</div>
                      <div className="font-bold text-gray-800 dark:text-white">
                        {rewardData.entitlements.isPremium ? "∞" : `10`}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                      <div className="text-gray-500 dark:text-gray-400">Requests/mo</div>
                      <div className="font-bold text-gray-800 dark:text-white">
                        {rewardData.entitlements.isPremium ? "∞" : `8`}
                      </div>
                    </div>
                  </div>
                  {rewardData.entitlements.hasPremiumPass && (
                    <Badge className="mt-3 bg-purple-100 text-purple-700">Premium Pass Active</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Available Rewards</h3>
            <div className="space-y-3 mb-6">
              {REWARDS.map((r) => (
                <Card key={r.key}>
                  <CardContent className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                      <r.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm">{r.label}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem(r.key)}
                      disabled={redeeming === r.key || (rewardData?.pointsBalance || 0) < r.cost}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      {redeeming === r.key ? "..." : `${r.cost} pts`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {rewardData?.recentLedger?.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {rewardData.recentLedger.slice(0, 10).map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-white">{entry.eventType}</div>
                        <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className={`font-bold ${entry.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
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
    </div>
  );
}
