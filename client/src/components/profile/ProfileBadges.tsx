interface Badge {
  type: string;
  awardedAt?: string;
  [key: string]: any;
}

interface ProfileBadgesProps {
  badges: Badge[];
}

const BADGE_CONFIG: Record<string, { label: string; icon: string }> = {
  founding_member: { label: "Founding Member", icon: "🛡️" },
};

export default function ProfileBadges({ badges }: ProfileBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const visible = badges.filter(b => BADGE_CONFIG[b.type]);

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visible.map((badge) => {
        const cfg = BADGE_CONFIG[badge.type];
        return (
          <span key={badge.type} className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-700">
            <img src="/assets/founding-member-badge.png" alt="" className="w-4 h-4 rounded-full object-contain" />
            {cfg?.label || badge.type}
          </span>
        );
      })}
    </div>
  );
}
