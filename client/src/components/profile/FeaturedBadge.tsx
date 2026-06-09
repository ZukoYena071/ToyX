import { useState, useRef, useEffect } from "react";

const BADGE_ASSETS: Record<string, string> = {
  founding_member: "/assets/founding-member-badge.png",
};

const BADGE_LABELS: Record<string, string> = {
  founding_member: "Founding Member",
  toyx_official: "ToyX Official",
};

interface FeaturedBadgeProps {
  type: string;
  memberNumber?: number | null;
  awardedAt?: string | null;
}

function OfficialBadgeIcon() {
  return (
    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export default function FeaturedBadge({ type, memberNumber, awardedAt }: FeaturedBadgeProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  if (type === "toyx_official") {
    return (
      <div className="relative inline-flex items-center" ref={ref}>
        <button
          onClick={() => setShow(!show)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[11px] font-semibold focus:outline-none min-h-[22px]"
          aria-label="ToyX Official"
        >
          <OfficialBadgeIcon />
          Official
        </button>
        {show && (
          <div className="absolute z-50 left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4 w-64">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <OfficialBadgeIcon />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-50">ToyX Official</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Official ToyX account. Example listings, platform updates, safety guidance and community announcements.
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
        aria-label={BADGE_LABELS[type] || type}
      >
        <img src={src} alt={BADGE_LABELS[type] || type} className="w-7 h-7 rounded-full object-contain inline-block align-middle" />
      </button>
      {show && (
        <div className="absolute z-50 left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4 w-64">
          <div className="flex items-center gap-3 mb-2">
            <img src={src} alt="" className="w-10 h-10 rounded-full object-contain shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{BADGE_LABELS[type] || type}</p>
              {memberNumber != null && <p className="text-xs font-semibold text-amber-600">Member #{memberNumber}</p>}
            </div>
          </div>
          {type === "founding_member" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              One of the first ToyX families helping build the community before launch.
            </p>
          )}
          {awardedAt && (
            <p className="text-[10px] text-gray-400 mt-2">Earned {new Date(awardedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
