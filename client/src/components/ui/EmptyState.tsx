import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="text-gray-300 dark:text-gray-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{subtitle}</p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
