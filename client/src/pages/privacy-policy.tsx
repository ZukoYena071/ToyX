import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { PRIVACY_HTML, LAST_UPDATED } from "@/content/privacy-policy";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";

export default function PrivacyPolicyPage() {
  const [, setLocation] = useLocation();

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else setLocation("/profile");
  };

  return (
    <PageContainer className="pb-24">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Privacy Policy</h1>
          <button onClick={goBack} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-xs text-gray-400">Last updated: {LAST_UPDATED}</p>
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-3"
          dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }}
        />
      </div>

      <BottomNav />
    </PageContainer>
  );
}
