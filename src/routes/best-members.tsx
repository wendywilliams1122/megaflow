import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/best-members")({
  head: () => ({
    meta: [
      { title: "Best Members — MegaFlow" },
      { name: "description", content: "Top contributors to the MegaFlow community by reputation." },
      { property: "og:title", content: "Best Members — MegaFlow" },
      { property: "og:description", content: "Community leaderboard." },
    ],
  }),
  component: BestMembersPage,
});

function BestMembersPage() {
  const { data: members, isLoading } = useQuery({
    queryKey: ["best-members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, reputation, avatar_url")
        .order("reputation", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Trophy className="text-[#0ea5e9]" size={28} />
        <h1 className="text-3xl font-extrabold text-[#111827]">Best Members</h1>
      </div>
      <p className="mt-2 text-[#6b7280]">Top contributors ranked by community reputation.</p>

      <div className="mt-8 divide-y divide-[#e5e7eb] rounded-2xl border border-[#e5e7eb] bg-white">
        {isLoading && <div className="p-6 text-sm text-[#6b7280]">Loading…</div>}
        {!isLoading && members?.length === 0 && <div className="p-6 text-sm text-[#6b7280]">No members yet.</div>}
        {members?.map((m, i) => (
          <Link
            key={m.username}
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
            </div>
            <div className="text-sm font-bold text-[#0ea5e9]">{m.reputation} pts</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
