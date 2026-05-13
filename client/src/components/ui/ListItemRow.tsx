import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ListItemRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ListItemRow({ icon, title, subtitle, right, onClick, className }: ListItemRowProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl w-full text-left",
        "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150",
        "min-h-[44px]",
        className
      )}
    >
      <div className="shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{title}</span>
        {subtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>
        )}
      </div>
      {right !== undefined ? (
        <div className="shrink-0">{right}</div>
      ) : onClick ? (
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      ) : null}
    </Comp>
  );
}
