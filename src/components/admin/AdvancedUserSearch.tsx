import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, X, Ban, ShieldCheck, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Row = {
  id: string; username: string; display_name: string | null;
  points: number; reputation: number; is_banned: boolean; is_shadow_banned: boolean;
  banned_until: string | null; created_at: string;
  last_ip?: string | null; last_user_agent?: string | null;
};

export function AdvancedUserSearch({ onOpen }: { onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [ip, setIp] = useState("");
  const [ua, setUa] = useState("");
  const [minPoints, setMinPoints] = useState<string>("");
  const [maxPoints, setMaxPoints] = useState<string>("");
  const [joinedAfter, setJoinedAfter] = useState<string>("");
  const [joinedBefore, setJoinedBefore] = useState<string>("");
  const [status, setStatus] = useState<"all" | "banned" | "active" | "shadow" | "temp">("all");

  const run = async () => {
    setLoading(true);
    let query = supabase.from("profiles")
      .select("id, username, display_name, points, reputation, is_banned, is_shadow_banned, banned_until, created_at")
      .order("created_at", { ascending: false }).limit(200);
    if (q) query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    if (minPoints) query = query.gte("points", parseInt(minPoints, 10));
    if (maxPoints) query = query.lte("points", parseInt(maxPoints, 10));
    if (joinedAfter) query = query.gte("created_at", new Date(joinedAfter).toISOString());
    if (joinedBefore) query = query.lte("created_at", new Date(joinedBefore).toISOString());
    if (status === "banned") query = query.eq("is_banned", true);
    if (status === "active") query = query.eq("is_banned", false);
    if (status === "shadow") query = query.eq("is_shadow_banned", true);
    if (status === "temp") query = query.not("banned_until", "is", null);

    const { data } = await query;
    let list = ((data ?? []) as Row[]);

    if (ip || ua) {
      const ids = list.map((r) => r.id);
      if (ids.length > 0) {
        let ipQuery = (supabase as any).from("profile_ips").select("user_id, last_ip, last_user_agent").in("user_id", ids);
        if (ip) ipQuery = ipQuery.ilike("last_ip", `%${ip}%`);
        if (ua) ipQuery = ipQuery.ilike("last_user_agent", `%${ua}%`);
        const { data: ipRows } = await ipQuery;
        const ipMap: Record<string, any> = {};
        (ipRows ?? []).forEach((r: any) => { ipMap[r.user_id] = r; });
        list = list.filter((r) => ipMap[r.id]).map((r) => ({ ...r, last_ip: ipMap[r.id].last_ip, last_user_agent: ipMap[r.id].last_user_agent }));
      }
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { run(); /* initial */ /* eslint-disable-next-line */ }, []);

  const reset = () => {
    setQ(""); setIp(""); setUa(""); setMinPoints(""); setMaxPoints("");
    setJoinedAfter(""); setJoinedBefore(""); setStatus("all");
  };

  return (
    <section className="space-y-3 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-[#0ea5e9]" />
        <h3 className="text-sm font-extrabold">Advanced member search</h3>
        <button onClick={reset} className="ml-auto text-[10px] font-bold uppercase text-[#6b7280] hover:text-red-600">Reset</button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="relative col-span-2">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Username / display name"
            className="w-full rounded-md border border-[#e5e7eb] px-3 py-1.5 pl-7 text-xs focus:border-[#0ea5e9] focus:outline-none" />
        </div>
        <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP contains…"
          className="rounded-md border border-[#e5e7eb] px-2 py-1.5 text-xs font-mono focus:border-[#0ea5e9] focus:outline-none" />
        <input value={ua} onChange={(e) => setUa(e.target.value)} placeholder="Device / UA contains…"
          className="rounded-md border border-[#e5e7eb] px-2 py-1.5 text-xs focus:border-[#0ea5e9] focus:outline-none" />
        <input value={minPoints} onChange={(e) => setMinPoints(e.target.value)} placeholder="Min points" type="number"
          className="rounded-md border border-[#e5e7eb] px-2 py-1.5 text-xs focus:border-[#0ea5e9] focus:outline-none" />
        <input value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} placeholder="Max points" type="number"
          className="rounded-md border border-[#e5e7eb] px-2 py-1.5 text-xs focus:border-[#0ea5e9] focus:outline-none" />
        <input value={joinedAfter} onChange={(e) => setJoinedAfter(e.target.value)} type="date"
          className="rounded-md border border-[#e5e7eb] px-2 py-1.5 text-xs focus:border-[#0ea5e9] focus:outline-none" />
        <input value={joinedBefore} onChange={(e) => setJoinedBefore(e.target.value)} type="date"
          className="rounded-md border border-[#e5e7eb] px-2 py-1.5 text-xs focus:border-[#0ea5e9] focus:outline-none" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-[10px] font-bold uppercase">
          {(["all", "active", "banned", "shadow", "temp"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-md px-2 py-1 ${status === s ? "bg-white text-[#0ea5e9] shadow-sm" : "text-slate-600"}`}>{s}</button>
          ))}
        </div>
        <button onClick={run} className="ml-auto rounded-md bg-[#0ea5e9] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-sky-600">
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
        <table className="w-full text-xs">
          <thead className="bg-[#f9fafb] text-left text-[10px] uppercase text-[#6b7280]">
            <tr>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last IP / UA</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-bold">
                  @{r.username}
                  {r.display_name && <span className="ml-1 text-[10px] font-normal text-slate-500">· {r.display_name}</span>}
                </td>
                <td className="px-3 py-2 text-[#6b7280]">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 tabular-nums">{r.points} <span className="text-[10px] text-slate-500">/ rep {r.reputation}</span></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.is_banned && <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-red-700"><Ban size={8} className="inline" /> Banned</span>}
                    {r.banned_until && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-orange-700">Temp</span>}
                    {r.is_shadow_banned && <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-purple-700"><EyeOff size={8} className="inline" /> Shadow</span>}
                    {!r.is_banned && !r.is_shadow_banned && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700"><ShieldCheck size={8} className="inline" /> OK</span>}
                  </div>
                </td>
                <td className="max-w-xs px-3 py-2 font-mono text-[10px] text-[#6b7280]">
                  {r.last_ip ? <><div>{r.last_ip}</div><div className="truncate">{r.last_user_agent}</div></> : <span className="italic">—</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => onOpen(r.id)} className="rounded border border-[#e5e7eb] px-2 py-1 text-[10px] font-bold hover:border-sky-300 hover:text-sky-600">View</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={6} className="p-6 text-center text-[#9ca3af]">No members match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
