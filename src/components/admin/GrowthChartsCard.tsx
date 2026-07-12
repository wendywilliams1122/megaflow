import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, MessageSquare, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

type Row = { day: string; users: number; threads: number; posts: number };

export function GrowthChartsCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: users }, { data: threads }, { data: posts }] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", since),
        supabase.from("threads").select("created_at").gte("created_at", since),
        supabase.from("posts").select("created_at").gte("created_at", since),
      ]);
      const bucket: Record<string, Row> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        bucket[d] = { day: d.slice(5), users: 0, threads: 0, posts: 0 };
      }
      (users ?? []).forEach((r: any) => { const k = r.created_at.slice(0, 10); if (bucket[k]) bucket[k].users++; });
      (threads ?? []).forEach((r: any) => { const k = r.created_at.slice(0, 10); if (bucket[k]) bucket[k].threads++; });
      (posts ?? []).forEach((r: any) => { const k = r.created_at.slice(0, 10); if (bucket[k]) bucket[k].posts++; });
      if (!cancel) { setRows(Object.values(bucket)); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [days]);

  const totals = rows.reduce((acc, r) => ({ users: acc.users + r.users, threads: acc.threads + r.threads, posts: acc.posts + r.posts }), { users: 0, threads: 0, posts: 0 });

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <h3 className="text-lg font-extrabold">Growth</h3>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-bold">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 ${days === d ? "bg-white text-[#0ea5e9] shadow-sm" : "text-slate-600"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-sky-50 p-3">
          <p className="text-[10px] font-bold uppercase text-sky-700"><Users size={10} className="inline" /> New members</p>
          <p className="text-2xl font-extrabold text-sky-900 tabular-nums">{totals.users}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-700"><MessageSquare size={10} className="inline" /> Threads</p>
          <p className="text-2xl font-extrabold text-emerald-900 tabular-nums">{totals.threads}</p>
        </div>
        <div className="rounded-lg bg-orange-50 p-3">
          <p className="text-[10px] font-bold uppercase text-orange-700">Replies</p>
          <p className="text-2xl font-extrabold text-orange-900 tabular-nums">{totals.posts}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#0ea5e9]" /></div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.4} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="users" stroke="#0ea5e9" fill="url(#gU)" strokeWidth={2} />
              <Area type="monotone" dataKey="threads" stroke="#10b981" fill="url(#gT)" strokeWidth={2} />
              <Area type="monotone" dataKey="posts" stroke="#f97316" fill="url(#gP)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
