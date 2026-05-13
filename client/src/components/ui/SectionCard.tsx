import { cn } from "@/lib/utils";

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function SectionCard({ children, className, ...props }: SectionCardProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4", className)} {...props}>
      {children}
    </div>
  );
}
