import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Search, Loader2, CheckCircle, XCircle, Award, Star, UserCheck, ChevronDown, ChevronUp, Shield, ShieldOff } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center shrink-0">{icon}</div>
        <div><p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>{sub && <p className="text-[10px] text-green-600">{sub}</p>}</div>
      </div>
    </div>
  );
}

function QBadge({ n, total }: { n: number; total: number }) {
  if (n === total) return <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">{n}/{total}</span>;
  if (n >= total - 1) return <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{n}/{total}</span>;
  return <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{n}/{total}</span>;
}

export default function AdminFoundingConsole() {
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const perPage = 50;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), filter });
      if (search) params.set("search", search);
      const r = await fetch(`/api/admin/founding/members?${params}`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setMembers(d.members || []); setTotal(d.total || 0); }
    } catch {} finally { setLoading(false); }
  }, [page, search, filter]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    fetch(`/api/admin/founding/members/${selectedId}`, { credentials: "include" }).then(r => r.json()).then(setDetail).catch(() => {});
  }, [selectedId]);

  const doAction = async (id: number, action: string) => {
    const r = await fetch(`/api/admin/founding/members/${id}/${action}`, { method: "POST", credentials: "include" });
    if (r.ok) { fetchMembers(); if (selectedId === id) setSelectedId(null); }
  };

  const filtered = members.filter(m => {
    if (filter === "qualified") return m.qualCount === 4;
    if (filter === "almost_qualified") return m.qualCount === 3;
    if (filter === "not_qualified") return (m.qualCount || 0) < 3;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const displayMembers = filtered.slice(0, perPage);
  const fullyQualified = members.filter(m => m.qualCount === 4).length;
  const betaAccess = members.filter(m => m.status === "INVITED" || m.status === "ACTIVATED").length;
  const badgesAwarded = members.filter(m => m.badgeAwarded).length;

  const detailQual = detail?.qualChecks;
  const qualLabels: [string, string][] = [["profileComplete", "Profile Complete"], ["emailVerified", "Email Verified"], ["toysListed", "3 Toys Listed"], ["referralComplete", "Referral Complete"]];

  return (
    <PageContainer>
      <PageHeader title="Founding Family Management" rightAction={
        <Link href="/admin/launch-control"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" /></button></Link>
      } />

      <div className="px-4 pt-4 space-y-4 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users className="w-4 h-4 text-violet-500" />} label="Total Members" value={total} />
          <StatCard icon={<Star className="w-4 h-4 text-green-500" />} label="Fully Qualified" value={fullyQualified} />
          <StatCard icon={<Shield className="w-4 h-4 text-blue-500" />} label="Beta Access" value={betaAccess} />
          <StatCard icon={<Award className="w-4 h-4 text-amber-500" />} label="Badges Awarded" value={badgesAwarded} />
        </div>

        <SectionCard>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search by name, email, member #..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50" /></div>
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
              <option value="all">All</option>
              <option value="qualified">Qualified (4/4)</option><option value="almost_qualified">Almost (3/4)</option><option value="not_qualified">Not Qualified (&lt;3)</option>
              <option value="registered">Registered</option><option value="not_registered">Not Registered</option>
              <option value="badge_awarded">Has Badge</option><option value="badge_missing">No Badge</option>
              <option value="beta_invited">Beta Invited</option><option value="beta_activated">Beta Activated</option>
            </select>
          </div>

          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div> : displayMembers.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No members found.</p> : (
            <><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">City</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Qualification</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Badge</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Access</th>
            </tr></thead><tbody>
              {displayMembers.map(m => (
                <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedId(m.id)}>
                  <td className="py-2.5 px-2 font-mono text-xs text-gray-600">{m.memberNumber || "—"}</td>
                  <td className="py-2.5 px-2">
                    <p className="font-medium text-gray-900">{m.firstName}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">{m.email}</p>
                  </td>
                  <td className="py-2.5 px-2 text-gray-600">{m.city}</td>
                  <td className="py-2.5 px-2"><QBadge n={m.qualCount || 0} total={4} /></td>
                  <td className="py-2.5 px-2">{m.badgeAwarded ? <span className="text-green-600 font-medium text-xs">✅ Badged</span> : <span className="text-gray-400 text-xs">—</span>}</td>
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
