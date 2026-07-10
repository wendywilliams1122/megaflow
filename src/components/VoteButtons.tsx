import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Props = {
  targetType: "thread" | "post";
  targetId: string;
  initialScore: number;
};

export function VoteButtons({ targetType, targetId, initialScore }: Props) {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setMyVote(data.value as 1 | -1);
      });
  }, [user, targetType, targetId]);

  const vote = async (value: 1 | -1) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }
    const newValue = myVote === value ? 0 : value;
    const delta = newValue - myVote;
    setMyVote(newValue);
    setScore((s) => s + delta);

    if (newValue === 0) {
      await supabase
        .from("votes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
    } else {
      await supabase.from("votes").upsert(
        {
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          value: newValue,
        },
        { onConflict: "user_id,target_type,target_id" },
      );
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <button
        onClick={() => vote(1)}
        className={`rounded p-1 hover:bg-accent transition-colors ${
          myVote === 1 ? "text-primary" : "text-muted-foreground"
        }`}
        aria-label="Upvote"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold tabular-nums">{score}</span>
      <button
        onClick={() => vote(-1)}
        className={`rounded p-1 hover:bg-accent transition-colors ${
          myVote === -1 ? "text-destructive" : "text-muted-foreground"
        }`}
        aria-label="Downvote"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
