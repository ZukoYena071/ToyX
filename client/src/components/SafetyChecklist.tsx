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
    <div className={`rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🛡️</span>
        <span className="text-sm font-semibold text-green-800 dark:text-green-200">
          Safe Swap Tips
        </span>
      </div>
      <ul className="space-y-2">
        {ITEMS.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300 leading-relaxed">
            <span className="text-green-500 shrink-0 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
