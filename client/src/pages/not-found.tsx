import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/ui/EmptyState";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <SectionCard className="w-full max-w-md mx-4">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12" />}
          title="Page Not Found"
          subtitle="The page you're looking for doesn't exist."
          action={
            <button
              onClick={() => window.location.href = '/'}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-colors min-h-[44px]"
            >
              Go Home
            </button>
          }
        />
      </SectionCard>
    </div>
  );
}
