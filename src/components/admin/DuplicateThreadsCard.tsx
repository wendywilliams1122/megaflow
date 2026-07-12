import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Loader2, GitMerge, RefreshCw } from "lucide-react";

type Pair = {
  a_id: string; a_title: string; a_slug: string;
  b_id: string; b_title: string; b_slug: string; sim: number;
};

export function DuplicateThreadsCard({ flash }: { flash: (m: string) => void }) {
  const [rows, setRows] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [days, setDays] = useState(14);

  const scan = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("find_similar_threads", { _days: days });
    setLoading(false);
    if (error) { flash(error.message); return; }
    setRows((data as Pair[]) ?? []);
  };

  const merge = async (from: string, to: string, fromTitle: string, toTitle: string) => {
    if (!confirm(`Merge "${fromTitle}" INTO "${toTitle}"?\nAll replies will move to the target and the source will be trashed.`)) return;
    setBusy(from + to);
    const { error } = await (supabase as any).rpc("admin_merge_threads", { _from: from, _to: to });
    setBusy(null);
    if (error) { flash(error.message); return; }
    flash("Threads merged");
    setRows((r) => r.filter((p) => !(p.a_id === from || p.b_id === from)));
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white"><Copy size={18} /></div>
        <div className="flex-1 min-w-0"><h2 className="text-lg font-extrabold">Duplicate threads</h2><p className="text-xs text-[#6b7280]">Find and merge near-duplicate topics.</p></div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280]">
          Last
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs">
            <option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
          </select>
        </label>
        <button disabled={loading} onClick={scan} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Scan
        </button>
      </div>

      {rows.length === 0 && !loading && <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-[#6b7280]">Click Scan to search for duplicates.</p>}

      <div className="space-y-2">
        {rows.map((p) => (
          <div key={p.a_id + p.b_id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">{Math.round(p.sim * 100)}% similar</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <ThreadCard title={p.a_title} slug={p.a_slug} />
              <ThreadCard title={p.b_title} slug={p.b_slug} />
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button disabled={busy === p.a_id + p.b_id} onClick={() => merge(p.a_id, p.b_id, p.a_title, p.b_title)} className="flex items-center gap-1 rounded-md border border-indigo-300 bg-white px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                <GitMerge size={12} /> Merge A → B
              </button>
              <button disabled={busy === p.a_id + p.b_id} onClick={() => merge(p.b_id, p.a_id, p.b_title, p.a_title)} className="flex items-center gap-1 rounded-md border border-indigo-300 bg-white px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                <GitMerge size={12} /> Merge B → A
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThreadCard({ title, slug }: { title: string; slug: string }) {
  return (
    <Link to="/t/$slug" params={{ slug }} className="block rounded-md border border-[#e5e7eb] bg-white p-2 text-sm font-bold hover:border-[#0ea5e9] hover:text-[#0ea5e9]">
      {title}
    </Link>
  );
}
