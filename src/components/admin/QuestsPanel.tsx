import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, Plus, Trash2, Loader2, Trophy } from "lucide-react";

type Quest = {
  id: string; title: string; description: string | null;
  metric: "threads" | "posts" | "upvotes_received" | "points";
  target: number; reward_points: number; reward_badge_id: string | null;
  starts_at: string; ends_at: string | null; is_active: boolean;
};

export function QuestsPanel({ flash }: { flash: (m: string) => void }) {
  const [rows, setRows] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", metric: "threads" as Quest["metric"],
    target: 5, reward_points: 50, ends_at: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("quests")
      .select("*").order("created_at", { ascending: false });
    setRows((data as Quest[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) return;
    setBusy("create");
    const { error } = await (supabase as any).from("quests").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      metric: form.metric,
      target: form.target,
      reward_points: form.reward_points,
      ends_at: form.ends_at || null,
    });
    setBusy(null);
    if (error) { flash(error.message); return; }
    setForm({ title: "", description: "", metric: "threads", target: 5, reward_points: 50, ends_at: "" });
    load();
  };
  const toggle = async (q: Quest) => {
    setBusy(q.id);
    await (supabase as any).from("quests").update({ is_active: !q.is_active }).eq("id", q.id);
    setBusy(null); load();
  };
  const del = async (q: Quest) => {
    if (!confirm(`Delete quest "${q.title}"?`)) return;
    setBusy(q.id);
    await (supabase as any).from("quests").delete().eq("id", q.id);
    setBusy(null); load();
  };

  const metricLabel: Record<Quest["metric"], string> = {
    threads: "Threads created", posts: "Replies posted",
    upvotes_received: "Upvotes received", points: "Points earned",
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white"><Target size={18} /></div>
        <div><h2 className="text-lg font-extrabold">Quests</h2><p className="text-xs text-[#6b7280]">Time-boxed challenges that reward members with points or badges.</p></div>
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" className="md:col-span-2 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm" />
          <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value as any })} className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm">
            {Object.entries(metricLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="number" min={1} value={form.target} onChange={(e) => setForm({ ...form, target: parseInt(e.target.value) || 1 })} placeholder="Target" className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm" />
          <input type="number" min={0} value={form.reward_points} onChange={(e) => setForm({ ...form, reward_points: parseInt(e.target.value) || 0 })} placeholder="Reward pts" className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm" />
          <button disabled={busy === "create"} onClick={create} className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
          </button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm" placeholder="Ends at" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {loading && <div className="col-span-full text-center py-8"><Loader2 className="mx-auto animate-spin" /></div>}
        {!loading && rows.length === 0 && <p className="col-span-full rounded-lg bg-slate-50 p-6 text-center text-sm text-[#6b7280]">No quests yet.</p>}
        {rows.map((q) => (
          <div key={q.id} className="rounded-lg border border-[#e5e7eb] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-extrabold">{q.title}</h3>
                  {q.is_active ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
                    : <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">Off</span>}
                </div>
                {q.description && <p className="mt-1 text-xs text-[#6b7280]">{q.description}</p>}
              </div>
              <div className="flex gap-1">
                <button disabled={busy === q.id} onClick={() => toggle(q)} className="rounded p-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">{q.is_active ? "Pause" : "Enable"}</button>
                <button disabled={busy === q.id} onClick={() => del(q)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md bg-slate-50 p-2"><p className="text-[10px] font-bold uppercase text-[#6b7280]">Goal</p><p className="font-extrabold">{q.target} {metricLabel[q.metric]}</p></div>
              <div className="rounded-md bg-amber-50 p-2"><p className="text-[10px] font-bold uppercase text-amber-700">Reward</p><p className="font-extrabold text-amber-800">+{q.reward_points} pts</p></div>
              <div className="rounded-md bg-slate-50 p-2"><p className="text-[10px] font-bold uppercase text-[#6b7280]">Ends</p><p className="font-extrabold">{q.ends_at ? new Date(q.ends_at).toLocaleDateString() : "—"}</p></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --------- Weekly leaderboard card for the overview ----------

type Snap = {
  user_id: string; points_earned: number; threads_created: number; posts_created: number;
  profile: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function WeeklyLeaderboardCard() {
  const [rows, setRows] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Get most recent snapshot week
      const { data: weeks } = await (supabase as any).from("weekly_snapshots")
        .select("week_start").order("week_start", { ascending: false }).limit(1);
      const w = weeks?.[0]?.week_start;
      if (!w) { setLoading(false); return; }
      const { data } = await (supabase as any).from("weekly_snapshots")
        .select("user_id, points_earned, threads_created, posts_created, profile:profiles!inner(username, display_name, avatar_url)")
        .eq("week_start", w).order("points_earned", { ascending: false }).limit(10);
      setRows((data as Snap[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500 text-white"><Trophy size={16} /></div>
        <div><h3 className="text-sm font-extrabold">Weekly leaderboard</h3><p className="text-[11px] text-[#6b7280]">Top members from last completed week</p></div>
      </div>
      {loading ? <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin" /></div>
        : rows.length === 0 ? <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-[#6b7280]">First snapshot rolls Monday.</p>
        : <ol className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={r.user_id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-slate-300 text-slate-800" : i === 2 ? "bg-amber-700 text-white" : "bg-white text-[#6b7280]"}`}>{i + 1}</span>
              {r.profile?.avatar_url ? <img src={r.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                : <div className="h-7 w-7 rounded-full bg-slate-300" />}
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{r.profile?.display_name || r.profile?.username || "—"}</p>
                <p className="text-[10px] text-[#6b7280]">{r.threads_created}t · {r.posts_created}r</p></div>
              <span className="font-extrabold text-amber-700">{r.points_earned}</span>
            </li>
          ))}
        </ol>}
    </section>
  );
}
