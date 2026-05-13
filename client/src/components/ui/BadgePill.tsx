import { cn } from "@/lib/utils";

type BadgePillVariant = "success" | "warning" | "info" | "neutral";

interface BadgePillProps {
  label: string;
  variant?: BadgePillVariant;
  className?: string;
}

const variantStyles: Record<BadgePillVariant, string> = {
  success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  neutral: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
};

export default function BadgePill({ label, variant = "neutral", className }: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
