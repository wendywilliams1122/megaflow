import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

type Row = { ip: string; users: { id: string; username: string; is_banned: boolean }[] };

export function MultiAccountIPCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ips } = await (supabase as any)
        .from("profile_ips")
        .select("user_id, signup_ip, last_ip");
      const userIds = (ips ?? []).map((r: any) => r.user_id);
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id, username, is_banned").in("id", userIds)
        : { data: [] as any[] };
      const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const map = new Map<string, { id: string; username: string; is_banned: boolean }[]>();
      (ips ?? []).forEach((r: any) => {
        const p = profMap.get(r.user_id);
        if (!p) return;
        const list = [r.signup_ip, r.last_ip].filter(Boolean);
        list.forEach((ip: string) => {
          if (!map.has(ip)) map.set(ip, []);
          const arr = map.get(ip)!;
          if (!arr.find((u) => u.id === p.id)) {
            arr.push({ id: p.id, username: p.username, is_banned: p.is_banned });
          }
        });
      });
      const flagged: Row[] = [];
      map.forEach((users, ip) => {
        if (users.length > 1) flagged.push({ ip, users });
      });
      setRows(flagged);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="mt-4 max-w-2xl space-y-3 rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold">Multi-account IP flags</h2>
          <p className="text-xs text-[#6b7280]">Accounts that share the same IP address (possible duplicates).</p>
        </div>
      </div>

      {loading && <p className="text-sm text-[#6b7280]">Scanning…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-[#6b7280]">No duplicate-IP accounts detected.</p>
      )}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.ip} className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <div className="text-xs font-bold text-[#6b7280]">IP: <span className="font-mono text-[#111827]">{r.ip}</span></div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {r.users.map((u) => (
                <Link key={u.id} to="/u/$username" params={{ username: u.username }}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${u.is_banned ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"} hover:opacity-80`}>
                  @{u.username}{u.is_banned && <span className="text-[9px] uppercase">banned</span>}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
