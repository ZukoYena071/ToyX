import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-950 pb-20", className)}>
      <div className="max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
}
