// TODO: Replace with final character-based illustrations from designer/AI
// Drop SVG/PNG files into client/src/assets/onboarding/step{0-4}.svg
// They will be loaded automatically. The SVG placeholders below serve as fallbacks.

interface Props {
  stepIndex: number;
}

export default function OnboardingIllustration({ stepIndex }: Props) {
  const images = [
    { id: "step0", src: "/assets/onboarding/step0.svg" },
    { id: "step1", src: "/assets/onboarding/step1.svg" },
    { id: "step2", src: "/assets/onboarding/step2.svg" },
    { id: "step3", src: "/assets/onboarding/step3.svg" },
    { id: "step4", src: "/assets/onboarding/step4.svg" },
  ];
  const img = images[stepIndex];

  return (
    <div className="relative z-10 h-[280px] w-full max-w-xs flex items-center justify-center">
      <img
        key={img.id}
        src={img.src}
        alt=""
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div className="hidden w-full h-full items-center justify-center">
        {stepIndex === 0 && <Step0Illo />}
        {stepIndex === 1 && <Step1Illo />}
        {stepIndex === 2 && <Step2Illo />}
        {stepIndex === 3 && <Step3Illo />}
        {stepIndex === 4 && <Step4Illo />}
      </div>
    </div>
  );
}

/* ---- SVG placeholder fallbacks ---- */

function Step0Illo() {
  return (
    <svg viewBox="0 0 240 260" className="w-full h-full" fill="none">
      <circle cx="80" cy="80" r="28" className="fill-purple-500" />
      <rect x="62" y="108" width="36" height="60" rx="10" className="fill-purple-400" />
      <rect x="52" y="115" width="14" height="40" rx="7" className="fill-purple-300" />
      <rect x="94" y="115" width="14" height="40" rx="7" className="fill-purple-300" />
      <circle cx="160" cy="95" r="22" className="fill-pink-500" />
      <rect x="146" y="117" width="28" height="46" rx="8" className="fill-pink-400" />
      <rect x="138" y="122" width="10" height="34" rx="5" className="fill-pink-300" />
      <rect x="172" y="122" width="10" height="34" rx="5" className="fill-pink-300" />
      <rect x="100" y="140" width="44" height="36" rx="6" className="fill-amber-400" />
      <rect x="100" y="140" width="44" height="8" rx="4" className="fill-amber-500" />
      <circle cx="122" cy="162" r="8" className="fill-red-400" />
      <rect x="116" y="148" width="12" height="6" rx="3" className="fill-green-400" />
      <path d="M86 130 Q96 145 105 148" stroke="url(#g0)" strokeWidth="2" fill="none" strokeDasharray="3 3" />
      <path d="M144 130 Q134 145 125 148" stroke="url(#g1)" strokeWidth="2" fill="none" strokeDasharray="3 3" />
      <defs>
        <linearGradient id="g0" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#a855f7" /><stop offset="1" stopColor="#ec4899" /></linearGradient>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ec4899" /><stop offset="1" stopColor="#a855f7" /></linearGradient>
      </defs>
    </svg>
  );
}

