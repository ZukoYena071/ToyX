interface BadgeData {
  type: string;
  awardedAt?: string;
  [key: string]: any;
}

interface AchievementCardProps {
  badge: BadgeData;
  memberNumber?: number | null;
}

function OfficialBadgeIcon() {
  return (
    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export default function AchievementCard({ badge, memberNumber }: AchievementCardProps) {
  if (badge.type === "toyx_official") {
    return (
      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <OfficialBadgeIcon />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 dark:text-gray-50">ToyX Official</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            Official ToyX account. Example listings, platform updates, safety guidance and community announcements.
          </p>
        </div>
      </div>
    );
  }

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
