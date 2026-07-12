import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Award, Sparkles, MessageSquare, MessagesSquare, Reply, PlusSquare,
  Star, Crown, Trophy, ThumbsUp, Flame, Landmark,
} from "lucide-react";

const ICONS: Record<string, any> = {
  award: Award, sparkles: Sparkles, "message-square": MessageSquare,
  "messages-square": MessagesSquare, reply: Reply, "plus-square": PlusSquare,
  pillar: Landmark, star: Star, crown: Crown, trophy: Trophy,
  "thumbs-up": ThumbsUp, flame: Flame,
};

const TIER_STYLES: Record<string, string> = {
  bronze: "bg-amber-50 text-amber-700 border-amber-200",
  silver: "bg-slate-100 text-slate-700 border-slate-300",
  gold: "bg-yellow-50 text-yellow-800 border-yellow-300",
  platinum: "bg-gradient-to-br from-sky-50 to-indigo-50 text-indigo-700 border-indigo-300",
};

type Badge = { id: string; name: string; description: string; icon: string; tier: string };

export function BadgeList({ userId }: { userId: string | null | undefined }) {
  const { data } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("user_badges")
        .select("badge_id, awarded_at, badges(id, name, description, icon, tier)")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });
      return (data ?? []).map((r: any) => r.badges).filter(Boolean) as Badge[];
    },
    enabled: !!userId,
  });

  if (!userId) return null;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-6 text-center text-sm text-[#6b7280]">
        No badges yet. Post threads, replies, or earn upvotes to unlock achievements.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {data.map((b) => {
        const Icon = ICONS[b.icon] ?? Award;
        return (
          <div
            key={b.id}
            title={b.description}
            className={`flex items-center gap-2 rounded-xl border p-3 shadow-sm ${TIER_STYLES[b.tier] ?? TIER_STYLES.bronze}`}
          >
            <Icon size={20} className="shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-xs font-extrabold">{b.name}</div>
              <div className="truncate text-[10px] uppercase tracking-wide opacity-75">{b.tier}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
