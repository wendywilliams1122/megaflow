import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Package, RotateCcw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type OrderLite = {
  id: string; unit_price_cents: number; quantity: number;
  currency: string; status: string; product_title: string; created_at: string;
};

export function SalesAnalyticsCard() {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data } = await (supabase as any).from("orders")
        .select("id, unit_price_cents, quantity, currency, status, product_title, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      setOrders((data as OrderLite[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const refunded = orders.filter((o) => o.status === "refunded");
    const revenue = completed.reduce((s, o) => s + o.unit_price_cents * o.quantity, 0);
    const refundedAmt = refunded.reduce((s, o) => s + o.unit_price_cents * o.quantity, 0);
    const aov = completed.length ? revenue / completed.length : 0;
    const topMap = new Map<string, number>();
    completed.forEach((o) => topMap.set(o.product_title, (topMap.get(o.product_title) || 0) + o.unit_price_cents * o.quantity));
    const top = Array.from(topMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const dayMap = new Map<string, number>();
    completed.forEach((o) => {
      const d = o.created_at.slice(0, 10);
      dayMap.set(d, (dayMap.get(d) || 0) + o.unit_price_cents * o.quantity);
    });
    const chart = Array.from(dayMap.entries()).sort().map(([d, v]) => ({ d: d.slice(5), rev: v / 100 }));
    return { revenue, refundedAmt, aov, orders: completed.length, top, chart };
  }, [orders]);

  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white"><DollarSign size={16} /></div>
        <div><h3 className="text-sm font-extrabold">Sales analytics</h3><p className="text-[11px] text-[#6b7280]">Last 30 days</p></div>
      </div>

      {loading ? <div className="py-8 text-center text-sm text-[#6b7280]">Loading…</div> : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Revenue" value={fmt(stats.revenue)} icon={<DollarSign size={14} />} tone="emerald" />
            <Stat label="Orders" value={String(stats.orders)} icon={<Package size={14} />} tone="sky" />
            <Stat label="Avg order" value={fmt(stats.aov)} icon={<TrendingUp size={14} />} tone="indigo" />
            <Stat label="Refunded" value={fmt(stats.refundedAmt)} icon={<RotateCcw size={14} />} tone="rose" />
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v: any) => `$${v}`} />
                <Area type="monotone" dataKey="rev" stroke="#10b981" fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {stats.top.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">Top products</p>
              <ul className="space-y-1.5">
                {stats.top.map(([title, rev]) => (
                  <li key={title} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="truncate font-semibold">{title}</span>
                    <span className="font-bold text-emerald-700">{fmt(rev)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">{icon}{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}
