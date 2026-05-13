import { cn } from "@/lib/utils";

interface LimitMeterProps {
  label: string;
  current: number;
  max: number;
  color?: string;
  className?: string;
}

export default function LimitMeter({ label, current, max, color, className }: LimitMeterProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const barColor = color || "bg-purple-500";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{current}/{max}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-200", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
