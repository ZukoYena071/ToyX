import React from "react";

export function normalizeList(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[,|/;]/g)
    .map(v => v.trim())
    .filter(Boolean);
}

export function MetaChip({ children, variant }: { children: React.ReactNode; variant: "age" | "cat" | "more" }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none border";
  const styles =
    variant === "age"
      ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-400/10 dark:text-purple-300 dark:border-purple-400/20"
      : variant === "cat"
      ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20"
      : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

export function ChipRow({ ages, categories }: { ages: string[]; categories: string[] }) {
  const ageToShow = ages.slice(0, 2);
  const catToShow = categories.slice(0, 2);
  const hiddenCount = Math.max(0, ages.length - ageToShow.length) + Math.max(0, categories.length - catToShow.length);
  return (
    <div data-testid="toy-meta-chips" className="flex flex-wrap gap-1.5">
      {ageToShow.map((a) => (
        <MetaChip key={`age-${a}`} variant="age">Age {a}</MetaChip>
      ))}
      {catToShow.map((c) => (
        <MetaChip key={`cat-${c}`} variant="cat">Cat {c}</MetaChip>
      ))}
      {hiddenCount > 0 && <MetaChip variant="more">+{hiddenCount}</MetaChip>}
    </div>
  );
}
