import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type SpoilerAccess = {
  canView: boolean;
  loading: boolean;
  reason: "signed-out" | "too-new" | "no-thread" | null;
  daysOld: number;
  hasThread: boolean;
};

export function useSpoilerAccess(): SpoilerAccess {
  const { user, profile, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["spoiler-access", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("threads")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user!.id);
      return { threadCount: count ?? 0 };
    },
  });

  if (!user) {
    return { canView: false, loading: authLoading, reason: "signed-out", daysOld: 0, hasThread: false };
  }

  const createdAt = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const daysOld = Math.floor((Date.now() - createdAt) / 86400000);
  const hasThread = (data?.threadCount ?? 0) > 0;

  const canView = daysOld >= 10 && hasThread;
  const reason = !canView ? (daysOld < 10 ? "too-new" : "no-thread") : null;

  return { canView, loading: authLoading || isLoading, reason, daysOld, hasThread };
}
