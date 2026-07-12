import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ban, Plus, Trash2 } from "lucide-react";

export function BlockedDomainsCard({ flash }: { flash: (m: string) => void }) {
  const [rows, setRows] = useState<{ id: string; domain: string }[]>([]);
  const [input, setInput] = useState("");

  const load = async () => {
    const { data } = await (supabase as any)
      .from("blocked_email_domains")
      .select("id, domain")
      .order("domain");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const d = input.trim().toLowerCase().replace(/^@/, "");
    if (!d.includes(".")) return flash("Enter a valid domain (e.g. mailinator.com)");
    const { error } = await (supabase as any).from("blocked_email_domains").insert({ domain: d });
    if (error) return flash("Failed: " + error.message);
    setInput("");
    flash("Domain blocked");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("blocked_email_domains").delete().eq("id", id);
    if (error) return flash("Failed: " + error.message);
    load();
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white">
          <Ban size={18} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold">Blocked email domains</h2>
          <p className="text-xs text-[#6b7280]">Signup fails for any email using these domains.</p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="mailinator.com"
          className="min-w-0 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
        />
        <button onClick={add} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600">
          <Plus size={14} /> Add
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5 text-xs">
            <span className="truncate font-semibold text-[#111827]">{r.domain}</span>
            <button onClick={() => remove(r.id)} className="rounded p-1 text-[#6b7280] hover:bg-red-50 hover:text-red-600">
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
