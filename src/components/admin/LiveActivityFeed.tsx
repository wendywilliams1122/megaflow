import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, MessageSquare, MessageCircle, UserPlus, Flag, ShoppingCart } from "lucide-react";
import { timeAgo } from "@/lib/forum";

type Event = { id: string; kind: string; label: string; sub?: string; at: string; href?: string };

export function LiveActivityFeed() {
  const [events, setEvents] = useState<Event[]>([]);

  const load = async () => {
    const [{ data: threads }, { data: posts }, { data: users }, { data: reports }, { data: orders }] = await Promise.all([
      supabase.from("threads").select("id, slug, title, created_at, author:profiles!threads_author_id_fkey(username)").order("created_at", { ascending: false }).limit(10),
      supabase.from("posts").select("id, thread_id, created_at, author:profiles!posts_author_id_fkey(username), thread:threads(slug, title)").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("id, username, created_at").order("created_at", { ascending: false }).limit(10),
      (supabase as any).from("reports").select("id, category, reason, created_at, status").order("created_at", { ascending: false }).limit(10),
      supabase.from("orders").select("id, product_title, created_at, buyer_name").order("created_at", { ascending: false }).limit(10),
    ]);
    const evs: Event[] = [];
    (threads ?? []).forEach((t: any) => evs.push({
      id: `t-${t.id}`, kind: "thread", label: `New thread: ${t.title}`,
      sub: t.author?.username ? `by @${t.author.username}` : undefined,
      at: t.created_at, href: `/t/${t.slug}`,
    }));
    (posts ?? []).forEach((p: any) => evs.push({
      id: `p-${p.id}`, kind: "post", label: `Reply on: ${p.thread?.title ?? "thread"}`,
      sub: p.author?.username ? `by @${p.author.username}` : undefined,
      at: p.created_at, href: p.thread?.slug ? `/t/${p.thread.slug}` : undefined,
    }));
    (users ?? []).forEach((u: any) => evs.push({
      id: `u-${u.id}`, kind: "user", label: `New member @${u.username}`, at: u.created_at, href: `/u/${u.username}`,
    }));
    (reports ?? []).forEach((r: any) => evs.push({
      id: `r-${r.id}`, kind: "report", label: `Report: ${r.category ?? "flagged"}`, sub: r.reason?.slice(0, 60), at: r.created_at,
    }));
    (orders ?? []).forEach((o: any) => evs.push({
      id: `o-${o.id}`, kind: "order", label: `Order: ${o.product_title}`, sub: `by ${o.buyer_name}`, at: o.created_at,
    }));
    evs.sort((a, b) => (a.at < b.at ? 1 : -1));
    setEvents(evs.slice(0, 40));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const icon = (k: string) => {
    const cls = "h-3.5 w-3.5";
    if (k === "thread") return <MessageSquare className={cls} />;
    if (k === "post") return <MessageCircle className={cls} />;
    if (k === "user") return <UserPlus className={cls} />;
    if (k === "report") return <Flag className={cls} />;
    if (k === "order") return <ShoppingCart className={cls} />;
    return <Activity className={cls} />;
  };
  const color = (k: string) => ({
    thread: "bg-emerald-100 text-emerald-700",
    post: "bg-orange-100 text-orange-700",
    user: "bg-sky-100 text-sky-700",
    report: "bg-rose-100 text-rose-700",
    order: "bg-amber-100 text-amber-700",
  }[k] ?? "bg-slate-100 text-slate-700");

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#0ea5e9]" />
          <h3 className="text-lg font-extrabold">Live activity</h3>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Real-time
        </span>
      </div>
      <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-2 rounded-lg p-2 hover:bg-slate-50">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${color(e.kind)}`}>{icon(e.kind)}</span>
            <div className="min-w-0 flex-1">
              {e.href ? (
                <a href={e.href} className="block truncate text-sm font-semibold text-[#111827] hover:text-[#0ea5e9]">{e.label}</a>
              ) : (
                <p className="truncate text-sm font-semibold text-[#111827]">{e.label}</p>
              )}
              <p className="truncate text-[10px] text-[#6b7280]">
                {e.sub ? `${e.sub} · ` : ""}{timeAgo(e.at)}
              </p>
            </div>
          </li>
        ))}
        {events.length === 0 && <li className="p-4 text-center text-xs text-[#9ca3af]">Nothing recent yet.</li>}
      </ul>
    </section>
  );
}
