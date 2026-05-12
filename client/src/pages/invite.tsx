import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Gift, Copy, Check, Users } from "lucide-react";
import BottomNav from "@/components/bottom-nav";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto flex items-center space-x-3">
          <Link href="/profile"><button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button></Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Invite Friends</h1>
        </div>
      </div>
      <div className="max-w-sm mx-auto p-4">
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-6">
          <CardContent className="p-6 text-center">
            <Gift className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Refer a Friend</h2>
            <p className="text-sm opacity-90">Invite friends to ToyX and earn <strong>200 points + 7-day Premium Pass</strong> when they complete their first exchange!</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm">Your Referral Link</h3>
            <div className="flex space-x-2">
              <input readOnly value={data?.inviteLink ? `${window.location.origin}${data.inviteLink}` : "Loading..."} className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white border" />
              <Button size="sm" onClick={copyLink} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {data?.referrals?.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Your Referrals</span>
              </h3>
              <div className="space-y-2">
                {data.referrals.map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Friend</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ref.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {ref.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
