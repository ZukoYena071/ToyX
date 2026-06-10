import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Users, TrendingUp, MapPin, Download, Search, Loader2 } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400 text-center py-6">No signup data yet</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-[2px] h-24 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
            {d.date}: {d.count}
          </div>
          <div
            className="w-full rounded-t bg-purple-400 dark:bg-purple-500 transition-all min-h-[2px]"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminFoundingMembers() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [sort, setSort] = useState("joinedAt");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const perPage = 50;

  const fetchStats = useCallback(async () => {
    try { const r = await fetch("/api/admin/founding-members/stats", { credentials: "include" }); if (r.ok) setStats(await r.json()); } catch {}
  }, []);
  const fetchTrend = useCallback(async () => {
    try { const r = await fetch("/api/admin/founding-members/trend", { credentials: "include" }); if (r.ok) setTrend(await r.json()); } catch {}
  }, []);
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), sort, order });
      if (search) params.set("search", search);
      if (cityFilter) params.set("city", cityFilter);
      const r = await fetch(`/api/admin/founding-members?${params}`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setMembers(d.members || []); setTotal(d.total || 0); setCities(d.cities || []); }
    } catch {} finally { setLoading(false); }
  }, [page, search, cityFilter, sort, order]);

  useEffect(() => { fetchStats(); fetchTrend(); }, [fetchStats, fetchTrend]);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const totalPages = Math.ceil(total / perPage);
  const exportUrl = `/api/admin/founding-members/export?${new URLSearchParams({ ...(search ? { search } : {}), ...(cityFilter ? { city: cityFilter } : {}) }).toString()}`;

  return (
    <PageContainer>
      <PageHeader
        title="Founding Members"
        rightAction={
          <button onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = "/admin"; }} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-4 pb-24">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Members", value: stats.total, icon: <Users className="w-4 h-4 text-purple-500" />, bg: "bg-purple-50 dark:bg-purple-900/20" },
              { label: "Joined Today", value: stats.today, icon: <TrendingUp className="w-4 h-4 text-green-500" />, bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "This Week", value: stats.thisWeek, icon: <TrendingUp className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Top City", value: stats.topCity, icon: <MapPin className="w-4 h-4 text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-900/20", isText: true },
              { label: "Avg Daily (30d)", value: stats.avgDaily, icon: <TrendingUp className="w-4 h-4 text-pink-500" />, bg: "bg-pink-50 dark:bg-pink-900/20" },
            ].map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{card.label}</span></div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <SectionCard>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Daily Signups (30 days)</h3>
          </div>
          <TrendChart data={trend} />
        </SectionCard>

        {stats?.cityBreakdown && stats.cityBreakdown.length > 0 && (
          <SectionCard>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">City Breakdown</h3>
            <div className="space-y-1.5">
              {stats.cityBreakdown.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{c.city}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-50">{c.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search members..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50"
              />
            </div>
            <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <a href={exportUrl}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No founding members found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {[
                        { key: "member_number", label: "#" },
                        { key: "firstName", label: "Name" },
                        { key: "", label: "Email" },
                        { key: "city", label: "City" },
                        { key: "", label: "Joined" },
                        { key: "", label: "Status" },
                        { key: "", label: "Source" },
                      ].map((col) => (
                        <th key={col.label} className={`text-left py-2 px-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.key && "cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"}`}
                          onClick={() => { if (col.key) { if (sort === col.key) setOrder(order === "asc" ? "desc" : "asc"); else { setSort(col.key); setOrder("asc"); } } }}>
                          {col.label} {sort === col.key && (order === "asc" ? "↑" : "↓")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any) => (
                      <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-2.5 px-2 text-gray-900 dark:text-gray-50 font-mono text-xs">{m.memberNumber || "—"}</td>
                        <td className="py-2.5 px-2 font-medium text-gray-900 dark:text-gray-50">{m.firstName}</td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 text-xs">{m.email}</td>
                        <td className="py-2.5 px-2 text-gray-700 dark:text-gray-300">{m.city}</td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 text-xs">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}</td>
                        <td className="py-2.5 px-2"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === "ACTIVATED" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : m.status === "INVITED" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{m.status}</span></td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 text-xs">{m.signupSource || "unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{total} total</span>
                  <div className="flex gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40">Prev</button>
                    <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
