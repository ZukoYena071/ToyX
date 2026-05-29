import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Copy, Check, Users, Share2, ChevronRight, PartyPopper, Sparkles, TrendingUp, Clock } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function ReferralProgress({ stats }: { stats: any }) {
  const completed = stats?.monthlyQualified || 0;
  const limit = stats?.monthlyLimit || 5;
  const pct = Math.min((completed / limit) * 100, 100);

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Your Progress</h3>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>Completed Referrals</span>
          <span>{completed} of {limit} this month</span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-purple-600 dark:text-purple-300">{stats?.totalQualified || 0}</p>
          <p className="text-[10px] text-purple-500/70 dark:text-purple-400/70">Completed</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-600 dark:text-amber-300">{stats?.totalPending || 0}</p>
          <p className="text-[10px] text-amber-500/70 dark:text-amber-400/70">Pending</p>
        </div>
      </div>
      {(stats?.pointsFromReferrals > 0 || stats?.premiumDaysFromReferrals > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          {stats.premiumDaysFromReferrals > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">✨ Premium Days Earned</span>
              <span className="font-semibold text-purple-600 dark:text-purple-300">{stats.premiumDaysFromReferrals}d</span>
            </div>
          )}
          {stats.pointsFromReferrals > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">🎁 Points Earned</span>
              <span className="font-semibold text-amber-600 dark:text-amber-300">{stats.pointsFromReferrals.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function ShareCard({ inviteLink }: { inviteLink: string | null }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = inviteLink ? `${window.location.origin}${inviteLink}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with friends." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = () => {
    if (typeof navigator.share === "function") {
      navigator.share({ title: "Join ToyX!", text: "Swap toys with your community! Use my invite link:", url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Share your invite link</h3>
      <div className="flex gap-2 mb-2">
        <input readOnly value={url || "Loading..."} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700 truncate" />
        <Button size="sm" onClick={copyLink}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
      </div>
      {typeof navigator.share === "function" && (
        <button onClick={shareLink} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl py-2.5 active:opacity-70">
          <Share2 className="w-3.5 h-3.5" /> Share with friends
        </button>
      )}
    </SectionCard>
  );
}

function ReferralList({ referrals, status, emptyMessage }: { referrals: any[]; status: string; emptyMessage: string }) {
  const filtered = referrals.filter(r => r.status === status);
  if (filtered.length === 0) return null;

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
        {status === "qualified" ? <PartyPopper className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
        <span>{status === "qualified" ? "Completed Referrals" : "Waiting for First Swap"}</span>
        <span className="text-xs font-normal text-gray-400 ml-auto">{filtered.length}</span>
      </h3>
      <div className="space-y-2">
        {filtered.map((ref: any) => (
          <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-300">
                  {(ref.refereeName || ref.refereeEmail || "F")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{ref.refereeName || ref.refereeEmail || "Friend"}</p>
                <p className="text-[11px] text-gray-400">{status === "qualified" ? "Completed their first swap" : `Joined ${timeAgo(ref.createdAt)}`}</p>
              </div>
            </div>
            {status === "qualified" && <Check className="w-4 h-4 text-green-500 shrink-0" />}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <Share2 className="w-5 h-5" />, title: "Share your link", desc: "Send your invite link to friends and family" },
    { icon: <Users className="w-5 h-5" />, title: "Friend joins ToyX", desc: "They sign up and join the community" },
    { icon: <Gift className="w-5 h-5" />, title: "Complete a swap", desc: "They finish their first exchange — both earn rewards!" },
  ];

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">How It Works</h3>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 text-purple-500">{s.icon}</div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-purple-500">{i + 1}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{s.title}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function Invite() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/referrals/me", { credentials: "include" })
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const refs = data?.referrals || [];

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Invite & Earn"
        rightAction={
          <Link href="/profile">
            <button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </Link>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Section 1: Hero Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-90" />
            <h2 className="text-lg font-bold mb-1">Invite Friends. Grow the ToyX Community.</h2>
            <p className="text-sm opacity-90 leading-relaxed">Earn points and Premium rewards when friends complete their first successful swap.</p>
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold">🎁 200</p>
                <p className="text-[11px] opacity-80">points per friend</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-xl font-bold">✨ 7d</p>
                <p className="text-[11px] opacity-80">Premium per friend</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Progress Card */}
        {data?.stats && <ReferralProgress stats={data.stats} />}

        {/* Section 3: Share Link Card */}
        <ShareCard inviteLink={data?.inviteLink} />

        {/* Section 4: Pending Referrals */}
        {refs.length > 0 && <ReferralList referrals={refs} status="pending" emptyMessage="No pending referrals yet" />}

        {/* Section 5: Completed Referrals */}
        {refs.length > 0 && <ReferralList referrals={refs} status="qualified" emptyMessage="No completed referrals yet" />}

        {/* Section 6: How It Works */}
        <HowItWorks />

        {/* Empty state */}
        {refs.length === 0 && (
          <SectionCard>
            <div className="text-center py-4">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Share your link to get started</p>
            </div>
          </SectionCard>
        )}
      </div>

      <BottomNav />
    </PageContainer>
  );
}
