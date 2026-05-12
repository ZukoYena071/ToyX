import { Link } from "wouter";
import { XCircle } from "lucide-react";

export default function BillingCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-sm mx-4 text-center">
        <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Payment Canceled
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Your payment was canceled. You can try again whenever you're ready.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Back to Pricing
        </Link>
      </div>
    </div>
  );
}
