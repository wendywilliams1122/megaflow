import { Download, Lock } from "lucide-react";
import { useSpoilerAccess } from "@/hooks/use-forum-access";

export type DownloadItem = { url: string; label: string };

export function DownloadList({ items }: { items: DownloadItem[] }) {
  const { canView: hasAccess, loading } = useSpoilerAccess();
  if (!items?.length) return null;

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

      {!loading && !hasAccess && (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <Lock size={11} className="mr-1 inline" />
          Downloads unlock after 10 days of membership and at least one thread you created.
        </p>
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
