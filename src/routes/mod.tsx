import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/forum";
import { ShieldAlert, Check, X, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/mod")({
  head: () => ({
    meta: [
      { title: "Moderation Queue — MegaFlow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModPage,
});

type Report = {
  id: string; reporter_id: string; target_type: "thread" | "post" | "user";
  target_id: string; reason: string; status: "open" | "resolved" | "dismissed";
  created_at: string; resolution_note: string | null;
};

function ModPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"open" | "resolved" | "dismissed" | "all">("open");

  const { data: isMod, isLoading: roleLoading } = useQuery({
    queryKey: ["is-mod", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).some((r: any) => r.role === "admin" || r.role === "moderator");
    },
    enabled: !!user,
  });

  const { data: reports } = useQuery({
    queryKey: ["reports", filter],
    queryFn: async () => {
      let q = supabase.from("reports")
        .select("id, reporter_id, target_type, target_id, reason, status, created_at, resolution_note")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return (data ?? []) as Report[];
    },
    enabled: !!isMod,
  });

  const targetIds = [...new Set((reports ?? []).map((r) => r.target_id))];
  const reporterIds = [...new Set((reports ?? []).map((r) => r.reporter_id))];

  const { data: threadInfo } = useQuery({
    queryKey: ["report-threads", targetIds.join(",")],
    enabled: targetIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("threads").select("id, title, slug").in("id", targetIds);
      const map: Record<string, { title: string; slug: string }> = {};
      (data ?? []).forEach((t: any) => { map[t.id] = t; });
      return map;
    },
  });
  const { data: postInfo } = useQuery({
    queryKey: ["report-posts", targetIds.join(",")],
    enabled: targetIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("posts")
        .select("id, thread_id, threads(slug, title)").in("id", targetIds);
      const map: Record<string, { slug: string; title: string }> = {};
      (data ?? []).forEach((p: any) => { if (p.threads) map[p.id] = p.threads; });
      return map;
    },
  });
  const { data: userInfo } = useQuery({
    queryKey: ["report-users", [...targetIds, ...reporterIds].join(",")],
    enabled: targetIds.length + reporterIds.length > 0,
    queryFn: async () => {
      const ids = [...new Set([...targetIds, ...reporterIds])];
      const { data } = await supabase.from("profiles").select("id, username").in("id", ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((u: any) => { map[u.id] = u.username; });
      return map;
    },
  });

  async function resolve(id: string, status: "resolved" | "dismissed") {
    const note = status === "resolved" ? prompt("Resolution note (optional):") ?? null : null;
    await supabase.from("reports").update({
      status, resolved_by: user!.id, resolved_at: new Date().toISOString(), resolution_note: note,
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["reports"] });
  }

  if (!user) return <div className="p-10 text-center text-sm text-[#6b7280]">Sign in required.</div>;
  if (roleLoading) return <div className="p-10 text-center text-sm text-[#6b7280]">Loading…</div>;
  if (!isMod) {
    throw redirect({ to: "/" });
  }

  function linkFor(r: Report): { to: string; label: string } | null {
    if (r.target_type === "thread") {
      const t = threadInfo?.[r.target_id];
      return t ? { to: `/t/${t.slug}`, label: t.title } : null;
    }
    if (r.target_type === "post") {
      const p = postInfo?.[r.target_id];
      return p ? { to: `/t/${p.slug}`, label: `Reply in "${p.title}"` } : null;
    }
    const u = userInfo?.[r.target_id];
    return u ? { to: `/u/${u}`, label: `@${u}` } : null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-red-600" size={28} />
        <h1 className="text-3xl font-extrabold text-[#111827]">Moderation Queue</h1>
      </div>
      <p className="mt-2 text-[#6b7280]">Review and act on user reports.</p>

      <div className="mt-6 flex gap-2">
        {(["open", "resolved", "dismissed", "all"] as const).map((f) => (
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
        {(reports ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-10 text-center text-sm text-[#6b7280]">
            No reports.
          </div>
        )}
        {reports?.map((r) => {
          const link = linkFor(r);
          const reporter = userInfo?.[r.reporter_id];
          return (
            <div key={r.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-extrabold uppercase ${
                  r.status === "open" ? "bg-red-100 text-red-700" :
                  r.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                  "bg-slate-100 text-slate-700"
                }`}>{r.status}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-700">{r.target_type}</span>
                <span className="text-[#6b7280]">
                  by <Link to="/u/$username" params={{ username: reporter ?? "" }} className="font-bold hover:text-[#0ea5e9]">@{reporter ?? "…"}</Link>
                  {" · "}{timeAgo(r.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#374151]">{r.reason}</p>
              {link && (
                <a href={link.to} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#0ea5e9] hover:underline">
                  <ExternalLink size={12} /> {link.label}
                </a>
              )}
              {r.resolution_note && (
                <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-[#374151]"><b>Note:</b> {r.resolution_note}</p>
              )}
              {r.status === "open" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => resolve(r.id, "resolved")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                  ><Check size={12} /> Resolve</button>
                  <button
                    onClick={() => resolve(r.id, "dismissed")}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-[#f6f7f8]"
                  ><X size={12} /> Dismiss</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
