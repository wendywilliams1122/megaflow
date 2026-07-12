import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Plus, Trash2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type Rule = {
  id: string; name: string; pattern: string; is_regex: boolean;
  action: string; target_scope: string; is_enabled: boolean;
  hits: number; created_at: string;
};

export function AutomodPanel({ canEdit }: { canEdit: boolean }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", pattern: "", is_regex: false, action: "flag", target_scope: "both" });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("automod_rules")
      .select("*").order("created_at", { ascending: false });
    setRules((data ?? []) as Rule[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name.trim() || !form.pattern.trim()) return toast.error("Name and pattern required");
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await (supabase as any).from("automod_rules").insert({
      ...form, created_by: sess.session?.user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Rule added");
    setForm({ name: "", pattern: "", is_regex: false, action: "flag", target_scope: "both" });
    load();
  };

  const toggle = async (id: string, is_enabled: boolean) => {
    await (supabase as any).from("automod_rules").update({ is_enabled }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await (supabase as any).from("automod_rules").delete().eq("id", id);
    load();
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Zap size={28} />
          <div>
            <h2 className="text-xl font-extrabold">AutoMod Rules</h2>
            <p className="text-sm opacity-90">Keyword and regex rules that auto-flag or hide content when posted.</p>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#111827]">
            <Plus size={14} className="text-[#0ea5e9]" /> Add rule
          </h3>
          <div className="grid gap-2 md:grid-cols-6">
            <input placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="col-span-2 rounded-md border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0ea5e9] focus:outline-none" />
            <input placeholder="Pattern (keyword or regex)" value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}
              className="col-span-2 rounded-md border border-[#e5e7eb] px-3 py-2 text-sm font-mono focus:border-[#0ea5e9] focus:outline-none" />
            <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}
              className="rounded-md border border-[#e5e7eb] px-2 py-2 text-sm focus:border-[#0ea5e9] focus:outline-none">
              <option value="flag">Flag</option>
              <option value="hide">Hide</option>
              <option value="delete">Delete</option>
            </select>
            <select value={form.target_scope} onChange={(e) => setForm({ ...form, target_scope: e.target.value })}
              className="rounded-md border border-[#e5e7eb] px-2 py-2 text-sm focus:border-[#0ea5e9] focus:outline-none">
              <option value="both">Threads + posts</option>
              <option value="thread">Threads only</option>
              <option value="post">Posts only</option>
            </select>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
              <input type="checkbox" checked={form.is_regex} onChange={(e) => setForm({ ...form, is_regex: e.target.checked })} />
              Treat as regex
            </label>
            <button onClick={add} className="rounded-md bg-[#0ea5e9] px-4 py-2 text-sm font-extrabold text-white hover:bg-sky-600">
              Add rule
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-[#0ea5e9]" /></div>
        ) : rules.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6b7280]">No rules yet — add your first automod rule above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] text-left text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Pattern</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Scope</th>
                <th className="px-4 py-2">Hits</th>
                <th className="px-4 py-2">Enabled</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-bold">{r.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.pattern} {r.is_regex && <span className="ml-1 rounded bg-purple-100 px-1 text-[10px] font-bold text-purple-700">regex</span>}</td>
                  <td className="px-4 py-2 text-xs font-bold uppercase">{r.action}</td>
                  <td className="px-4 py-2 text-xs">{r.target_scope}</td>
                  <td className="px-4 py-2 text-xs tabular-nums">{r.hits}</td>
                  <td className="px-4 py-2">
                    <button disabled={!canEdit} onClick={() => toggle(r.id, !r.is_enabled)}
                      className={`h-5 w-9 rounded-full transition-colors ${r.is_enabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${r.is_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canEdit && (
                      <button onClick={() => remove(r.id)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
        <Shield size={14} className="mr-1 inline" />
        Automod runs client-side on new threads/posts for now. Server-side enforcement will be wired into the post creation trigger in a follow-up phase.
      </div>
    </section>
  );
}
