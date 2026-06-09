import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Gift, Star, Search, Loader2, CheckCircle, XCircle, ChevronRight, Award, UserCheck, UserX, Download } from "lucide-react";
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

export default function AdminFoundingConsole() {
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState<any>({});
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
      const sr = await fetch("/api/admin/launch-control/stats", { credentials: "include" });
      if (sr.ok) { const sd = await sr.json(); setStats(sd); }
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

  const totalPages = Math.ceil(total / perPage);

  return (
    <PageContainer>
      <PageHeader title="Founding Family Management" rightAction={
        <Link href="/admin/launch-control"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" /></button></Link>
      } />

      <div className="px-4 pt-4 space-y-4 pb-24">
        {stats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={<Users className="w-4 h-4 text-violet-500" />} label="Total Members" value={stats.foundingFamilies || 0} />
            <StatCard icon={<UserCheck className="w-4 h-4 text-green-500" />} label="Registered" value={stats.total || 0} />
            <StatCard icon={<Award className="w-4 h-4 text-amber-500" />} label="Badges Awarded" value={stats.badgesAwarded || 0} />
            <StatCard icon={<Star className="w-4 h-4 text-purple-500" />} label="Beta" value={stats.beta || 0} />
            <StatCard icon={<UserCheck className="w-4 h-4 text-blue-500" />} label="Live" value={stats.live || 0} />
          </div>
        )}

        <SectionCard>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search by name, email, member #..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50" /></div>
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
              <option value="all">All</option><option value="registered">Registered</option><option value="not_registered">Not Registered</option>
              <option value="badge_awarded">Badge Awarded</option><option value="badge_missing">Badge Missing</option>
              <option value="beta_invited">Beta Invited</option><option value="beta_activated">Beta Activated</option>
            </select>
          </div>

          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div> : members.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No members found.</p> : (
            <><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">City</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Registered</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Badge</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Qual.</th>
              <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase">Beta</th>
            </tr></thead><tbody>
              {members.map(m => (
                <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedId(m.id)}>
                  <td className="py-2.5 px-2 font-mono text-xs text-gray-600">{m.memberNumber || "—"}</td>
                  <td className="py-2.5 px-2 font-medium text-gray-900">{m.firstName}</td>
                  <td className="py-2.5 px-2 text-xs text-gray-500">{m.email}</td>
                  <td className="py-2.5 px-2 text-gray-600">{m.city}</td>
                  <td className="py-2.5 px-2">{m.registered ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</td>
                  <td className="py-2.5 px-2">{m.badgeAwarded ? <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅</span> : <span className="text-xs text-gray-400">—</span>}</td>
                  <td className="py-2.5 px-2"><span className={`text-xs font-bold ${m.qualification >= 75 ? 'text-green-600' : 'text-gray-500'}`}>{m.qualification}%</span></td>
                  <td className="py-2.5 px-2"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === "ACTIVATED" ? 'bg-green-100 text-green-700' : m.status === "INVITED" ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody></table></div>
              {totalPages > 1 && <div className="flex items-center justify-between mt-4"><span className="text-xs text-gray-400">{total} total</span><div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40">Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40">Next</button>
              </div></div>}
            </>
          )}
        </SectionCard>
      </div>

      {/* Detail drawer */}
      {selectedId && detail && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedId(null)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Member Detail</h3><button onClick={() => setSelectedId(null)} className="text-gray-400 text-xl">✕</button></div>

              {detail.foundingMember && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Member #</span><span className="font-bold text-violet-600">#{detail.foundingMember.memberNumber || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{detail.foundingMember.firstName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-xs">{detail.foundingMember.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">City</span><span>{detail.foundingMember.city}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Joined</span><span>{detail.foundingMember.joinedAt ? new Date(detail.foundingMember.joinedAt).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={detail.foundingMember.status === "ACTIVATED" ? "text-green-600 font-medium" : detail.foundingMember.status === "INVITED" ? "text-blue-600 font-medium" : ""}>{detail.foundingMember.status}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account Registered</span><span>{detail.hasAccount ? <CheckCircle className="w-4 h-4 text-green-500 inline" /> : <XCircle className="w-4 h-4 text-gray-300 inline" />}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Badge Awarded</span><span>{detail.foundingMember.badgeAwarded ? '✅' : '—'}</span></div>
                </div>
              )}

              {detail.hasAccount && detail.user && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User Account</p>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Access</span><span>{detail.user.accessStatus}</span></div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {!detail.foundingMember.badgeAwarded && detail.hasAccount && (
                    <button onClick={() => doAction(detail.foundingMember.id, "award-badge")} className="px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors">Award Badge</button>
                  )}
                  {detail.foundingMember.status !== "INVITED" && detail.foundingMember.status !== "ACTIVATED" && (
                    <button onClick={() => doAction(detail.foundingMember.id, "promote")} className="px-4 py-2 text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors">Promote to Beta</button>
                  )}
                  {(detail.foundingMember.status === "INVITED" || detail.foundingMember.status === "ACTIVATED") && (
                    <button onClick={() => doAction(detail.foundingMember.id, "revoke")} className="px-4 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">Revoke Beta</button>
                  )}
                </div>
              </div>

              {detail.recentActions?.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activity Log</p>
                  <div className="space-y-2">
                    {detail.recentActions.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{a.actionType.replace(/_/g, ' ')}</span>
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
