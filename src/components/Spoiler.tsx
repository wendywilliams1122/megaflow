import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useSpoilerAccess } from "@/hooks/use-forum-access";

export function Spoiler({ children }: { children: React.ReactNode }) {
  const { canView, loading, reason, daysOld, hasThread } = useSpoilerAccess();
  const [revealed, setRevealed] = useState(false);

  if (loading) {
    return (
      <div className="my-2 rounded-lg border border-dashed border-[#e5e7eb] bg-slate-50 px-4 py-3 text-xs text-[#6b7280]">
        Checking access…
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="my-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="mb-1 flex items-center gap-2 font-extrabold">
          <Lock size={15} /> Hidden resource
        </div>
        <p className="text-xs leading-6">
          {reason === "signed-out" && (
            <>
              <Link to="/auth" search={{ mode: "signin" }} className="font-bold underline">Sign in</Link>{" "}
              to see hidden resources. You also need to be a member for 10+ days and have created at least one thread.
            </>
          )}
          {reason === "too-new" && (
            <>Your account is {daysOld} day{daysOld === 1 ? "" : "s"} old. Come back in {10 - daysOld} more day{10 - daysOld === 1 ? "" : "s"} to unlock hidden resources.</>
          )}
          {reason === "no-thread" && (
            <>You need to <Link to="/new" className="font-bold underline">create at least one thread</Link> before you can view hidden resources.</>
          )}
          {!reason && !hasThread && <>Membership requirements not met.</>}
        </p>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-lg border border-sky-200 bg-sky-50/60">
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-sky-700 hover:bg-sky-100/60"
      >
        <span className="flex items-center gap-2">
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          {revealed ? "Hide" : "Show"} hidden resource
        </span>
      </button>
      {revealed && <div className="border-t border-sky-200 px-4 py-3 text-sm text-[#111827]">{children}</div>}
    </div>
  );
}
