import { TrendingUp, Sparkles, Gift } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";

interface ReferralProgressProps {
  stats: {
    monthlyQualified?: number;
    monthlyLimit?: number;
    totalQualified?: number;
    totalPending?: number;
    pointsFromReferrals?: number;
    premiumDaysFromReferrals?: number;
  };
}

export default function ReferralProgress({ stats }: ReferralProgressProps) {
  const completed = stats?.monthlyQualified || 0;
  const limit = stats?.monthlyLimit || 5;
  const pct = Math.min((completed / limit) * 100, 100);

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Referral Progress</h3>
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
      {(stats?.pointsFromReferrals ?? 0) > 0 || (stats?.premiumDaysFromReferrals ?? 0) > 0 ? (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          {(stats?.premiumDaysFromReferrals ?? 0) > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400"><Sparkles className="w-3 h-3 inline mr-1" />Premium Days Earned</span>
              <span className="font-semibold text-purple-600 dark:text-purple-300">{stats.premiumDaysFromReferrals}d</span>
            </div>
          )}
          {(stats?.pointsFromReferrals ?? 0) > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400"><Gift className="w-3 h-3 inline mr-1" />Points Earned</span>
              <span className="font-semibold text-amber-600 dark:text-amber-300">{stats.pointsFromReferrals!.toLocaleString()}</span>
            </div>
          )}
        </div>
      ) : null}
    </SectionCard>
  );
}
