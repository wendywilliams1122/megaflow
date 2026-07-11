import { useAuth } from "@/hooks/use-auth";
import { Copy, Gift, ShieldAlert, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function ReferralPointsCard() {
  const { user, profile } = useAuth();
  if (!user || !profile) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = profile.referral_code ? `${origin}/auth?mode=signup&ref=${profile.referral_code}` : "";

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="grid gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:grid-cols-4">
        <Stat icon={<Star size={16} />} label="Points" value={profile.points ?? 0} tone="bg-sky-500" />
        <Stat icon={<TrendingUp size={16} />} label="Trust score" value={profile.trust_score ?? 0} tone="bg-emerald-500" />
        <Stat icon={<ShieldAlert size={16} />} label="Warnings" value={profile.warnings ?? 0} tone="bg-amber-500" />
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-sky-700">
            <Gift size={14} /> Your referral link
          </div>
          <div className="flex items-center gap-2">
            <input readOnly value={link} className="min-w-0 flex-1 truncate rounded-md border border-sky-200 bg-white px-2 py-1 text-xs" />
            <button onClick={copy} className="inline-flex items-center gap-1 rounded-md bg-[#0ea5e9] px-2 py-1 text-xs font-bold text-white hover:bg-sky-600">
              <Copy size={12} /> Copy
            </button>
          </div>
          {profile.is_banned && (
            <p className="mt-2 rounded bg-red-100 px-2 py-1 text-[11px] font-extrabold text-red-700">
              User Banned{profile.ban_reason ? ` - ${profile.ban_reason}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${tone}`}>{icon}</div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">{label}</div>
        <div className="text-lg font-extrabold text-[#111827]">{value}</div>
      </div>
    </div>
  );
}
