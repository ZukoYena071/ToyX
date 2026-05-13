import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, rightAction, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3", className)}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{title}</h1>
      {rightAction && (
        <div className="min-h-[44px] flex items-center">
          {rightAction}
        </div>
      )}
    </div>
  );
}
