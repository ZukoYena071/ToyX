import { useState } from "react";
import { Flag, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = ["Scam/Fraud", "Harassment", "Spam", "Inappropriate content", "Safety concern", "Other"];

interface ReportUserModalProps {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  reportedName: string;
  contextType?: string;
  contextId?: string;
}

export default function ReportUserModal({ open, onClose, reportedId, reportedName, contextType, contextId }: ReportUserModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(contextType === "chat" || contextType === "exchange");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reason) { toast({ title: "Error", description: "Please select a reason", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${reportedId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined, contextType: contextType || "profile", contextId, alsoBlock }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Report submitted", description: "Thank you. Our moderation team will review it." });
        onClose();
      } else {
        toast({ title: "Error", description: data.message || "Failed to submit report", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Report User</h3>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+24px)] space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Reporting <span className="font-medium text-gray-700 dark:text-gray-200">{reportedName}</span></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all min-h-[44px] ${
                    reason === r ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details <span className="text-xs text-gray-400">(optional)</span></label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Provide additional context..."
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-[44px]" rows={3} maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-1">{details.length}/500</div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Also block this user</span>
          </label>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium text-sm min-h-[44px]">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !reason} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium text-sm min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2">
            <Flag className="w-4 h-4" />
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
