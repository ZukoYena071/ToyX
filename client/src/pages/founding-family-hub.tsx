import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Users, Gift, MapPin, CheckCircle, Target, Share2, Sparkles, TrendingUp, Star, Copy, Check } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

const FAMILIES_TARGET = 100;
const LISTINGS_TARGET = 500;

function HeroSection({ data, fm }: { data: any; fm: any }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white p-8 sm:p-10">
      {/* Decorative shapes */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-xl" />
      <div className="absolute top-20 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg" />
      <div className="absolute -bottom-8 right-20 w-32 h-32 bg-white/5 rounded-full blur-lg" />
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Founding Family</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-3">
            Welcome to the<br />ToyX Family 🎉
          </h1>
          <p className="text-base sm:text-lg opacity-90 leading-relaxed max-w-lg">
            You're helping build South Africa's first toy exchange community. Share toys, invite friends and help us launch something special.
          </p>
          {fm && (
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 mt-5">
              <span className="text-sm opacity-80">Member Number</span>
              <span className="text-3xl font-black tracking-tight">#{fm.memberNumber || "—"}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 hidden sm:flex items-center justify-center w-40 h-40 bg-white/10 rounded-3xl backdrop-blur-sm">
          <span className="text-7xl">🧸</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sub }: { icon: string; value: number | string; label: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-green-600 dark:text-green-400 font-medium">{sub}</p>}
    </div>
  );
}

function MilestoneCard({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
        {done ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
      </div>
      <span className={`text-sm font-medium ${done ? 'text-gray-900 dark:text-gray-50' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
    </div>
  );
}

export default function FoundingFamilyHub() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [refData, setRefData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/me/hub", { credentials: "include" }).then(r => r.json()),
      fetch("/api/referrals/me", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]).then(([hub, ref]) => {
      setData(hub);
      setRefData(ref);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Loading your hub…</p>
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">Could not load hub data.</p>
      </PageContainer>
    );
  }

  const fm = data.foundingMember;
  const community = data.community || { totalFamilies: 0, totalListings: 0, citiesRepresented: 0 };
  const familiesPct = Math.min((community.totalFamilies / FAMILIES_TARGET) * 100, 100);
  const listingsPct = Math.min((community.totalListings / LISTINGS_TARGET) * 100, 100);

  const profileChecks = [
    { label: "Complete your profile", done: data.profileCompletion >= 80 },
    { label: "Verify your email", done: data.emailVerified },
    { label: "List 3 toys", done: (data.toyCount || 0) >= 3 },
    { label: "Refer a friend", done: (data.referralCount || 0) >= 1 },
  ];
  const profileDone = profileChecks.filter(c => c.done).length;

  const inviteUrl = refData?.inviteLink ? `${window.location.origin}${refData.inviteLink}` : "";
  const pointsBalance = refData?.stats?.pointsFromReferrals || 0;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with friends." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = () => {
    if (typeof navigator.share === "function") {
      navigator.share({ title: "Join ToyX!", text: "Swap toys with your community! Use my invite link:", url: inviteUrl }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <PageContainer className="bg-gradient-to-b from-violet-50/30 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="px-4 pt-6 pb-28 space-y-6 max-w-lg mx-auto">

        {/* Hero */}
        <HeroSection data={data} fm={fm} />

        {/* Community Growth */}
        <SectionCard className="rounded-3xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">Community Growth</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">See how the ToyX family is growing.</p>
          <div className="grid gap-4">
            <StatCard icon="👪" value={community.totalFamilies} label="Founding Families" sub={community.totalFamilies > 0 ? `↑ ${community.totalFamilies} total` : undefined} />
            <StatCard icon="🧸" value={community.totalListings} label="Toys Listed" sub={community.totalListings > 0 ? `↑ ${community.totalListings} total` : undefined} />
            <StatCard icon="🏙️" value={community.citiesRepresented} label="Cities Represented" sub={community.citiesRepresented > 0 ? `↑ ${community.citiesRepresented} cities` : undefined} />
          </div>
        </SectionCard>

        {/* Launch Progress */}
        <SectionCard className="rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-violet-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Launch Progress</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">The more we grow together, the sooner we launch.</p>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Founding Families</span>
                <span>{community.totalFamilies} / {FAMILIES_TARGET} ({Math.round(familiesPct)}%)</span>
              </div>
              <Progress value={familiesPct} className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500 [&>div]:rounded-full [&>div]:transition-all [&>div]:duration-700" />
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Toys Listed</span>
                <span>{community.totalListings} / {LISTINGS_TARGET} ({Math.round(listingsPct)}%)</span>
              </div>
              <Progress value={listingsPct} className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500 [&>div]:rounded-full [&>div]:transition-all [&>div]:duration-700" />
            </div>
          </div>
        </SectionCard>

        {/* Beta Qualification */}
        <SectionCard className="rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Beta Qualification</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Complete goals to help the community grow.</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{profileDone} of {profileChecks.length} goals</span>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{Math.round((profileDone / profileChecks.length) * 100)}%</span>
          </div>
          <Progress value={(profileDone / profileChecks.length) * 100} className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500 [&>div]:rounded-full [&>div]:transition-all [&>div]:duration-700" />
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {profileChecks.map((c, i) => <MilestoneCard key={i} done={c.done} label={c.label} />)}
          </div>
        </SectionCard>

        {/* Referral Card */}
        {inviteUrl && (
          <SectionCard className="rounded-3xl p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border-violet-100 dark:border-violet-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">Invite Friends, Earn Rewards</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Earn points and move closer to beta access.</p>
            <div className="flex gap-2 mb-3">
              <input readOnly value={inviteUrl} className="flex-1 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700 truncate" />
              <button onClick={copyLink} className="min-w-[48px] min-h-[48px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
            {typeof navigator.share === "function" && (
              <button onClick={shareLink} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-white dark:hover:bg-gray-800 transition-colors active:scale-[0.98]">
                <Share2 className="w-4 h-4" /> Share with friends
              </button>
            )}
            {data.referralCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">{data.referralCount} friend{data.referralCount !== 1 ? 's' : ''} referred</p>
            )}
          </SectionCard>
        )}

        {/* Rewards Card */}
        <Link href="/rewards">
          <button className="w-full rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800 p-6 text-left hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-2xl shadow-sm shrink-0">
                🎁
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-50">Your Rewards</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Earn points for listing toys and inviting friends</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{pointsBalance}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
              </div>
            </div>
          </button>
        </Link>

        {/* CTA Cards */}
        <div className="grid gap-4">
          <Link href="/list-toy">
            <button className="w-full rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white p-6 text-left hover:shadow-lg transition-all active:scale-[0.99] group">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🧸</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold">List a Toy</p>
                  <p className="text-sm opacity-80">Help build the marketplace before launch</p>
                </div>
                <TrendingUp className="w-6 h-6 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Link>
          <Link href="/invite">
            <button className="w-full rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 text-left hover:shadow-md transition-all active:scale-[0.99] group">
              <div className="flex items-center gap-4">
                <span className="text-4xl">👥</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-50">Invite Friends</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Grow the community and earn rewards</p>
                </div>
                <TrendingUp className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Link>
        </div>

      </div>
    </PageContainer>
  );
}
