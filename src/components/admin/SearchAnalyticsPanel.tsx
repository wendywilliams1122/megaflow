import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

type Analytics = {
  total_searches: number;
  unique_users: number;
  zero_result_searches: number;
  top_queries: { query: string; count: number }[];
  zero_result_queries: { query: string; count: number }[];
};

type Trending = { id: string; title: string; slug: string; vote_score: number; reply_count: number; score: number };

export function SearchAnalyticsPanel({ flash }: { flash: (m: string, k?: "ok" | "err") => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [trending, setTrending] = useState<Trending[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [a, t] = await Promise.all([
        (supabase.rpc as any)("admin_search_analytics", { _days: days }),
        (supabase.rpc as any)("trending_threads", { _days: 7, _limit: 15 }),
      ]);
      if (a.error) throw a.error;
      if (t.error) throw t.error;
      const row = Array.isArray(a.data) ? a.data[0] : a.data;
      setData(row);
      setTrending((t.data as Trending[]) || []);
    } catch (e: any) {
      flash(e?.message || "Failed to load", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[#0ea5e9]" />
            <h3 className="text-lg font-extrabold text-[#111827]">Search Analytics</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs font-bold text-[#374151]"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-[#f6f7f8]"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : data ? (
          <>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Stat label="Total searches" value={data.total_searches} />
              <Stat label="Unique users" value={data.unique_users} accent="text-sky-600" />
              <Stat label="Zero-result" value={data.zero_result_searches} accent="text-red-600" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <QueryList title="Top queries" icon={<TrendingUp size={14} className="text-emerald-600" />} rows={data.top_queries} tone="emerald" />
              <QueryList title="Zero-result queries" icon={<AlertCircle size={14} className="text-red-600" />} rows={data.zero_result_queries} tone="red" />
            </div>
          </>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-orange-600" />
          <h3 className="text-lg font-extrabold text-[#111827]">Trending Threads (7d)</h3>
        </div>
        {trending.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No trending threads yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb]">
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] text-left text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2 text-right">Votes</th>
                  <th className="px-3 py-2 text-right">Replies</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {trending.map((r, i) => (
                  <tr key={r.id} className="border-t border-[#e5e7eb]">
                    <td className="px-3 py-2 font-mono text-[11px] text-[#9ca3af]">{i + 1}</td>
                    <td className="px-3 py-2">
                      <a href={`/t/${r.slug}`} className="font-semibold text-[#111827] hover:text-[#0ea5e9]">{r.title}</a>
                    </td>
                    <td className="px-3 py-2 text-right font-bold">{r.vote_score}</td>
                    <td className="px-3 py-2 text-right">{r.reply_count}</td>
                    <td className="px-3 py-2 text-right text-orange-600 font-bold">{r.score?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9ca3af]">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent || "text-[#111827]"}`}>{value ?? 0}</p>
    </div>
  );
}

function QueryList({
  title, icon, rows, tone,
}: { title: string; icon: React.ReactNode; rows: { query: string; count: number }[]; tone: "emerald" | "red" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700";
  return (
    <div className="rounded-xl border border-[#e5e7eb] p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-[#111827]">{icon} {title}</div>
      {rows.length === 0 ? (
        <p className="text-xs text-[#9ca3af]">No data.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-2.5 py-1.5 text-sm">
              <span className="truncate font-medium text-[#111827]">{r.query || "(empty)"}</span>
              <span className={`ml-2 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${bg}`}>{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
