import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Flag } from "lucide-react";

type Props = {
  targetType: "thread" | "post" | "user";
  targetId: string;
  className?: string;
};

const CATEGORIES: { value: string; label: string; hint: string }[] = [
  { value: "spam", label: "Spam / self-promotion", hint: "Repeated ads, referral spam." },
  { value: "harassment", label: "Harassment / abuse", hint: "Insults, threats, hate speech." },
  { value: "broken_link", label: "Broken / dead link", hint: "A download or link is no longer working." },
  { value: "inappropriate", label: "Inappropriate content", hint: "NSFW, gore, illegal content." },
  { value: "misinformation", label: "Misinformation", hint: "False or misleading info." },
  { value: "copyright", label: "Copyright / DMCA", hint: "Stolen or unlicensed content." },
  { value: "other", label: "Something else", hint: "Explain in the note." },
];

export function ReportButton({ targetType, targetId, className = "" }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("spam");
  const [reason, setReason] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) return null;

  async function submit() {
    if (reason.trim().length < 3) return;
    if (category === "broken_link" && linkUrl.trim().length < 4) return;
    setBusy(true);
    const { error } = await (supabase as any).from("reports").insert({
      reporter_id: user!.id,
      target_type: targetType,
      target_id: targetId,
      category,
      link_url: category === "broken_link" ? linkUrl.trim() : null,
      reason: reason.trim(),
    });
    setBusy(false);
    if (!error) {
      setDone(true);
      setTimeout(() => {
        setOpen(false); setDone(false); setReason(""); setLinkUrl(""); setCategory("spam");
      }, 1500);
    } else {
      alert(error.message);
    }
  }

  const active = CATEGORIES.find((c) => c.value === category);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs text-[#6b7280] hover:text-red-600 ${className}`}
        title="Report"
      >
        <Flag size={12} /> Report
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-extrabold text-[#111827]">Report this {targetType}</h3>
            <p className="mb-3 text-sm text-[#6b7280]">
              Moderators review every report. Abusing reports may result in penalties.
            </p>
            {done ? (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                Report submitted. Thank you.
              </div>
            ) : (
              <>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">
                  Reason category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mb-1 w-full rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-sm outline-none focus:border-[#0ea5e9]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <p className="mb-3 text-xs text-[#9ca3af]">{active?.hint}</p>

                {category === "broken_link" && (
                  <>
                    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">
                      Broken URL
                    </label>
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/file.zip"
                      className="mb-3 w-full rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-sm outline-none focus:border-[#0ea5e9]"
                    />
                  </>
                )}

                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">
                  Details
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="What should moderators know?"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-white p-3 text-sm outline-none focus:border-[#0ea5e9]"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={busy}
                    className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-bold text-[#374151] hover:bg-[#f6f7f8]"
                  >Cancel</button>
                  <button
                    onClick={submit}
                    disabled={
                      busy ||
                      reason.trim().length < 3 ||
                      (category === "broken_link" && linkUrl.trim().length < 4)
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >{busy ? "Sending…" : "Submit report"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
