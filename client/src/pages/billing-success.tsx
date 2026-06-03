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
    async function verify() {
      try {
        const res = await fetch(`/api/billing/paystack/verify?reference=${reference}`, { credentials: "include" });
        const data = await res.json();
        if (data.ok) {
          return data;
        }
        // If 401, session may have been lost after Paystack redirect — webhook already processed payment
        if (res.status === 401) {
          return { ok: true, returnTo: "/profile", fromWebhook: true };
        }
        return null;
      } catch {
        return null;
      }
    }
    verify().then((data) => {
      if (data) {
        setStatus("success");
        const returnTo = data.returnTo || "/profile";
        if (data.action) {
          const existingCtx = localStorage.getItem("toyx_upgrade_context") || sessionStorage.getItem("toyx_upgrade_context");
          let merged: any = { returnTo, action: data.action };
          if (existingCtx) {
            try { const p = JSON.parse(existingCtx); if (p.formDraft) merged.formDraft = p.formDraft; } catch {}
          }
          localStorage.setItem("toyx_upgrade_context", JSON.stringify(merged));
        }
        setTimeout(() => { window.location.href = returnTo; }, 2000);
      } else {
        setStatus("error");
      }
    });
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
