import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingUp, UsersRound, ShieldAlert, Ban } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Alert = { level: "info" | "warn" | "critical"; title: string; detail: string; href?: string };

export function SuspiciousActivityCard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = Date.now();
      const day = new Date(now - 24 * 3600_000).toISOString();
      const week = new Date(now - 7 * 24 * 3600_000).toISOString();
      const hour = new Date(now - 3600_000).toISOString();

      const [signups24h, signupsPrev, bansWeek, ipDupes, reports24h, warnedUsers] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", day),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(now - 2 * 24 * 3600_000).toISOString()).lt("created_at", day),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true).gte("updated_at", week),
        (supabase as any).from("profile_ips").select("last_ip"),
        (supabase as any).from("reports").select("id", { count: "exact", head: true }).gte("created_at", day),
        (supabase as any).from("profile_moderation").select("user_id", { count: "exact", head: true }).gte("warnings", 2),
      ]);

      const ipMap: Record<string, number> = {};
      (ipDupes.data ?? []).forEach((r: any) => { if (r.last_ip) ipMap[r.last_ip] = (ipMap[r.last_ip] ?? 0) + 1; });
      const sharedIps = Object.entries(ipMap).filter(([, c]) => c >= 3);

      const nAlerts: Alert[] = [];

      const cur = signups24h.count ?? 0;
      const prev = signupsPrev.count ?? 0;
      if (cur > 5 && cur > prev * 3) {
        nAlerts.push({
          level: "warn",
          title: "Signup spike detected",
          detail: `${cur} signups in the last 24h vs ${prev} the day before (${prev > 0 ? Math.round((cur / prev - 1) * 100) : "∞"}% jump).`,
        });
      }
      if (sharedIps.length > 0) {
        nAlerts.push({
          level: "critical",
          title: `${sharedIps.length} IP address${sharedIps.length > 1 ? "es" : ""} shared by multiple accounts`,
          detail: `${sharedIps.slice(0, 3).map(([ip, c]) => `${ip} (${c})`).join(", ")}${sharedIps.length > 3 ? ` +${sharedIps.length - 3} more` : ""}`,
        });
      }
      if ((reports24h.count ?? 0) >= 5) {
        nAlerts.push({
          level: "warn",
          title: `${reports24h.count} new reports in 24h`,
          detail: "Review the reports queue promptly.",
        });
      }
      if ((warnedUsers.count ?? 0) > 0) {
        nAlerts.push({
          level: "info",
          title: `${warnedUsers.count} member${warnedUsers.count === 1 ? "" : "s"} on 2+ warnings`,
          detail: "One more strike may trigger auto-ban.",
        });
      }
      if ((bansWeek.count ?? 0) >= 3) {
        nAlerts.push({
          level: "info",
          title: `${bansWeek.count} bans this week`,
          detail: "Elevated moderation load.",
        });
      }

      if (nAlerts.length === 0) {
        nAlerts.push({ level: "info", title: "All quiet", detail: "No suspicious signals in the last 24 hours." });
      }
      setAlerts(nAlerts);
      setLoading(false);
    })();
  }, []);

  const chip = (l: Alert["level"]) => ({
    info: { cls: "bg-sky-100 text-sky-700 border-sky-200", icon: <TrendingUp size={14} /> },
    warn: { cls: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle size={14} /> },
    critical: { cls: "bg-red-100 text-red-700 border-red-200", icon: <ShieldAlert size={14} /> },
  }[l]);

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-500" />
          <h3 className="text-lg font-extrabold">Suspicious activity</h3>
        </div>
        <span className="text-[10px] font-bold uppercase text-[#6b7280]">Last 24h</span>
      </div>
      {loading ? (
        <p className="p-4 text-center text-sm text-[#6b7280]">Scanning signals…</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => {
            const c = chip(a.level);
            return (
              <li key={i} className={`rounded-lg border p-3 ${c.cls}`}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{a.title}</p>
                    <p className="mt-0.5 text-xs opacity-90">{a.detail}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
