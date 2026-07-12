import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, ThumbsUp, MessageCircle, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Thread = { id: string; slug: string; title: string; vote_score: number; reply_count: number; view_count?: number };
type CatHealth = { name: string; slug: string; threads: number; posts: number };
type TopUser = { username: string; display_name: string | null; points: number; reputation: number };

export function TopContentCard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [cats, setCats] = useState<CatHealth[]>([]);
  const [users, setUsers] = useState<TopUser[]>([]);
  const [tab, setTab] = useState<"threads" | "categories" | "users">("threads");

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: t }, { data: catRows }, { data: uRows }] = await Promise.all([
        supabase.from("threads").select("id, slug, title, vote_score, reply_count").gte("created_at", since).order("vote_score", { ascending: false }).limit(8),
        supabase.from("categories").select("name, slug, threads:threads(count)"),
        supabase.from("profiles").select("username, display_name, points, reputation").order("points", { ascending: false }).limit(8),
      ]);
      setThreads((t ?? []) as Thread[]);
      setCats((catRows ?? []).map((c: any) => ({
        name: c.name, slug: c.slug,
        threads: c.threads?.[0]?.count ?? 0, posts: 0,
      })).sort((a, b) => b.threads - a.threads).slice(0, 8));
      setUsers((uRows ?? []) as TopUser[]);
    })();
  }, []);

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-500" />
          <h3 className="text-lg font-extrabold">Top performers</h3>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-bold">
          {(["threads", "categories", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 capitalize ${tab === t ? "bg-white text-[#0ea5e9] shadow-sm" : "text-slate-600"}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === "threads" && (
        <ul className="space-y-1.5">
          {threads.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${i < 3 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span>
              <Link to="/t/$slug" params={{ slug: t.slug }} className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111827] hover:text-[#0ea5e9]">{t.title}</Link>
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600"><ThumbsUp size={11} /> {t.vote_score}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500"><MessageCircle size={11} /> {t.reply_count}</span>
            </li>
          ))}
          {threads.length === 0 && <li className="p-4 text-center text-xs text-[#9ca3af]">No recent hot threads.</li>}
        </ul>
      )}
      {tab === "categories" && (
        <ul className="space-y-1.5">
          {cats.map((c, i) => (
            <li key={c.slug} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${i < 3 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span>
              <Link to="/c/$slug" params={{ slug: c.slug }} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-[#0ea5e9]">{c.name}</Link>
              <span className="shrink-0 text-xs font-bold text-slate-500">{c.threads} threads</span>
            </li>
          ))}
          {cats.length === 0 && <li className="p-4 text-center text-xs text-[#9ca3af]">No categories.</li>}
        </ul>
      )}
      {tab === "users" && (
        <ul className="space-y-1.5">
          {users.map((u, i) => (
            <li key={u.username} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {i === 0 ? <Trophy size={11} /> : i + 1}
              </span>
              <Link to="/u/$username" params={{ username: u.username }} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-[#0ea5e9]">
                @{u.username} {u.display_name && <span className="text-xs font-normal text-slate-500">· {u.display_name}</span>}
              </Link>
              <span className="shrink-0 text-xs font-bold text-amber-600">{u.points} pts</span>
              <span className="shrink-0 text-xs font-bold text-slate-500">rep {u.reputation}</span>
            </li>
          ))}
          {users.length === 0 && <li className="p-4 text-center text-xs text-[#9ca3af]">No members yet.</li>}
        </ul>
      )}
    </section>
  );
}
