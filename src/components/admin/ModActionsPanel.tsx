import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Search, Loader2, Filter } from "lucide-react";

type Row = {
  id: string; actor_id: string | null; target_type: string; target_id: string | null;
  action: string; reason: string | null; metadata: any; created_at: string;
  actor?: { username: string; display_name: string | null } | null;
};

export function ModActionsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("all");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      let query = (supabase as any).from("mod_actions")
        .select("id, actor_id, target_type, target_id, action, reason, metadata, created_at")
        .order("created_at", { ascending: false }).limit(300);
      if (action !== "all") query = query.eq("action", action);
      const { data } = await query;
      const list = (data ?? []) as Row[];
      const actorIds = [...new Set(list.map((r) => r.actor_id).filter(Boolean))] as string[];
      let actors: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: profs } = await supabase.from("profiles")
          .select("id, username, display_name").in("id", actorIds);
        (profs ?? []).forEach((p: any) => { actors[p.id] = p; });
      }
      const merged = list.map((r) => ({ ...r, actor: r.actor_id ? actors[r.actor_id] : null }));
      const filtered = q
        ? merged.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
        : merged;
      if (!cancel) { setRows(filtered); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [q, action]);

  const actionColors: Record<string, string> = {
    "user.temp_ban": "bg-orange-100 text-orange-700",
    "user.ban": "bg-red-100 text-red-700",
    "user.unban": "bg-emerald-100 text-emerald-700",
    "user.shadow_ban": "bg-purple-100 text-purple-700",
    "user.shadow_unban": "bg-slate-100 text-slate-700",
    "user.warn": "bg-amber-100 text-amber-700",
    "thread.delete": "bg-rose-100 text-rose-700",
    "thread.restore": "bg-emerald-100 text-emerald-700",
    "thread.lock": "bg-slate-100 text-slate-700",
    "post.delete": "bg-rose-100 text-rose-700",
    "report.resolve": "bg-sky-100 text-sky-700",
  };

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-[#0ea5e9]" />
          <h2 className="text-lg font-extrabold">Moderation Actions</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{rows.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reason / target…"
              className="w-56 rounded-lg border border-[#e5e7eb] px-3 py-1.5 pl-8 text-sm focus:border-[#0ea5e9] focus:outline-none" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2 py-1 text-xs">
            <Filter size={12} />
            <select value={action} onChange={(e) => setAction(e.target.value)} className="bg-transparent text-xs font-semibold focus:outline-none">
              <option value="all">All actions</option>
              <option value="user.temp_ban">Temp ban</option>
              <option value="user.unban">Unban</option>
              <option value="user.shadow_ban">Shadow ban</option>
              <option value="user.shadow_unban">Shadow unban</option>
              <option value="thread.delete">Thread delete</option>
              <option value="thread.restore">Thread restore</option>
              <option value="report.resolve">Report resolve</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-[#0ea5e9]" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6b7280]">No moderation actions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] text-left text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Actor</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#f9fafb]">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-[#6b7280]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-xs font-semibold">
                    {r.actor ? `@${r.actor.username}` : <span className="text-[#9ca3af]">system</span>}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${actionColors[r.action] ?? "bg-slate-100 text-slate-700"}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs font-mono">
                    {r.target_type}:{r.target_id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="max-w-md px-4 py-2 text-xs text-[#374151]">
                    {r.reason || <span className="italic text-[#9ca3af]">no reason</span>}
                    {r.metadata && Object.keys(r.metadata).length > 0 && (
                      <span className="ml-2 text-[10px] text-[#9ca3af]">
                        {Object.entries(r.metadata).map(([k, v]) => `${k}:${String(v).slice(0, 30)}`).join(" · ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
