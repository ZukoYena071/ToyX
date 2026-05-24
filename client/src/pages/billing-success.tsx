import { Link } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";

export default function BillingSuccess() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log("BILLING_SUCCESS: raw URL search:", window.location.search);
    console.log("BILLING_SUCCESS: all params:", Object.fromEntries(params.entries()));
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
          // Use returnTo from Paystack metadata (survives external redirect via server-side storage)
          const returnTo = data.returnTo || "/profile";
          console.log("BILLING_SUCCESS: returnTo from Paystack metadata:", data.returnTo, "→ using:", returnTo);
          setTimeout(() => {
            console.log("BILLING_SUCCESS: redirecting to", returnTo);
            window.location.href = returnTo;
          }, 2000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <PageContainer className="flex items-center justify-center">
      <SectionCard className="p-8 max-w-sm mx-4 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              Verifying Payment...
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we confirm your payment.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              Payment Successful!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome to ToyX Premium. You'll be redirected shortly.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              Verification Failed
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              We couldn't verify your payment. Please contact support.
            </p>
            <a
              href="/pricing"
              className="text-purple-500 font-medium hover:underline"
            >
              Back to Pricing
            </a>
          </>
        )}
      </SectionCard>
    </PageContainer>
  );
}
