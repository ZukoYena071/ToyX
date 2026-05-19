import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

const STATUS_TABS = ["open", "reviewing", "resolved", "dismissed"];

export default function AdminModeration() {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchReports = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}&limit=50`, { credentials: "include" });
      if (res.status === 403) { setReports([]); setTotal(0); return; }
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch { setReports([]); }
    setLoading(false);
  };

  useEffect(() => { fetchReports(statusFilter); }, [statusFilter]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, resolutionNote: resolutionNote || undefined }), credentials: "include" });
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

  if (selected) {
    return (
      <PageContainer className="pb-24">
        <PageHeader title="Report Detail" rightAction={<button onClick={() => setSelected(null)} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>} />
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">{statusIcon(selected.status)}<span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-50">{selected.status}</span></div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Reason: {selected.reason}</p>
            {selected.details && <p className="text-xs text-gray-500 mt-1">{selected.details}</p>}
            <p className="text-xs text-gray-400 mt-2">Created: {new Date(selected.createdAt).toLocaleString()}</p>
          </div>
          {selected.reporter && <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"><p className="text-xs text-gray-500">Reported by</p><p className="text-sm font-medium text-gray-900 dark:text-gray-50">{selected.reporter.firstName || selected.reporter.email}</p></div>}
          {selected.reported && <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"><p className="text-xs text-gray-500">Reported user</p><p className="text-sm font-medium text-gray-900 dark:text-gray-50">{selected.reported.firstName || selected.reported.email}</p></div>}
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
      <PageHeader title="Admin Moderation" rightAction={<Link href="/profile"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button></Link>} />
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4 overflow-x-auto">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all min-h-[36px] ${statusFilter === s ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}`}>
              {s}
            </button>
          ))}
        </div>
        {loading ? <div className="text-center py-12 text-sm text-gray-500">Loading...</div> : reports.length === 0 ? <div className="text-center py-12 text-sm text-gray-500">No reports</div> : (
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
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </PageContainer>
  );
}
