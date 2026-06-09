interface BadgeData {
  type: string;
  awardedAt?: string;
  [key: string]: any;
}

interface AchievementCardProps {
  badge: BadgeData;
  memberNumber?: number | null;
}

export default function AchievementCard({ badge, memberNumber }: AchievementCardProps) {
  if (badge.type === "founding_member") {
    return (
      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border border-amber-200 dark:border-amber-700">
        <img src="/assets/founding-member-badge.png" alt="" className="w-16 h-16 rounded-full object-contain shrink-0" />
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 dark:text-gray-50">Founding Member</p>
          {memberNumber != null && <p className="text-sm font-semibold text-amber-600">Member #{memberNumber}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            One of the first ToyX families helping build the community before launch.
          </p>
          {badge.awardedAt && (
            <p className="text-[10px] text-gray-400 mt-1.5">Earned {new Date(badge.awardedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  }
  return null;
}
