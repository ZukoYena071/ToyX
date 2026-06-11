import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Loader2, Search, TrendingUp, Target, Gift, Star, UserCheck, UserPlus } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
      {sub && <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">{sub}</p>}
    </div>
  );
}

function LaunchProgress({ label, current, target }: { label: string; current: number; target: number }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{label}</span>
        <span>{current} / {target} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminLaunchControl() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const perPage = 25;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), status: statusFilter });
      if (search) params.set("search", search);
      const [sr, ur] = await Promise.all([
        fetch("/api/admin/launch-control/stats", { credentials: "include" }).then(r => r.json()),
        fetch(`/api/admin/launch-control/users?${params}`, { credentials: "include" }).then(r => r.json()),
      ]);
      setStats(sr);
      setUsers(ur.users || []);
      setTotal(ur.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / perPage);
  const s = stats || {};
  const launchPct = s.settings ? Math.round((((s.foundingFamilies || 0) / (s.settings.familiesTarget || 100)) * 100 + ((s.totalListings || 0) / (s.settings.listingsTarget || 500)) * 100 + ((s.beta || 0) / (s.settings.betaTarget || 50)) * 100) / 3) : 0;

  return (
    <PageContainer>
      <PageHeader title="Launch Control" rightAction={
        <button onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = "/admin"; }} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" /></button>
      } />
      <p className="px-4 text-xs text-gray-500 dark:text-gray-400 -mt-2">Monitor launch readiness and community growth metrics.</p>

      <div className="px-4 pt-4 space-y-4 pb-24">
        {stats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard icon={<Users className="w-4 h-4 text-violet-500" />} label="Total Users" value={s.total || 0} />
              <StatCard icon={<UserPlus className="w-4 h-4 text-blue-500" />} label="Waitlist" value={s.waitlist || 0} />
              <StatCard icon={<UserCheck className="w-4 h-4 text-amber-500" />} label="Beta Users" value={s.beta || 0} sub="Active marketplace participants" />
              <StatCard icon={<Star className="w-4 h-4 text-green-500" />} label="Live" value={s.live || 0} />
              <StatCard icon={<Users className="w-4 h-4 text-purple-500" />} label="Founders" value={s.foundingFamilies || 0} sub={`${s.badgesAwarded || 0} badges awarded`} />
              <StatCard icon={<Gift className="w-4 h-4 text-pink-500" />} label="Toys Listed" value={s.totalListings || 0} />
              <StatCard icon={<TrendingUp className="w-4 h-4 text-teal-500" />} label="Referrals" value={s.qualifiedReferrals || 0} />
            </div>

            {s.settings && (
              <SectionCard>
                <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-violet-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Launch Readiness</h3></div>
                <div className="space-y-3">
                  <LaunchProgress label="Founding Families" current={s.foundingFamilies || 0} target={s.settings.familiesTarget} />
                  <LaunchProgress label="Toys Listed" current={s.totalListings || 0} target={s.settings.listingsTarget} />
                  <LaunchProgress label="Beta Users" current={s.beta || 0} target={s.settings.betaTarget} />
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">Overall readiness: <strong className="text-gray-700 dark:text-gray-300">{launchPct}%</strong></p>
                <p className="text-xs text-gray-400 text-center">Launch date: <strong className="text-gray-700 dark:text-gray-300">{s.settings.launchDate ? new Date(s.settings.launchDate).toLocaleDateString() : "Not set"}</strong></p>
              </SectionCard>
            )}

            {stats && (
              <SectionCard>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Recommended Beta Candidates</h3>
                {(() => {
                  const candidates = users.filter(u => u.accessStatus === "waitlist" && u.score >= (s.settings?.betaThreshold || 4)).sort((a, b) => b.score - a.score).slice(0, 5);
                  if (candidates.length === 0) return <p className="text-xs text-gray-400">No candidates above threshold yet.</p>;
                  return <div className="space-y-2">{candidates.map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{u.firstName || u.email}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                      <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{u.score?.toFixed(1)}</span>
                    </div>
                  ))}</div>;
                })()}
              </SectionCard>
            )}

            <SectionCard>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50" /></div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
                  <option value="all">All</option><option value="waitlist">Waitlist</option><option value="beta">Beta</option><option value="live">Live</option>
                </select>
              </div>
              {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div> : users.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No users found.</p> : (
                <><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Listings</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="text-left py-2 px-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                </tr></thead><tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelected(u)}>
                      <td className="py-2.5 px-2 font-medium text-gray-900 dark:text-gray-50">{u.firstName || "—"}</td>
                      <td className="py-2.5 px-2"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.accessStatus === "live" ? "bg-green-100 text-green-700" : u.accessStatus === "beta" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{u.accessStatus}</span></td>
                      <td className="py-2.5 px-2 font-bold text-violet-600">{u.score?.toFixed(1) || "0"}</td>
                      <td className="py-2.5 px-2 text-gray-600">{u.toyCount || 0}</td>
                      <td className="py-2.5 px-2 text-gray-600">{u.referralCount || 0}</td>
                      <td className="py-2.5 px-2 text-gray-500 text-xs">{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody></table></div>
                  {totalPages > 1 && <div className="flex items-center justify-between mt-4"><span className="text-xs text-gray-400">{total} total</span><div className="flex gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40">Prev</button>
                    <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40">Next</button>
                  </div></div>}
                </>
              )}
            </SectionCard>
          </>
        ) : <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>}
      </div>

      {/* User detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelected(null)}>
          <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">{selected.firstName || selected.email}</h3><button onClick={() => setSelected(null)} className="text-gray-400">✕</button></div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{selected.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Access</span><span className={`font-medium ${selected.accessStatus === "live" ? "text-green-600" : selected.accessStatus === "beta" ? "text-amber-600" : ""}`}>{selected.accessStatus}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contribution Score</span><span className="font-bold text-violet-600">{selected.score?.toFixed(1) || "0"} / 10</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Toys Listed</span><span>{selected.toyCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Qualified Referrals</span><span>{selected.referralCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Founding Member</span><span>{selected.foundingMember ? "✅" : "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Days Since Join</span><span>{selected.daysSinceJoin || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last Active</span><span className="text-xs">{selected.lastActive ? new Date(selected.lastActive).toLocaleDateString() : "—"}</span></div>
              {selected.breakdown?.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-3"><p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Score Breakdown</p>
                  {selected.breakdown.map((b: any, i: number) => <div key={i} className="flex justify-between text-xs py-1"><span>{b.label}</span><span className="font-medium">+{b.points}</span></div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
