import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/forum";
import { MessageCircle, Clock, CheckCircle2, Ban, XCircle } from "lucide-react";

export const Route = createFileRoute("/mod-chats")({
  head: () => ({
    meta: [
      { title: "Chats Moderation — MegaFlow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModChatsPage,
});

type Conv = {
  id: string; user_min: string; user_max: string;
  status: "pending" | "active" | "stopped" | "ended";
  approved_at: string | null; status_note: string | null;
  created_at: string; updated_at: string; last_message_at: string | null;
};

function ModChatsPage() {
  const { user, isModerator, loading } = useAuth();
  const [filter, setFilter] = useState<"pending" | "active" | "stopped" | "ended" | "all">("pending");

  const { data: conversations } = useQuery({
    queryKey: ["mod-conversations", filter],
    enabled: !!isModerator,
    queryFn: async () => {
      let q = supabase.from("conversations")
        .select("id, user_min, user_max, status, approved_at, status_note, created_at, updated_at, last_message_at")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return (data ?? []) as Conv[];
    },
  });

  const userIds = useMemo(() => {
    const s = new Set<string>();
    (conversations ?? []).forEach((c) => { s.add(c.user_min); s.add(c.user_max); });
    return [...s];
  }, [conversations]);

  const { data: profileMap } = useQuery({
    queryKey: ["mod-conv-profiles", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name").in("id", userIds);
      const m: Record<string, { username: string; display_name: string | null }> = {};
      (data ?? []).forEach((p: any) => { m[p.id] = p; });
      return m;
    },
  });

  if (loading) return <div className="p-10 text-center text-sm text-[#6b7280]">Loading…</div>;
  if (!user) return <div className="p-10 text-center text-sm text-[#6b7280]">Sign in required.</div>;
  if (!isModerator) { throw redirect({ to: "/" }); }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <MessageCircle className="text-[#0ea5e9]" size={28} />
        <h1 className="text-3xl font-extrabold text-[#111827]">Chats Moderation</h1>
        <Link to="/mod" className="ml-auto rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-bold text-[#374151] hover:border-[#0ea5e9]">
          ← Reports
        </Link>
      </div>
      <p className="mt-2 text-[#6b7280]">Approve first-time chats, pause or end conversations, and step in when needed.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending", "active", "stopped", "ended", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-sm font-bold capitalize ${
              filter === f ? "border-[#0ea5e9] bg-[#0ea5e9] text-white" : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0ea5e9]"
            }`}
          >{f}</button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {(conversations ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-10 text-center text-sm text-[#6b7280]">
            No conversations here.
          </div>
        )}
        {conversations?.map((c) => {
          const a = profileMap?.[c.user_min];
          const b = profileMap?.[c.user_max];
          return (
            <Link
              key={c.id}
              to="/mod-chat/$id"
              params={{ id: c.id }}
              className="block rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm hover:border-[#0ea5e9]"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusPill status={c.status} />
                <span className="text-[#6b7280]">
                  Updated {timeAgo(c.updated_at)}
                  {c.last_message_at && <> · last msg {timeAgo(c.last_message_at)}</>}
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-[#111827]">
                @{a?.username ?? "…"} ↔ @{b?.username ?? "…"}
              </div>
              {c.status_note && <p className="mt-1 text-xs italic text-[#6b7280]">Note: {c.status_note}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; icon: any; label: string }> = {
    pending: { cls: "bg-amber-100 text-amber-700", icon: Clock, label: "Pending" },
    active: { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Active" },
    stopped: { cls: "bg-slate-100 text-slate-700", icon: Ban, label: "Stopped" },
    ended: { cls: "bg-red-100 text-red-700", icon: XCircle, label: "Ended" },
  };
  const c = cfg[status] ?? cfg.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-extrabold uppercase ${c.cls}`}>
      <Icon size={10} /> {c.label}
    </span>
  );
}
