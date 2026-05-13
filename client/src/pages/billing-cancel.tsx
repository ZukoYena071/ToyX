import { Link } from "wouter";
import { XCircle } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";

export default function BillingCancel() {
  return (
    <PageContainer className="flex items-center justify-center">
      <SectionCard className="p-8 max-w-sm mx-4 text-center">
        <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          Payment Canceled
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your payment was canceled. You can try again whenever you're ready.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors min-h-[44px]"
        >
          Back to Pricing
        </Link>
      </SectionCard>
    </PageContainer>
  );
}
