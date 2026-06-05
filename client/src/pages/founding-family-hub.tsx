import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Users, Gift, MapPin, CheckCircle, Loader2, Target, Share2 } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import StatCard from "@/components/ui/StatCard";
import { Progress } from "@/components/ui/progress";
import ShareCard from "@/components/referral/ShareCard";
import { useToast } from "@/hooks/use-toast";

const FAMILIES_TARGET = 100;
const LISTINGS_TARGET = 500;

export default function FoundingFamilyHub() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [refData, setRefData] = useState<any>(null);
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
      <PageContainer className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer className="flex items-center justify-center">
        <p className="text-sm text-gray-500">Could not load hub data.</p>
      </PageContainer>
    );
  }

  const fm = data.foundingMember;
  const community = data.community || { totalFamilies: 0, totalListings: 0, citiesRepresented: 0 };
  const familiesPct = Math.min((community.totalFamilies / FAMILIES_TARGET) * 100, 100);
  const listingsPct = Math.min((community.totalListings / LISTINGS_TARGET) * 100, 100);

  const profileChecks = [
    { label: "Profile complete", done: data.profileCompletion >= 80 },
    { label: "Email verified", done: data.emailVerified },
    { label: "Toys listed", done: (data.toyCount || 0) >= 3 },
    { label: "Friends referred", done: (data.referralCount || 0) >= 1 },
  ];
  const profileDone = profileChecks.filter(c => c.done).length;

  return (
    <PageContainer>
      <PageHeader title="Founding Family Hub" />

      <div className="px-4 pt-4 space-y-4 pb-24">
        {/* Status Card */}
        <SectionCard className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
          <div className="text-center py-2">
            {fm ? (
              <p className="text-lg font-bold">Founding Family Member #{fm.memberNumber || "—"}</p>
            ) : (
              <p className="text-lg font-bold">Welcome to the ToyX Family!</p>
            )}
            <p className="text-sm opacity-90 mt-1">
              {data.accessStatus === "waitlist"
                ? "You're helping us build something special. Share toys and invite friends to unlock full access."
                : data.accessStatus === "beta"
                ? "You have early access! Welcome to the marketplace."
                : "You have full access to the ToyX marketplace."}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              data.accessStatus === "waitlist" ? "bg-white/20 text-white" :
              data.accessStatus === "beta" ? "bg-green-400/30 text-green-100" :
              "bg-purple-300/30 text-purple-100"
            }`}>
              {data.accessStatus === "waitlist" ? "Founding Family" : data.accessStatus === "beta" ? "Beta Member" : "Full Member"}
            </span>
          </div>
        </SectionCard>

        {/* Community Growth */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">ToyX Community Growth</h3>
          </div>
          <StatCard items={[
            { value: community.totalFamilies, label: "Founding Families", icon: <Users className="w-4 h-4" /> },
            { value: community.totalListings, label: "Toys Listed", icon: <Gift className="w-4 h-4" /> },
            { value: community.citiesRepresented, label: "Cities", icon: <MapPin className="w-4 h-4" /> },
          ]} />
        </SectionCard>

        {/* Launch Progress */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">ToyX Launch Progress</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Founding Families</span>
                <span>{community.totalFamilies} / {FAMILIES_TARGET}</span>
              </div>
              <Progress value={familiesPct} className="h-2.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Toys Listed</span>
                <span>{community.totalListings} / {LISTINGS_TARGET}</span>
              </div>
              <Progress value={listingsPct} className="h-2.5" />
            </div>
          </div>
        </SectionCard>

        {/* Beta Qualification Progress */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Beta Qualification Progress</h3>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {profileDone} of {profileChecks.length} goals completed
          </div>
          <div className="space-y-2">
            {profileChecks.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {c.done && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-sm ${c.done ? 'text-gray-900 dark:text-gray-50' : 'text-gray-400 dark:text-gray-500'}`}>{c.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Referral Section */}
        {refData?.inviteLink && <ShareCard inviteLink={refData.inviteLink} />}

        {/* Call to Action */}
        <div className="flex gap-3">
          <Link href="/list-toy" className="flex-1">
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]">
              List a Toy
            </button>
          </Link>
          <Link href="/invite" className="flex-1">
            <button className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
              <Share2 className="w-4 h-4 inline mr-1" /> Invite Friends
            </button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
