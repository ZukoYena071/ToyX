import { useState, useRef, useEffect } from "react";

const BADGE_ASSETS: Record<string, string> = {
  founding_member: "/assets/founding-member-badge.png",
};

const BADGE_LABELS: Record<string, string> = {
  founding_member: "Founding Member",
  toyx_official: "ToyX Official",
};

const OFFICIAL_BADGE_LIGHT = "/assets/badges/toyx-official-light.png";
const OFFICIAL_BADGE_DARK = "/assets/badges/toyx-official-dark.png";

const BADGE_DESCRIPTIONS: Record<string, string> = {
  founding_member: "One of the first ToyX families helping build the community before launch.",
  toyx_official: "Official ToyX Account. Example listings, platform updates, safety guidance and community announcements.",
};

interface FeaturedBadgeProps {
  type: string;
  memberNumber?: number | null;
  awardedAt?: string | null;
}

function useTheme() {
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
  return theme;
}

export default function FeaturedBadge({ type, memberNumber, awardedAt }: FeaturedBadgeProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  const label = BADGE_LABELS[type] || type;
  const description = BADGE_DESCRIPTIONS[type];

  if (type === "toyx_official") {
    const badgeSrc = theme === "dark" ? OFFICIAL_BADGE_DARK : OFFICIAL_BADGE_LIGHT;
    return (
      <div className="relative inline-flex items-center" ref={ref}>
        <button
          onClick={() => setShow(!show)}
          className="inline-flex items-center focus:outline-none min-w-[22px] min-h-[22px]"
          aria-label={label}
        >
          <img src={badgeSrc} alt={label} className="w-7 h-7 rounded-full object-contain inline-block align-middle" />
        </button>
        {show && (
          <div className="absolute z-50 left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4 w-64">
            <div className="flex items-center gap-3 mb-2">
              <img src={badgeSrc} alt="" className="w-10 h-10 rounded-full object-contain shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>
        )}
      </div>
    );
  }

  const src = BADGE_ASSETS[type];
  if (!src) return null;

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setShow(!show)}
        className="inline-flex items-center focus:outline-none min-w-[22px] min-h-[22px]"
        aria-label={label}
      >
        <img src={src} alt={label} className="w-7 h-7 rounded-full object-contain inline-block align-middle" />
      </button>
      {show && (
        <div className="absolute z-50 left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4 w-64">
          <div className="flex items-center gap-3 mb-2">
            <img src={src} alt="" className="w-10 h-10 rounded-full object-contain shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{label}</p>
              {memberNumber != null && <p className="text-xs font-semibold text-amber-600">Member #{memberNumber}</p>}
            </div>
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
          )}
          {awardedAt && (
            <p className="text-[10px] text-gray-400 mt-2">Earned {new Date(awardedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
