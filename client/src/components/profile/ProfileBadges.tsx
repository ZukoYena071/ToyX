import { useEffect, useState } from "react";

const OFFICIAL_LIGHT = "/assets/badges/toyx-official-light.png";
const OFFICIAL_DARK = "/assets/badges/toyx-official-dark.png";

interface Badge {
  type: string;
  awardedAt?: string;
  [key: string]: any;
}

interface ProfileBadgesProps {
  badges: Badge[];
}

interface BadgeConfig {
  label: string;
  assetLight?: string;
  assetDark?: string;
  asset?: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  founding_member: {
    label: "Founding Member",
    asset: "/assets/founding-member-badge.png",
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-700",
  },
  toyx_official: {
    label: "ToyX Official",
    assetLight: OFFICIAL_LIGHT,
    assetDark: OFFICIAL_DARK,
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-700",
  },
};

export default function ProfileBadges({ badges }: ProfileBadgesProps) {
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

  if (!badges || badges.length === 0) return null;

  const visible = badges.filter(b => BADGE_CONFIG[b.type]);

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visible.map((badge) => {
        const cfg = BADGE_CONFIG[badge.type];
        const imgSrc = cfg.assetLight
          ? (theme === "dark" ? cfg.assetDark : cfg.assetLight)
          : cfg.asset;
        return (
          <span key={badge.type} className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.textClass} ${cfg.bgClass} px-2.5 py-1 rounded-full border ${cfg.borderClass}`}>
            {imgSrc && <img src={imgSrc} alt="" className="w-4 h-4 rounded-full object-contain" />}
            {cfg?.label || badge.type}
          </span>
        );
      })}
    </div>
  );
}
