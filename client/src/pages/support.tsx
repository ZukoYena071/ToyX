import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useLocation } from "wouter";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";

const CATEGORIES = [
  { value: "account-issue", label: "Account Issue" },
  { value: "moderation-review", label: "Moderation Review / Appeal" },
  { value: "safety-concern", label: "Safety Concern" },
  { value: "billing", label: "Billing" },
  { value: "general-support", label: "General Support" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    email: (user as any)?.email || "",
    category: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async () => {
    if (!form.category || !form.subject || !form.message) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message || "Something went wrong", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not submit request", variant: "destructive" });
    }
    setSending(false);
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else setLocation("/profile");
  };

  if (submitted) {
    return (
      <PageContainer className="flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Message received</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We've received your message and will review it as soon as possible.
            </p>
          </div>
        </div>
        <BottomNav />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={goBack} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Contact Support</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          We're here to help. Send us a message and we'll review it as soon as possible.
        </p>

        {!user && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[48px]"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
          <Input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Brief summary of your issue"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Tell us more about your issue..."
            rows={5}
          />
          <div className="text-right text-xs text-gray-400 mt-1">{form.message.length}/5000</div>
        </div>

        <Button onClick={handleSubmit} disabled={sending} className="w-full h-12">
          {sending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </span>
          )}
        </Button>
      </div>

      <BottomNav />
    </PageContainer>
  );
}
