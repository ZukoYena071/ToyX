import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function BillingSuccess() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (!reference) {
      setStatus("error");
      return;
    }
    fetch(`/api/billing/paystack/verify?reference=${reference}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/profile";
          }, 2000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-sm mx-4 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Verifying Payment...
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we confirm your payment.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome to ToyX Premium. You'll be redirected shortly.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              We couldn't verify your payment. Please contact support.
            </p>
            <a
              href="/pricing"
              className="text-purple-600 font-medium hover:underline"
            >
              Back to Pricing
            </a>
          </>
        )}
      </div>
    </div>
  );
}
