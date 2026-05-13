import { cn } from "@/lib/utils";

interface StatItem {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface StatCardProps {
  items: StatItem[];
  className?: string;
}

export default function StatCard({ items, className }: StatCardProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4", className)}>
      <div className="flex items-center justify-around">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 text-center">
            {item.icon && <div className="mb-1">{item.icon}</div>}
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {item.value}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
