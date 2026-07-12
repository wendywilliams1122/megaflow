import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, MessageSquare, ThumbsUp, Award, Star } from "lucide-react";
import { LevelBadge, levelFor } from "@/components/LevelBadge";

type Tab = "points" | "reputation" | "threads" | "badges";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — MegaFlow" },
      { name: "description", content: "Top members ranked by points, reputation, threads, and badges." },
      { property: "og:title", content: "Leaderboard — MegaFlow" },
      { property: "og:description", content: "Community leaderboard: points, reputation, threads, and achievements." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("points");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async () => {
      if (tab === "badges") {
        const { data: ubs } = await supabase
          .from("user_badges")
          .select("user_id");
        const counts = new Map<string, number>();
        (ubs ?? []).forEach((r: any) => counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1));
        const ids = [...counts.keys()];
        if (ids.length === 0) return [];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points, reputation")
          .in("id", ids);
        return (profs ?? [])
          .map((p: any) => ({ ...p, metric: counts.get(p.id) ?? 0 }))
          .sort((a, b) => b.metric - a.metric)
          .slice(0, 50);
      }
      if (tab === "threads") {
        const { data: ts } = await supabase.from("threads").select("author_id");
        const counts = new Map<string, number>();
        (ts ?? []).forEach((r: any) => counts.set(r.author_id, (counts.get(r.author_id) ?? 0) + 1));
        const ids = [...counts.keys()];
        if (ids.length === 0) return [];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points, reputation")
          .in("id", ids);
        return (profs ?? [])
          .map((p: any) => ({ ...p, metric: counts.get(p.id) ?? 0 }))
          .sort((a, b) => b.metric - a.metric)
          .slice(0, 50);
      }
      const col = tab === "reputation" ? "reputation" : "points";
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, points, reputation")
        .order(col, { ascending: false })
        .limit(50);
      return (data ?? []).map((p: any) => ({ ...p, metric: p[col] ?? 0 }));
    },
  });

  const metricLabel = tab === "points" ? "pts" : tab === "reputation" ? "rep" : tab === "threads" ? "threads" : "badges";

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "points", label: "Points", icon: Star },
    { id: "reputation", label: "Reputation", icon: ThumbsUp },
    { id: "threads", label: "Threads", icon: MessageSquare },
    { id: "badges", label: "Badges", icon: Award },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Trophy className="text-[#0ea5e9]" size={28} />
        <h1 className="text-3xl font-extrabold text-[#111827]">Leaderboard</h1>
      </div>
      <p className="mt-2 text-[#6b7280]">Top 50 members. Rank up by contributing.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
              tab === id
                ? "border-[#0ea5e9] bg-[#0ea5e9] text-white"
                : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6 divide-y divide-[#e5e7eb] rounded-2xl border border-[#e5e7eb] bg-white">
        {isLoading && <div className="p-6 text-sm text-[#6b7280]">Loading…</div>}
        {!isLoading && (rows?.length ?? 0) === 0 && <div className="p-6 text-sm text-[#6b7280]">No members yet.</div>}
        {rows?.map((m: any, i: number) => (
          <Link
            key={m.id}
            to="/u/$username"
            params={{ username: m.username }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-[#f6f7f8]"
          >
            <div className="w-8 text-center text-lg font-extrabold text-[#6b7280]">
              {i < 3 ? <Medal className={["text-yellow-500", "text-slate-400", "text-amber-700"][i]} /> : i + 1}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0ea5e9] text-sm font-extrabold text-white">
              {m.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate font-semibold text-[#111827]">@{m.username}</div>
              <div className="mt-0.5">
                <LevelBadge points={m.points} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold text-[#0ea5e9]">{m.metric} {metricLabel}</div>
              <div className="text-[10px] uppercase tracking-wide text-[#6b7280]">Lv {levelFor(m.points)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
