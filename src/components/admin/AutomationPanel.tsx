import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cog, Play, Loader2, Clock, CheckCircle2, XCircle, Zap } from "lucide-react";

type Job = { jobname: string; schedule: string; active: boolean; last_run: string | null; last_status: string | null };

const JOB_LABELS: Record<string, { label: string; desc: string }> = {
  megaflow_auto_lock_stale: { label: "Auto-lock stale threads", desc: "Locks threads with no activity for N days (see Site Settings)." },
  megaflow_expire_temp_bans: { label: "Expire temp bans", desc: "Automatically lifts expired temporary bans." },
  megaflow_flush_broadcasts: { label: "Flush scheduled broadcasts", desc: "Sends notifications whose scheduled time has passed." },
};

export function AutomationPanel({ flash }: { flash: (m: string) => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [autoLockDays, setAutoLockDays] = useState(90);

  const load = async () => {
    setLoading(true);
    const [{ data: j }, { data: s }] = await Promise.all([
      (supabase as any).rpc("admin_list_cron_jobs"),
      (supabase as any).from("site_settings").select("auto_lock_stale_days").eq("id", true).maybeSingle(),
    ]);
    setJobs((j as Job[]) ?? []);
    if (s?.auto_lock_stale_days != null) setAutoLockDays(s.auto_lock_stale_days);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const runNow = async (fn: string) => {
    setBusy(fn);
    const { error } = await (supabase as any).rpc(fn);
    setBusy(null);
    if (error) flash(error.message);
    else { flash("Job executed"); load(); }
  };

  const saveDays = async () => {
    setBusy("save");
    await (supabase as any).from("site_settings").update({ auto_lock_stale_days: autoLockDays }).eq("id", true);
    setBusy(null);
    flash("Saved");
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white"><Cog size={18} /></div>
        <div><h2 className="text-lg font-extrabold">Automation</h2><p className="text-xs text-[#6b7280]">Scheduled background jobs keeping the community tidy.</p></div>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-violet-900"><Zap size={14} /> Auto-lock stale threads</div>
        <p className="mt-1 text-xs text-violet-700">Lock any thread that hasn't seen activity in this many days. Set to 0 to disable.</p>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" min={0} value={autoLockDays} onChange={(e) => setAutoLockDays(parseInt(e.target.value) || 0)} className="w-24 rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm" />
          <span className="text-xs font-bold text-violet-900">days</span>
          <button disabled={busy === "save"} onClick={saveDays} className="ml-auto rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {busy === "save" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            <tr><th className="px-4 py-3">Job</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Last run</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center"><Loader2 className="mx-auto animate-spin" size={18} /></td></tr>}
            {!loading && jobs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6b7280]">No scheduled jobs found.</td></tr>}
            {jobs.map((j) => {
              const meta = JOB_LABELS[j.jobname] ?? { label: j.jobname, desc: "" };
              const fn = j.jobname === "megaflow_auto_lock_stale" ? "auto_lock_stale_threads"
                : j.jobname === "megaflow_expire_temp_bans" ? "expire_temp_bans"
                : j.jobname === "megaflow_flush_broadcasts" ? "run_due_broadcasts" : null;
              return (
                <tr key={j.jobname} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold">{meta.label}</div>
                    {meta.desc && <div className="text-xs text-[#6b7280]">{meta.desc}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{j.schedule}</td>
                  <td className="px-4 py-3 text-xs text-[#6b7280]">
                    {j.last_run ? <><Clock size={11} className="mr-1 inline" />{new Date(j.last_run).toLocaleString()}</> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {j.last_status === "succeeded" ? <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={11} /> ok</span>
                      : j.last_status === "failed" ? <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700"><XCircle size={11} /> failed</span>
                      : <span className="text-xs text-[#6b7280]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fn && (
                      <button disabled={busy === fn} onClick={() => runNow(fn)} className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-white px-2 py-1 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50">
                        {busy === fn ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run now
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
