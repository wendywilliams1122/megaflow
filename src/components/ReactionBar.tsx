import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type ReactionKey = "like" | "love" | "haha" | "insightful" | "thanks";

const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "haha", emoji: "😂", label: "Haha" },
  { key: "insightful", emoji: "💡", label: "Insightful" },
  { key: "thanks", emoji: "🙏", label: "Thanks" },
];

type Props = {
  targetType: "thread" | "post";
  targetId: string;
  initialCounts?: Record<string, number>;
};

export function ReactionBar({ targetType, targetId, initialCounts }: Props) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts ?? {});
  const [mine, setMine] = useState<ReactionKey | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reactions" as never)
      .select("reaction")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle()
      .then(({ data }) => {
        const r = (data as { reaction?: ReactionKey } | null)?.reaction ?? null;
        setMine(r);
      });
  }, [user, targetType, targetId]);

  const react = async (key: ReactionKey) => {
    if (!user) {
      toast.error("Sign in to react");
      return;
    }
    setOpen(false);

    // Optimistic
    const prev = mine;
    const nextCounts = { ...counts };
    if (prev === key) {
      // remove
      nextCounts[key] = Math.max((nextCounts[key] ?? 1) - 1, 0);
      setMine(null);
      setCounts(nextCounts);
      const { error } = await supabase
        .from("reactions" as never)
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      if (error) toast.error(error.message);
      return;
    }
    if (prev) nextCounts[prev] = Math.max((nextCounts[prev] ?? 1) - 1, 0);
    nextCounts[key] = (nextCounts[key] ?? 0) + 1;
    setMine(key);
    setCounts(nextCounts);
    const { error } = await supabase
      .from("reactions" as never)
      .upsert(
        { user_id: user.id, target_type: targetType, target_id: targetId, reaction: key } as never,
        { onConflict: "user_id,target_type,target_id" },
      );
    if (error) toast.error(error.message);
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = REACTIONS.filter((r) => (counts[r.key] ?? 0) > 0);

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
            mine
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-sky-200 hover:text-sky-700"
          }`}
        >
          <span className="text-sm">{mine ? REACTIONS.find((r) => r.key === mine)?.emoji : "😊"}</span>
          <span>{mine ? "Reacted" : "React"}</span>
        </button>
        {open && (
          <div className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border border-[#e5e7eb] bg-white p-1.5 shadow-lg">
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                title={r.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => react(r.key)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-[#f6f7f8] ${
                  mine === r.key ? "bg-sky-50" : ""
                }`}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {active.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => react(r.key)}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
            mine === r.key
              ? "border-sky-200 bg-sky-50 text-sky-700"
              : "border-[#e5e7eb] bg-white text-[#374151] hover:border-sky-200"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{counts[r.key]}</span>
        </button>
      ))}

      {total > 0 && (
        <span className="text-xs text-[#6b7280]">
          {total} reaction{total === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
