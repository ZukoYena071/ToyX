import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Search, Loader2, CheckCircle, XCircle, Award, Star, Download, ChevronDown } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center shrink-0">{icon}</div>
        <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p></div>
      </div>
    </div>
  );
}

function QBadge({ n }: { n: number }) {
  if (n === 4) return <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">{n}/4</span>;
  if (n === 3) return <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{n}/4</span>;
  return <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{n}/4</span>;
}

function csvEscape(v: any) { const s = String(v || ""); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; }

export default function AdminFoundingConsole() {
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const perPage = 50;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL members (up to 200) for full filtering
      const r = await fetch(`/api/admin/founding/members?limit=200&filter=${filter}${search ? `&search=${search}` : ""}`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setAllMembers(d.members || []); }
    } catch {} finally { setLoading(false); }
  }, [search, filter, refreshKey]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    fetch(`/api/admin/founding/members/${selectedId}`, { credentials: "include" }).then(r => r.json()).then(setDetail).catch(() => {});
  }, [selectedId]);

  // Client-side qualification filter
  const filtered = allMembers.filter(m => {
    if (filter === "qualified") return m.qualCount === 4;
    if (filter === "almost_qualified") return m.qualCount === 3;
    if (filter === "not_qualified") return (m.qualCount || 0) < 3;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const displayMembers = filtered.slice(0, page * perPage);
  const selectAll = displayMembers.length > 0 && displayMembers.every(m => selected.has(m.id));

  const toggleSelect = (id: number) => { setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const toggleSelectAll = () => { setSelected(prev => selectAll ? new Set([...prev].filter(x => !displayMembers.some(m => m.id === x))) : new Set([...prev, ...displayMembers.map(m => m.id)])); };

  const doBulk = async (action: "promote" | "revoke") => {
    if (selected.size === 0 || busy) return;
    const ids = [...selected];
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/founding/bulk/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ids }) });
      const d = await r.json();
      if (d.ok) {
        setAllMembers(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: action === "promote" ? "INVITED" : "WAITLIST", accessStatus: action === "promote" ? "beta" : "waitlist" } : m));
        setSelected(new Set()); setFilter("all"); setPage(1); refresh();
      }
    } catch {} finally { setBusy(false); }
  };

  const exportCSV = () => {
    const rows = filtered.map(m => [m.memberNumber || "", m.firstName, m.email, m.city, `${m.qualCount || 0}/4`, m.badgeAwarded ? "Yes" : "No", m.accessStatus || "—"]);
    const csv = [["Member #","Name","Email","City","Qualification","Badge","Access"], ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "founding-members.csv"; a.click();
  };

  const doAction = async (id: number, action: string) => {
    const r = await fetch(`/api/admin/founding/members/${id}/${action}`, { method: "POST", credentials: "include" });
    if (r.ok) {
      // Optimistic update: immediately reflect the change in the table
      setAllMembers(prev => prev.map(m => {
        if (m.id !== id) return m;
        if (action === "promote") return { ...m, status: "INVITED", accessStatus: "beta" };
        if (action === "revoke") return { ...m, status: "WAITLIST", accessStatus: "waitlist" };
        if (action === "award-badge") return { ...m, badgeAwarded: true };
        return m;
      }));
      setFilter("all"); setPage(1); setSelected(new Set()); refresh();
      if (selectedId === id) setSelectedId(null);
    }
  };

  const fullyQualified = allMembers.filter(m => m.qualCount === 4).length;
  const betaAccess = allMembers.filter(m => m.status === "INVITED" || m.status === "ACTIVATED").length;
  const badgesAwarded = allMembers.filter(m => m.badgeAwarded).length;

  const detailQual = detail?.qualChecks;
  const qualLabels: [string, string][] = [["profileComplete", "Profile Complete"], ["emailVerified", "Email Verified"], ["toysListed", "3 Toys Listed"], ["referralComplete", "Referral Complete"]];

  return (
    <PageContainer>
      <PageHeader title="Founding Family Management" rightAction={
        <div className="flex items-center gap-2">
          <Link href="/admin/founding-members"><button className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[36px]">View Analytics</button></Link>
          <Link href="/admin/launch-control"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" /></button></Link>
        </div>
      } />

      <div className="px-4 pt-4 space-y-4 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users className="w-4 h-4 text-violet-500" />} label="Total Members" value={allMembers.length} />
          <StatCard icon={<Star className="w-4 h-4 text-green-500" />} label="Fully Qualified" value={fullyQualified} />
          <StatCard icon={<Award className="w-4 h-4 text-blue-500" />} label="Beta Access" value={betaAccess} />
          <StatCard icon={<Award className="w-4 h-4 text-amber-500" />} label="Badges Awarded" value={badgesAwarded} />
        </div>

        <SectionCard>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search by name, email, member #..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); setSelected(new Set()); }} className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50" /></div>
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); setSelected(new Set()); }} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
              <option value="all">All</option>
              <option value="qualified">Qualified (4/4)</option><option value="almost_qualified">Almost (3/4)</option><option value="not_qualified">Not Qualified (&lt;3)</option>
              <option value="badge_awarded">Has Badge</option><option value="badge_missing">No Badge</option>
              <option value="beta_invited">Beta Invited</option><option value="beta_activated">Beta Activated</option>
            </select>
          </div>

          {/* Bulk action toolbar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{selected.size} selected</span>
              <div className="flex-1" />
              <button onClick={() => doBulk("promote")} disabled={busy} className="px-3 py-1.5 text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-xl disabled:opacity-50 transition-colors">Promote to Beta</button>
              <button onClick={() => doBulk("revoke")} disabled={busy} className="px-3 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-50 transition-colors">Revoke Beta</button>
              <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"><Download className="w-3 h-3" /> CSV</button>
            </div>
          )}

          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div> : displayMembers.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No members found.</p> : (
            <><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 px-2 w-8"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="rounded" /></th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">City</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Qualification</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Badge</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Access</th>
            </tr></thead><tbody>
              {displayMembers.map(m => (
                <tr key={m.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${selected.has(m.id) ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`} onClick={() => setSelectedId(m.id)}>
                  <td className="py-2.5 px-2"><input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} onClick={e => e.stopPropagation()} className="rounded" /></td>
                  <td className="py-2.5 px-2 font-mono text-xs text-gray-600">{m.memberNumber || "—"}</td>
                  <td className="py-2.5 px-2"><p className="font-medium text-gray-900">{m.firstName}</p><p className="text-xs text-gray-400 truncate max-w-[160px]">{m.email}</p></td>
                  <td className="py-2.5 px-2 text-gray-600">{m.city}</td>
                  <td className="py-2.5 px-2"><QBadge n={m.qualCount || 0} /></td>
                  <td className="py-2.5 px-2">{m.badgeAwarded ? <span className="text-green-600 font-medium text-xs">✅</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                  <td className="py-2.5 px-2"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.accessStatus === "live" ? 'bg-green-100 text-green-700' : m.accessStatus === "beta" ? 'bg-blue-100 text-blue-700' : m.accessStatus === "waitlist" ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{m.accessStatus || "—"}</span></td>
                </tr>
              ))}
            </tbody></table></div>
              {totalPages > 1 && <div className="flex items-center justify-between mt-4"><span className="text-xs text-gray-400">{filtered.length} total</span><div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40">Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40">Next</button>
              </div></div>}
            </>
          )}
        </SectionCard>
      </div>

      {selectedId && detail && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedId(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between"><h3 className="text-lg font-bold">#{detail.foundingMember?.memberNumber || "—"} — {detail.foundingMember?.firstName || ""}</h3><button onClick={() => setSelectedId(null)} className="text-gray-400 text-xl">✕</button></div>
              {detail.foundingMember && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-xs">{detail.foundingMember.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">City</span><span>{detail.foundingMember.city}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Joined</span><span>{detail.foundingMember.joinedAt ? new Date(detail.foundingMember.joinedAt).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Badge</span><span>{detail.foundingMember.badgeAwarded ? <span className="text-green-600 font-medium">✅ Awarded</span> : <span className="text-gray-400">—</span>}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account</span><span>{detail.hasAccount ? <CheckCircle className="w-4 h-4 text-green-500 inline" /> : <XCircle className="w-4 h-4 text-gray-300 inline" />}</span></div>
                  {detail.user && <div className="flex justify-between"><span className="text-gray-500">Access</span><span className="capitalize">{detail.user.accessStatus}</span></div>}
                </div>
              )}
              {detailQual && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Qualification ({Object.values(detailQual).filter(Boolean).length}/4)</p>
                  <div className="space-y-2">
                    {qualLabels.map(([key, label]) => (
                      <div key={key} className="flex items-center gap-3 text-sm">
                        <span className={detailQual[key] ? 'text-green-500' : 'text-gray-300'}>{detailQual[key] ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}</span>
                        <span className={detailQual[key] ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {!detail.foundingMember?.badgeAwarded && detail.hasAccount && (
                    <button onClick={() => doAction(detail.foundingMember.id, "award-badge")} className="px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors">Award Badge</button>
                  )}
                  {detail.foundingMember?.status !== "INVITED" && detail.foundingMember?.status !== "ACTIVATED" && (
                    <button onClick={() => doAction(detail.foundingMember.id, "promote")} className="px-4 py-2 text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors">Promote to Beta</button>
                  )}
                  {(detail.foundingMember?.status === "INVITED" || detail.foundingMember?.status === "ACTIVATED") && (
                    <button onClick={() => doAction(detail.foundingMember.id, "revoke")} className="px-4 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">Revoke Beta</button>
                  )}
                </div>
              </div>
              {detail.recentActions?.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activity</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {detail.recentActions.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-gray-600 capitalize">{a.actionType.replace(/_/g, ' ')}</span>
                        <span className="text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
