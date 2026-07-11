import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "megaflow_disclaimer_accepted_v1";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-[#e5e7eb] bg-gradient-to-r from-amber-50 to-white px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h2 id="disclaimer-title" className="text-base font-extrabold text-[#111827]">
              Disclaimer & Terms of Use
            </h2>
            <p className="text-xs text-[#6b7280]">Please read before using MegaFlow</p>
          </div>
          <button
            onClick={accept}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4 text-sm leading-6 text-[#374151]">
          <p>
            <strong className="text-[#111827]">MegaFlow</strong> is a community-driven discussion
            forum. All content - including courses, tutorials, tools, links, and resources - is
            shared by our members and is <strong>already publicly available</strong> on the
            internet.
          </p>
          <p>
            We <strong>do not own, host, produce, or claim any rights</strong> over the materials
            shared on this platform. We do not upload copyrighted files to our servers; members
            share only publicly accessible references, previews, or third-party links.
          </p>
          <p>
            All trademarks, course names, tools, and brand references belong to their respective
            owners. Content is shared strictly for <strong>educational and informational
            purposes</strong> only.
          </p>
          <p>
            If you are a rightful owner and believe any content infringes your rights, please
            contact us via the <strong>Contact</strong> or <strong>Support</strong> page and we
            will review and remove the material promptly.
          </p>
          <p className="rounded-lg bg-[#f6f7f8] p-3 text-xs text-[#6b7280]">
            By continuing to browse MegaFlow, you acknowledge that you understand and agree to
            this disclaimer, our Forum Rules, and our Terms of Use.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e5e7eb] bg-[#f6f7f8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280]">
            <ShieldCheck size={13} className="text-emerald-600" /> Your privacy is respected
          </div>
          <button
            onClick={accept}
            className="inline-flex items-center justify-center rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
