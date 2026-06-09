interface BadgeData {
  type: string;
  awardedAt?: string;
  [key: string]: any;
}

interface AchievementCardProps {
  badge: BadgeData;
  memberNumber?: number | null;
}

import { useEffect, useState } from "react";

const OFFICIAL_LIGHT = "/assets/badges/toyx-official-light.png";
const OFFICIAL_DARK = "/assets/badges/toyx-official-dark.png";

export default function AchievementCard({ badge, memberNumber }: AchievementCardProps) {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (badge.type === "toyx_official") {
    const badgeSrc = theme === "dark" ? OFFICIAL_DARK : OFFICIAL_LIGHT;
    return (
      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
        <img src={badgeSrc} alt="ToyX Official" className="w-16 h-16 rounded-full object-contain shrink-0" />
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
