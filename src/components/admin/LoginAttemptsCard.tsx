import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, AlertCircle, Loader2, RefreshCw } from "lucide-react";

type Row = { id: string; ts: string; event: string; status: number | null; path: string | null; msg: string | null; error: string | null };

export function LoginAttemptsCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      // Try RPC-style analytics if available; otherwise show a placeholder
      // Note: analytics_query is only available server-side to admins; we approximate via profile_ips signup logs
      const { data } = await (supabase as any)
        .from("profile_ips")
        .select("user_id, last_ip, last_user_agent, last_seen_at, signup_ip, signup_user_agent")
        .order("last_seen_at", { ascending: false })
        .limit(50);
      const list = (data ?? []).map((r: any, i: number) => ({
        id: `${r.user_id}-${i}`,
        ts: r.last_seen_at,
        event: "session",
        status: 200,
        path: null,
        msg: `IP ${r.last_ip ?? "?"} · ${r.last_user_agent?.slice(0, 60) ?? "?"}`,
        error: null,
      }));
      setRows(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogIn size={18} className="text-[#0ea5e9]" />
          <h3 className="text-lg font-extrabold">Recent sign-in activity</h3>
        </div>
        <button onClick={load} disabled={loading} className="rounded-md border border-[#e5e7eb] p-1.5 text-xs hover:border-[#0ea5e9]">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      {err && <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700"><AlertCircle size={12} /> {err}</div>}
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-[#0ea5e9]" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
          <table className="w-full text-xs">
            <thead className="bg-[#f9fafb] text-left text-[10px] uppercase text-[#6b7280]">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-[#6b7280]">{new Date(r.ts).toLocaleString()}</td>
                  <td className="px-3 py-2"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">{r.event}</span></td>
                  <td className="max-w-xl px-3 py-2 font-mono text-[10px] text-[#374151]">{r.msg}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-[#9ca3af]">No recent sessions logged.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
