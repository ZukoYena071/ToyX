import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, Search, RefreshCw, AlertTriangle } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

const STATUS_TABS = ["all", "open", "reviewing", "resolved", "dismissed"];

export default function AdminModeration() {
  const [reports, setReports] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, open: 0, reviewing: 0, resolved: 0, dismissed: 0 });
  const [statusFilter, setStatusFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchReports = async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}&limit=50`, { credentials: "include" });
      if (res.status === 403) { setError("Not authorized. Admin access required."); setReports([]); setLoading(false); return; }
      if (!res.ok) { setError(`Error ${res.status}: Failed to load reports`); setReports([]); setLoading(false); return; }
      const data = await res.json();
      const reportList = Array.isArray(data) ? data : (data.reports || []);
      setReports(reportList);
      if (data.counts) setCounts(data.counts);
    } catch (e: any) {
      setError(e?.message || "Network error loading reports");
      setReports([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(statusFilter); }, [statusFilter]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, resolutionNote: resolutionNote || undefined }), credentials: "include" });
      if (!res.ok) return;
      setSelected(null);
      setResolutionNote("");
      fetchReports(statusFilter);
    } catch {}
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "open": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "reviewing": return <Search className="w-4 h-4 text-blue-500" />;
      case "resolved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "dismissed": return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };
  const statusColor = (s: string) => {
    switch (s) {
      case "open": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700";
      case "reviewing": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      case "resolved": return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700";
      case "dismissed": return "text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      default: return "";
    }
  };

  if (selected) {
    return (
      <PageContainer className="pb-24">
        <PageHeader title="Report Detail" rightAction={<button onClick={() => setSelected(null)} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>} />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              {statusIcon(selected.status)}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Reason: {selected.reason}</p>
            {selected.details && <p className="text-xs text-gray-500 mt-1">{selected.details}</p>}
            <p className="text-xs text-gray-400 mt-2">Created: {new Date(selected.createdAt).toLocaleString()}</p>
          </div>
          {selected.reporter && <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"><p className="text-xs text-gray-500">Reported by</p><p className="text-sm font-medium text-gray-900 dark:text-gray-50">{selected.reporter.firstName || selected.reporter.email}</p></div>}
          {selected.reported && <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"><p className="text-xs text-gray-500">Reported user</p><p className="text-sm font-medium text-gray-900 dark:text-gray-50">{selected.reported.firstName || selected.reported.email}</p></div>}
          <p className="text-xs text-gray-400">Context: {selected.contextType}{selected.contextId ? ` #${selected.contextId}` : ""}</p>
          {selected.messageSnapshot?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 mb-2">Message snapshot ({selected.messageSnapshot.length} msgs)</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selected.messageSnapshot.map((m: any) => <p key={m.id} className="text-xs text-gray-600 dark:text-gray-400"><span className="font-medium">{m.senderId?.slice(0, 12)}:</span> {m.content}</p>)}
              </div>
            </div>
          )}
          {selected.status !== "resolved" && selected.status !== "dismissed" && (
            <div className="space-y-2">
              <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Resolution note (optional)" className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 min-h-[44px]" rows={2} />
              <div className="flex gap-2">
                <button onClick={() => handleStatusChange(selected.id, "resolved")} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium text-sm min-h-[44px]">Resolve</button>
                <button onClick={() => handleStatusChange(selected.id, "dismissed")} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium text-sm min-h-[44px]">Dismiss</button>
              </div>
            </div>
          )}
        </div>
        <BottomNav />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Admin Moderation"
        rightAction={
          <div className="flex items-center gap-2">
            <button onClick={() => fetchReports(statusFilter)} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/profile"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button></Link>
          </div>
        }
      />
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4 overflow-x-auto">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all min-h-[36px] whitespace-nowrap ${statusFilter === s ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}`}>
              {s} {counts[s] !== undefined && <span className="ml-1 text-[10px] opacity-60">({counts[s]})</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-3">Total reports: {counts.all || 0}</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button onClick={() => fetchReports(statusFilter)} className="mt-2 text-xs font-medium text-red-600 dark:text-red-400 underline min-h-[36px]">Try again</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading...</div>
        ) : !error && reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No reports in this status</p>
            {statusFilter !== "all" && <p className="text-xs text-gray-400 mt-1">Tip: try the "All" tab</p>}
          </div>
        ) : !error && (
          <div className="space-y-2">
            {reports.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)} className="w-full text-left bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(r.status)}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{r.reason}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500">Reported: {r.reported?.firstName || r.reported?.email || 'Unknown'} · By: {r.reporter?.firstName || r.reporter?.email || 'Unknown'}</p>
                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full border ${statusColor(r.status)}`}>{r.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </PageContainer>
  );
}
