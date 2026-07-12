import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp, Users, MessageSquare, MessageCircle, DollarSign, Activity,
  Trophy, FolderTree, Clock, Star,
} from "lucide-react";

type DayBucket = { date: string; users: number; threads: number; posts: number };

const DAYS = 30;

function bucketByDay(rows: { created_at: string }[]) {
  const map = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const k = r.created_at.slice(0, 10);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

function Sparkline({ data, color, label }: { data: { date: string; count: number }[]; color: string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const w = 320, h = 80, pad = 4;
  const step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.count / max) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const area = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">{label}</p>
        <p className="text-lg font-extrabold tabular-nums text-[#111827]">{total.toLocaleString()}</p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#g-${label})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function AdminAnalytics() {
  const since = new Date();
  since.setDate(since.getDate() - DAYS + 1);
  const sinceIso = since.toISOString().slice(0, 10) + "T00:00:00Z";

  const { data } = useQuery({
    queryKey: ["admin-analytics", sinceIso],
    queryFn: async () => {
      const [users, threads, posts, top, cats, recentThreads, recentOrders, audit, orders7] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", sinceIso),
        supabase.from("threads").select("created_at").gte("created_at", sinceIso),
        supabase.from("posts").select("created_at").gte("created_at", sinceIso),
        supabase.from("profiles").select("id, username, display_name, points, avatar_url").order("points", { ascending: false }).limit(5),
        supabase.from("categories").select("id, name, color, icon"),
        supabase.from("threads").select("id, slug, title, created_at, author:profiles!threads_author_id_fkey(username)").order("created_at", { ascending: false }).limit(6),
        (supabase as any).from("orders").select("id, product_title, unit_price_cents, currency, quantity, status, created_at").order("created_at", { ascending: false }).limit(6),
        (supabase as any).from("audit_log").select("id, action, actor_email, created_at, target_type").order("created_at", { ascending: false }).limit(8),
        (supabase as any).from("orders").select("unit_price_cents, quantity, status, created_at").gte("created_at", sinceIso),
      ]);

      // Category counts
      const catIds = (cats.data ?? []).map((c: any) => c.id);
      const catCounts = await Promise.all(
        catIds.map((id: string) => supabase.from("threads").select("id", { count: "exact", head: true }).eq("category_id", id)),
      );
      const catList = (cats.data ?? []).map((c: any, i: number) => ({
        ...c, count: catCounts[i].count ?? 0,
      })).sort((a: any, b: any) => b.count - a.count);

      const revenue = ((orders7 as any).data ?? [])
        .filter((o: any) => o.status === "completed")
        .reduce((s: number, o: any) => s + (o.unit_price_cents ?? 0) * (o.quantity ?? 1), 0);

      return {
        userBuckets: bucketByDay(users.data ?? []),
        threadBuckets: bucketByDay(threads.data ?? []),
        postBuckets: bucketByDay(posts.data ?? []),
        top: top.data ?? [],
        categories: catList,
        recentThreads: recentThreads.data ?? [],
        recentOrders: (recentOrders as any).data ?? [],
        audit: (audit as any).data ?? [],
        revenue30: revenue,
        orders30: ((orders7 as any).data ?? []).length,
      };
    },
    staleTime: 60_000,
  });

  if (!data) return <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">Loading analytics…</div>;

  const maxCat = Math.max(1, ...data.categories.map((c: any) => c.count));

  return (
    <div className="space-y-6">
      {/* Trend charts */}
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#0ea5e9]" />
          <h2 className="text-sm font-extrabold">Growth · last {DAYS} days</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Sparkline data={data.userBuckets} color="#0ea5e9" label="New members" />
          <Sparkline data={data.threadBuckets} color="#10b981" label="New threads" />
          <Sparkline data={data.postBuckets} color="#f97316" label="New replies" />
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e5e7eb] bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-90"><DollarSign size={14} /> Revenue · 30d</div>
          <p className="text-2xl font-extrabold tabular-nums">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.revenue30 / 100)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b7280]"><Activity size={14} /> Orders · 30d</div>
          <p className="text-2xl font-extrabold tabular-nums">{data.orders30.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b7280]"><Users size={14} /> Signups · 30d</div>
          <p className="text-2xl font-extrabold tabular-nums">{data.userBuckets.reduce((s: number, b: any) => s + b.count, 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b7280]"><MessageCircle size={14} /> Engagement</div>
          <p className="text-2xl font-extrabold tabular-nums">
            {(data.threadBuckets.reduce((s: number, b: any) => s + b.count, 0) +
              data.postBuckets.reduce((s: number, b: any) => s + b.count, 0)).toLocaleString()}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Threads + replies</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top members */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="text-sm font-extrabold">Top members</h2>
          </div>
          <ul className="space-y-2">
            {data.top.map((u: any, i: number) => (
              <li key={u.id} className="flex items-center gap-3 rounded-lg border border-[#f1f2f4] px-3 py-2 hover:border-sky-200 hover:bg-sky-50/40">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                  i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-[#f6f7f8] text-[#6b7280]"
                }`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link to="/u/$username" params={{ username: u.username }} className="block truncate text-sm font-bold text-[#111827] hover:text-[#0ea5e9]">
                    {u.display_name || u.username}
                  </Link>
                  <p className="truncate text-xs text-[#6b7280]">@{u.username}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0ea5e9] to-indigo-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  <Star size={10} /> {(u.points ?? 0).toLocaleString()}
                </span>
              </li>
            ))}
            {data.top.length === 0 && <li className="text-sm text-[#6b7280]">No members yet.</li>}
          </ul>
        </section>

        {/* Category distribution */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <FolderTree size={18} className="text-indigo-500" />
            <h2 className="text-sm font-extrabold">Top categories</h2>
          </div>
          <ul className="space-y-2">
            {data.categories.slice(0, 6).map((c: any) => (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#111827]">{c.name}</span>
                  <span className="tabular-nums font-bold text-[#6b7280]">{c.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f1f2f4]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.count / maxCat) * 100}%`, background: c.color || "#0ea5e9" }}
                  />
                </div>
              </li>
            ))}
            {data.categories.length === 0 && <li className="text-sm text-[#6b7280]">No categories.</li>}
          </ul>
        </section>

        {/* Recent threads */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-500" />
            <h2 className="text-sm font-extrabold">Latest threads</h2>
          </div>
          <ul className="space-y-2">
            {data.recentThreads.map((t: any) => (
              <li key={t.id} className="flex items-start gap-2 border-b border-[#f1f2f4] pb-2 last:border-0 last:pb-0">
                <Clock size={12} className="mt-1 shrink-0 text-[#9ca3af]" />
                <div className="min-w-0 flex-1">
                  <Link to="/t/$slug" params={{ slug: t.slug }} className="block truncate text-sm font-semibold text-[#111827] hover:text-[#0ea5e9]">
                    {t.title}
                  </Link>
                  <p className="text-[11px] text-[#6b7280]">
                    @{t.author?.username ?? "anonymous"} · {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
            {data.recentThreads.length === 0 && <li className="text-sm text-[#6b7280]">No threads yet.</li>}
          </ul>
        </section>

        {/* Recent audit */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" />
            <h2 className="text-sm font-extrabold">Recent admin activity</h2>
          </div>
          <ul className="space-y-1.5">
            {data.audit.map((a: any) => (
              <li key={a.id} className="flex items-center gap-2 text-xs">
                <span className="rounded bg-[#f6f7f8] px-1.5 py-0.5 font-mono font-bold text-[#374151]">{a.action}</span>
                <span className="truncate text-[#6b7280]">{a.actor_email ?? "system"}</span>
                <span className="ml-auto shrink-0 text-[#9ca3af]">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
            {data.audit.length === 0 && <li className="text-sm text-[#6b7280]">No admin actions yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
