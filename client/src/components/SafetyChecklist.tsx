import { useState } from "react";

interface SafetyChecklistProps {
  compact?: boolean;
  collapsible?: boolean;
  className?: string;
}

const ITEMS = [
  "Meet in a public place like a mall, coffee shop, or community centre",
  "Bring a parent or guardian if you're under 18",
  "Inspect toys before completing the exchange",
  "Avoid sharing unnecessary personal details",
];

export default function SafetyChecklist({ compact, collapsible, className = "" }: SafetyChecklistProps) {
  const [open, setOpen] = useState(false);

  const content = (
    <ul className="space-y-1">
      {ITEMS.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[11px] text-green-700 dark:text-green-300 leading-relaxed">
          <span className="text-green-500 shrink-0 mt-0.5">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 ${collapsible ? 'px-3.5 py-2' : 'px-3.5 py-2.5'} ${className}`}>
      {collapsible ? (
        <>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left min-h-[36px]">
            <span className="text-sm">🛡️</span>
            <span className="text-xs font-semibold text-green-800 dark:text-green-200 flex-1">Safe Swap Tips</span>
            <svg className={`w-3.5 h-3.5 text-green-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {open && <div className="mt-1.5">{content}</div>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">🛡️</span>
            <span className="text-xs font-semibold text-green-800 dark:text-green-200">Safe Swap Tips</span>
          </div>
          {content}
        </>
      )}
    </div>
  );
}
