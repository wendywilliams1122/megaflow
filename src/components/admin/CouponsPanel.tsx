import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Plus, Trash2, Loader2, Copy, Check } from "lucide-react";

type Coupon = {
  id: string; code: string; description: string | null;
  discount_type: "percent" | "fixed"; discount_value: number;
  max_uses: number | null; used_count: number;
  starts_at: string | null; expires_at: string | null;
  is_active: boolean; created_at: string;
};

export function CouponsPanel() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "", description: "", discount_type: "percent" as "percent" | "fixed",
    discount_value: 10, max_uses: "", expires_at: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("coupons")
      .select("*").order("created_at", { ascending: false });
    setRows((data as Coupon[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code.trim() || !form.discount_value) return;
    setBusy("create");
    const { error } = await (supabase as any).from("coupons").insert({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    });
    setBusy(null);
    if (error) { alert(error.message); return; }
    setForm({ code: "", description: "", discount_type: "percent", discount_value: 10, max_uses: "", expires_at: "" });
    load();
  };

  const toggle = async (c: Coupon) => {
    setBusy(c.id);
    await (supabase as any).from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    setBusy(null); load();
  };
  const del = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    setBusy(c.id);
    await (supabase as any).from("coupons").delete().eq("id", c.id);
    setBusy(null); load();
  };
  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code); setTimeout(() => setCopied(null), 1200);
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white"><Ticket size={18} /></div>
        <div><h2 className="text-lg font-extrabold">Coupons</h2><p className="text-xs text-[#6b7280]">Discount codes for the marketplace.</p></div>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CODE" className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-bold uppercase" />
          <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm">
            <option value="percent">% off</option>
            <option value="fixed">Fixed (cents)</option>
          </select>
          <input type="number" min={1} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value) || 0 })} placeholder="Value" className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm" />
          <input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Max uses (opt)" className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm" />
          <button disabled={busy === "create"} onClick={create} className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
          </button>
        </div>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="mt-2 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Uses</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]"><Loader2 className="mx-auto animate-spin" size={18} /></td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]">No coupons yet.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold hover:bg-slate-200">
                    {c.code} {copied === c.code ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                  {c.description && <div className="mt-1 text-xs text-[#6b7280]">{c.description}</div>}
                </td>
                <td className="px-4 py-3 text-sm font-bold">{c.discount_type === "percent" ? `${c.discount_value}%` : `$${(c.discount_value/100).toFixed(2)}`}</td>
                <td className="px-4 py-3 text-sm">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="px-4 py-3 text-xs text-[#6b7280]">{c.expires_at ? new Date(c.expires_at).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  <button disabled={busy === c.id} onClick={() => toggle(c)} className={`rounded px-2 py-1 text-xs font-bold ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button disabled={busy === c.id} onClick={() => del(c)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
