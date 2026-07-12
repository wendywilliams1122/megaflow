import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, MailX, Loader2, RefreshCw, Play } from "lucide-react";

type Stats = {
  total_notifications: number;
  unread_notifications: number;
  digests_sent_7d: number;
  users_with_prefs: number;
  users_muting_all: number;
};

type DigestRow = {
  id: string;
  user_id: string;
  digest_type: string;
  notification_count: number;
  sent_at: string;
};

export function NotificationsPanel({ flash }: { flash: (msg: string, kind?: "ok" | "err") => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<DigestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data: s, error: e1 } = await (supabase.rpc as any)("admin_notification_stats");
      if (e1) throw e1;
      setStats(Array.isArray(s) ? s[0] : s);

      const { data: r, error: e2 } = await (supabase as any)
        .from("notification_digest_log")
        .select("id,user_id,digest_type,notification_count,sent_at")
        .order("sent_at", { ascending: false })
        .limit(25);
      if (e2) throw e2;
      setRecent((r as DigestRow[]) || []);
    } catch (err: any) {
      flash(err?.message || "Failed to load notifications data", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function runDigest(kind: "daily" | "weekly") {
    setRunning(kind);
    try {
      const { data, error } = await (supabase.rpc as any)("run_notification_digests", { _digest_type: kind });
      if (error) throw error;
      flash(`Digest run: ${data ?? 0} users queued`, "ok");
      await load();
    } catch (err: any) {
      flash(err?.message || "Digest run failed", "err");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#0ea5e9]" />
            <h3 className="text-lg font-extrabold text-[#111827]">Notifications & Preferences</h3>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-[#f6f7f8]"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatBox label="Total" value={stats.total_notifications} />
            <StatBox label="Unread" value={stats.unread_notifications} accent="text-orange-600" />
            <StatBox label="Digests (7d)" value={stats.digests_sent_7d} accent="text-sky-600" />
            <StatBox label="Users w/ prefs" value={stats.users_with_prefs} />
            <StatBox label="Muting all" value={stats.users_muting_all} accent="text-red-600" />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail size={18} className="text-[#0ea5e9]" />
          <h3 className="text-lg font-extrabold text-[#111827]">Digest Runs</h3>
        </div>
        <p className="mb-4 text-sm text-[#6b7280]">
          Daily digests run at <b>08:00 UTC</b>, weekly Monday <b>08:15 UTC</b>. You can also trigger a run manually.
        </p>
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => runDigest("daily")}
            disabled={running !== null}
            className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-60"
          >
            {running === "daily" ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Run daily now
          </button>
          <button
            onClick={() => runDigest("weekly")}
            disabled={running !== null}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-[#f6f7f8] disabled:opacity-60"
          >
            {running === "weekly" ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Run weekly now
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-[#f6f7f8] p-4 text-sm text-[#6b7280]">
            <MailX size={14} /> No digest runs yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb]">
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] text-left text-[11px] font-extrabold uppercase tracking-wider text-[#6b7280]">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Count</th>
                  <th className="px-3 py-2">Sent at</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-[#e5e7eb]">
                    <td className="px-3 py-2 font-mono text-[11px] text-[#6b7280]">{r.user_id.slice(0, 8)}…</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${r.digest_type === "weekly" ? "bg-indigo-50 text-indigo-700" : "bg-sky-50 text-sky-700"}`}>
                        {r.digest_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-[#111827]">{r.notification_count}</td>
                    <td className="px-3 py-2 text-[#6b7280]">{new Date(r.sent_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9ca3af]">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent || "text-[#111827]"}`}>{value ?? 0}</p>
    </div>
  );
}
