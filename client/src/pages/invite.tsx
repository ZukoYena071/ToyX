import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Copy, Check, Users } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default function Invite() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals/me", { credentials: "include" })
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const copyLink = () => {
    if (!data?.inviteLink) return;
    const url = `${window.location.origin}${data.inviteLink}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with friends." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Invite Friends"
        rightAction={
          <Link href="/profile">
            <button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </Link>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-purple-500 text-white rounded-2xl shadow-sm">
          <div className="p-6 text-center">
            <Gift className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Refer a Friend</h2>
            <p className="text-sm opacity-90">Invite friends to ToyX and earn <strong>200 points + 7-day Premium Pass</strong> when they complete their first exchange!</p>
          </div>
        </div>

        <SectionCard>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Your Referral Link</h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={data?.inviteLink ? `${window.location.origin}${data.inviteLink}` : "Loading..."}
              className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700"
            />
            <Button size="sm" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </SectionCard>

        {data?.referrals?.length > 0 && (
          <SectionCard>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Your Referrals</span>
            </h3>
            <div className="space-y-2">
              {data.referrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Friend</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ref.status === 'qualified' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
                    {ref.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <BottomNav />
    </PageContainer>
  );
}
