interface SafetyChecklistProps {
  compact?: boolean;
  className?: string;
}

const ITEMS = [
  "Meet in a public place like a mall, coffee shop, or community centre",
  "Bring a parent or guardian if you're under 18",
  "Inspect toys before completing the exchange",
  "Avoid sharing unnecessary personal details",
];

export default function SafetyChecklist({ compact, className = "" }: SafetyChecklistProps) {
  return (
    <div className={`rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3.5 py-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">🛡️</span>
        <span className="text-xs font-semibold text-green-800 dark:text-green-200">
          Safe Swap Tips
        </span>
      </div>
      <ul className="space-y-1">
        {ITEMS.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-green-700 dark:text-green-300 leading-relaxed">
            <span className="text-green-500 shrink-0 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
