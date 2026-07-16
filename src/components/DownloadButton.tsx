import { CheckCircle2, Download, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSpoilerAccess } from "@/hooks/use-forum-access";
import { isValidDownloadUrl } from "@/lib/download-links";

export type DownloadItem = { url: string; label: string };

const WAIT_SECONDS = 10;

export function DownloadList({ items }: { items: DownloadItem[] }) {
  const access = useSpoilerAccess();
  const { canView: hasAccess, loading, reason, daysOld, hasThread, points, minPoints } = access;
  const [pending, setPending] = useState<DownloadItem | null>(null);
  const [unlockedUrls, setUnlockedUrls] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(window.sessionStorage.getItem("megaflow-unlocked-downloads") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [remaining, setRemaining] = useState(WAIT_SECONDS);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const markUnlocked = (url: string) => {
    if (!isValidDownloadUrl(url)) return;
    setUnlockedUrls((current) => {
      const next = new Set(current);
      next.add(url);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("megaflow-unlocked-downloads", JSON.stringify([...next]));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!pending) return;
    const onVis = () => setPaused(document.hidden);
    setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          markUnlocked(pending.url);
          window.open(pending.url, "_blank", "noopener,noreferrer");
          setPending(null);
          setRemaining(WAIT_SECONDS);
          return WAIT_SECONDS;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pending, paused]);

  const startWait = (e: React.MouseEvent, d: DownloadItem) => {
    e.preventDefault();
    if (pending || !isValidDownloadUrl(d.url)) return;
    if (unlockedUrls.has(d.url)) {
      window.open(d.url, "_blank", "noopener,noreferrer");
      return;
    }
    setRemaining(WAIT_SECONDS);
    setPaused(document.hidden);
    setPending(d);
  };

  const cancel = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPending(null);
    setRemaining(WAIT_SECONDS);
  };

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

  const pct = ((WAIT_SECONDS - remaining) / WAIT_SECONDS) * 100;

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
        <div className="space-y-2">
          <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            <Lock size={11} className="mr-1 inline" />
            Downloads unlock after 10 days of membership and at least one thread you created.
          </p>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-800">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={11} /> {lockMsg}
              </span>
              {reason === "too-new" && !hasThread && (
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
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((d, i) =>
          hasAccess && isValidDownloadUrl(d.url) ? (
            <li key={i}>
              {unlockedUrls.has(d.url) ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-300"
                >
                  <span className="truncate">{d.label || "Download"}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    Unlocked <CheckCircle2 size={15} />
                  </span>
                </a>
              ) : (
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => startWait(e, d)}
                className="dl-btn group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-md hover:shadow-sky-300"
              >
                <span className="dl-shine pointer-events-none absolute inset-0" aria-hidden />
                <span className="relative z-10 truncate">{d.label || "Download"}</span>
                <span className="dl-icon relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Download size={15} />
                </span>
              </a>
              )}
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

      {pending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
              <Download className="text-[#0ea5e9]" size={28} />
            </div>
            <h4 className="mb-1 text-lg font-extrabold text-[#0f172a]">
              Preparing your download
            </h4>
            <p className="mb-4 truncate text-xs text-[#6b7280]">{pending.label}</p>

            <div className="relative mx-auto mb-3 h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#e0f2fe" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="45"
                  stroke="#0ea5e9" strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={(2 * Math.PI * 45) * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-[#0f172a]">
                {remaining}
              </div>
            </div>

            {paused ? (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                ⏸ Paused — return to this tab to continue
              </p>
            ) : (
              <p className="mb-3 text-xs font-semibold text-[#6b7280]">
                Please wait {remaining} second{remaining === 1 ? "" : "s"}… Stay on this tab.
              </p>
            )}

            <button
              type="button"
              onClick={cancel}
              className="text-xs font-bold text-[#6b7280] underline hover:text-[#0f172a]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