function Step1Illo() {
  return (
    <svg viewBox="0 0 240 260" className="w-full h-full" fill="none">
      <rect x="80" y="30" width="80" height="160" rx="16" className="fill-gray-900 dark:fill-gray-700" />
      <rect x="86" y="36" width="68" height="130" rx="10" className="fill-white dark:fill-gray-800" />
      <circle cx="120" cy="46" r="4" className="fill-gray-900 dark:fill-gray-600" />
      <rect x="96" y="66" width="48" height="48" rx="6" className="fill-purple-100 dark:fill-purple-900/40" />
      <rect x="102" y="72" width="36" height="10" rx="3" className="fill-purple-400" />
      <rect x="102" y="86" width="24" height="10" rx="3" className="fill-pink-400" />
      <circle cx="120" cy="97" r="6" className="fill-amber-400" />
      <circle cx="140" cy="42" r="3" className="fill-green-500" />
      <path d="M68 52 l3-8 3 8-8-3 8 1z" className="fill-purple-400" />
      <path d="M175 72 l2-6 2 6-6-2 6 1z" className="fill-pink-400" />
      <circle cx="120" cy="210" r="14" className="fill-green-500" />
      <path d="M114 210 l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Step2Illo() {
  return (
    <svg viewBox="0 0 240 260" className="w-full h-full" fill="none">
      <rect x="60" y="30" width="120" height="190" rx="14" className="fill-gray-900 dark:fill-gray-700" />
      <rect x="66" y="36" width="108" height="178" rx="10" className="fill-white dark:fill-gray-800" />
      <rect x="74" y="46" width="92" height="14" rx="7" className="fill-gray-100 dark:fill-gray-700" />
      <circle cx="84" cy="53" r="3" className="fill-gray-400" />
      <rect x="89" y="51" width="40" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <rect x="74" y="70" width="42" height="50" rx="6" className="fill-purple-50 dark:fill-purple-900/20" />
      <rect x="74" y="70" width="42" height="20" rx="6" className="fill-purple-300" />
      <rect x="78" y="96" width="20" height="4" rx="2" className="fill-gray-400" />
      <rect x="124" y="70" width="42" height="50" rx="6" className="fill-pink-50 dark:fill-pink-900/20" />
      <rect x="124" y="70" width="42" height="20" rx="6" className="fill-pink-300" />
      <rect x="128" y="96" width="20" height="4" rx="2" className="fill-gray-400" />
      <rect x="74" y="130" width="42" height="50" rx="6" className="fill-amber-50 dark:fill-amber-900/20" />
      <rect x="74" y="130" width="42" height="20" rx="6" className="fill-amber-300" />
      <rect x="78" y="156" width="20" height="4" rx="2" className="fill-gray-400" />
      <rect x="124" y="130" width="42" height="50" rx="6" className="fill-blue-50 dark:fill-blue-900/20" />
      <rect x="124" y="130" width="42" height="20" rx="6" className="fill-blue-300" />
      <rect x="128" y="156" width="20" height="4" rx="2" className="fill-gray-400" />
      <path d="M190 60 q0-12-8-12-8 0-8 12 0 9 8 18 8-9 8-18z" className="fill-red-400" />
      <circle cx="182" cy="60" r="4" className="fill-white" />
      <circle cx="200" cy="110" r="3" className="fill-purple-300" />
      <circle cx="208" cy="130" r="2" className="fill-pink-300" />
      <circle cx="196" cy="150" r="2.5" className="fill-amber-300" />
    </svg>
  );
}

function Step3Illo() {
  return (
    <svg viewBox="0 0 240 260" className="w-full h-full" fill="none">
      <circle cx="70" cy="72" r="22" className="fill-purple-500" />
      <rect x="56" y="94" width="28" height="50" rx="8" className="fill-purple-400" />
      <rect x="48" y="98" width="10" height="36" rx="5" className="fill-purple-300" />
      <rect x="82" y="98" width="10" height="36" rx="5" className="fill-purple-300" />
      <circle cx="170" cy="72" r="22" className="fill-pink-500" />
      <rect x="156" y="94" width="28" height="50" rx="8" className="fill-pink-400" />
      <rect x="148" y="98" width="10" height="36" rx="5" className="fill-pink-300" />
      <rect x="182" y="98" width="10" height="36" rx="5" className="fill-pink-300" />
      <path d="M90 110 l15-8-5 4 0-20 10 0 0 20-5-4z" className="fill-purple-500" />
      <path d="M150 110 l-15-8 5 4 0-20-10 0 0 20 5-4z" className="fill-pink-500" />
      <rect x="104" y="130" width="32" height="28" rx="5" className="fill-amber-400" />
      <rect x="104" y="130" width="32" height="6" rx="3" className="fill-amber-500" />
      <circle cx="120" cy="148" r="5" className="fill-white" />
      <path d="M176 152 l10-4v14q0 12-10 16-10-4-10-16v-14z" className="fill-green-500/80" />
      <path d="M171 157 l4 4 8-8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="30" y="150" width="40" height="24" rx="8" className="fill-purple-100 dark:fill-purple-900/30" />
      <path d="M38 174 l4-8h-4" className="fill-purple-100 dark:fill-purple-900/30" />
      <circle cx="42" cy="160" r="2" className="fill-purple-400" />
      <circle cx="50" cy="160" r="2" className="fill-purple-400" />
      <circle cx="58" cy="160" r="2" className="fill-purple-400" />
    </svg>
  );
}

function Step4Illo() {
  return (
    <svg viewBox="0 0 240 260" className="w-full h-full" fill="none">
      <path d="M120 50 l-12 20-22-8 16 28-4 6 22-8 22 8-4-6 16-28-22 8z" className="fill-amber-400" />
      <circle cx="120" cy="46" r="4" className="fill-amber-300" />
      <circle cx="98" cy="56" r="3" className="fill-amber-300" />
      <circle cx="142" cy="56" r="3" className="fill-amber-300" />
      <path d="M80 38 l2-5 2 5-5-2 5 1z" className="fill-purple-400" />
      <path d="M160 34 l1.5-4 1.5 4-4-1.5 4 1z" className="fill-pink-400" />
      <path d="M140 28 l1-3 1 3-3-1 3 1z" className="fill-amber-400" />
      <rect x="50" y="100" width="60" height="100" rx="10" className="fill-white dark:fill-gray-800 stroke-purple-500" strokeWidth="2" />
      <rect x="50" y="100" width="60" height="24" rx="10" className="fill-purple-500" />
      <text x="80" y="116" textAnchor="middle" className="fill-white text-[9px] font-bold">R89</text>
      <text x="80" y="126" textAnchor="middle" className="fill-gray-400 text-[7px]">/month</text>
      <rect x="130" y="95" width="60" height="108" rx="10" className="fill-white dark:fill-gray-800 stroke-amber-400" strokeWidth="2" />
      <rect x="130" y="95" width="60" height="24" rx="10" className="fill-amber-400" />
      <text x="160" y="111" textAnchor="middle" className="fill-white text-[9px] font-bold">R449</text>
      <text x="160" y="121" textAnchor="middle" className="fill-gray-400 text-[7px]">/year</text>
      <rect x="140" y="89" width="40" height="10" rx="5" className="fill-purple-100 dark:fill-purple-900/40" />
      <text x="160" y="97" textAnchor="middle" className="fill-purple-700 dark:fill-purple-300 text-[6px] font-bold">BEST VALUE</text>
      <circle cx="148" cy="135" r="3" className="fill-green-500" />
      <circle cx="148" cy="147" r="3" className="fill-green-500" />
      <circle cx="148" cy="159" r="3" className="fill-green-500" />
    </svg>
  );
}
