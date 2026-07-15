import { Download, Lock } from "lucide-react";
import { useSpoilerAccess } from "@/hooks/use-forum-access";

export type DownloadItem = { url: string; label: string };

export function DownloadList({ items }: { items: DownloadItem[] }) {
  const access = useSpoilerAccess();
  const { canView: hasAccess, loading, reason, daysOld, hasThread, points, minPoints } = access;
  if (!items?.length) return null;

  const daysLeft = Math.max(0, 10 - daysOld);
  const lockMsg =
    reason === "signed-out"
      ? "Sign in to unlock downloads."
      : reason === "too-new"
      ? `${daysLeft}d left · Day ${daysOld}/10`
      : reason === "no-thread"
      ? "Create 1 thread to unlock"
      : reason === "low-points"
      ? `${points}/${minPoints} pts to unlock`
      : null;

  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0ea5e9] text-white">
          <Download size={13} />
        </span>
        <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#0f172a]">
          {items.length === 1 ? "Download Link" : "Download Links"}
        </h3>
      </div>

      {!loading && !hasAccess && lockMsg && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-800">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={11} /> {lockMsg}
            </span>
            {reason === "too-new" && (
              <span className="text-[10px] font-semibold text-amber-700">+ 1 thread</span>
            )}
          </div>
          {reason === "too-new" && (
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(100, (daysOld / 10) * 100)}%` }}
              />
            </div>
          )}
          {reason === "too-new" && !hasThread && (
            <p className="mt-1 text-[10px] font-semibold text-amber-700">Also post 1 thread</p>
          )}
        </div>
      )}


      <ul className="space-y-2">
        {items.map((d, i) =>
          hasAccess ? (
            <li key={i}>
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer noopener"
                className="dl-btn group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-md hover:shadow-sky-300"
              >
                <span className="dl-shine pointer-events-none absolute inset-0" aria-hidden />
                <span className="relative z-10 truncate">{d.label || "Download"}</span>
                <span className="dl-icon relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Download size={15} />
                </span>
              </a>
            </li>
          ) : (
            <li key={i}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#e5e7eb] bg-white/60 px-4 py-3 text-sm font-bold text-[#6b7280]">
                <span className="truncate">🔒 {d.label || "Locked resource"}</span>
                <Lock size={15} />
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
