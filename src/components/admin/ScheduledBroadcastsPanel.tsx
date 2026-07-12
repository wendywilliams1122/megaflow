import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, Plus, Trash2, Loader2, Play, XCircle } from "lucide-react";

type Row = {
  id: string; title: string; body: string | null; link: string;
  scheduled_for: string; status: "pending" | "sent" | "cancelled";
  recipients: number | null; sent_at: string | null; created_at: string;
};

export function ScheduledBroadcastsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", link: "/", scheduled_for: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("scheduled_broadcasts")
      .select("*").order("scheduled_for", { ascending: false }).limit(50);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // Flush any due broadcasts silently
    (supabase as any).rpc("run_due_broadcasts").then(() => load()).catch(() => {});
  }, []);

  const create = async () => {
    if (!form.title.trim() || !form.scheduled_for) return;
    setBusy("create");
    const { error } = await (supabase as any).from("scheduled_broadcasts").insert({
      title: form.title.trim(),
      body: form.body.trim() || null,
      link: form.link.trim() || "/",
      scheduled_for: new Date(form.scheduled_for).toISOString(),
    });
    setBusy(null);
    if (error) { alert(error.message); return; }
    setForm({ title: "", body: "", link: "/", scheduled_for: "" });
    load();
  };
  const cancel = async (r: Row) => {
    setBusy(r.id);
    await (supabase as any).from("scheduled_broadcasts").update({ status: "cancelled" }).eq("id", r.id);
    setBusy(null); load();
  };
  const del = async (r: Row) => {
    if (!confirm("Delete?")) return;
    setBusy(r.id);
    await (supabase as any).from("scheduled_broadcasts").delete().eq("id", r.id);
    setBusy(null); load();
  };
  const runNow = async () => {
    setBusy("run");
    await (supabase as any).rpc("run_due_broadcasts");
    setBusy(null); load();
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white"><CalendarClock size={18} /></div>
        <div className="flex-1"><h2 className="text-lg font-extrabold">Scheduled broadcasts</h2><p className="text-xs text-[#6b7280]">Queue notifications to send at a future time.</p></div>
        <button disabled={busy === "run"} onClick={runNow} className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
          <Play size={12} /> Flush due
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 md:grid-cols-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm" />
        <input type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm" />
        <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link" className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm" />
        <button disabled={busy === "create"} onClick={create} className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Schedule
        </button>
        <textarea rows={2} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Body (optional)" className="md:col-span-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Sent to</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="mx-auto animate-spin" size={18} /></td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6b7280]">Nothing scheduled.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="font-bold">{r.title}</div>
                  {r.body && <div className="text-xs text-[#6b7280] line-clamp-1">{r.body}</div>}
                </td>
                <td className="px-4 py-3 text-xs">{new Date(r.scheduled_for).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${r.status === "sent" ? "bg-emerald-100 text-emerald-700" : r.status === "cancelled" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-xs">{r.recipients ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "pending" && <button disabled={busy === r.id} onClick={() => cancel(r)} className="rounded p-1.5 text-amber-600 hover:bg-amber-50"><XCircle size={14} /></button>}
                  <button disabled={busy === r.id} onClick={() => del(r)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
