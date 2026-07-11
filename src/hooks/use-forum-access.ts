import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type SpoilerAccess = {
  canView: boolean;
  loading: boolean;
  reason: "signed-out" | "too-new" | "no-thread" | "low-points" | null;
  daysOld: number;
  hasThread: boolean;
  points: number;
  minPoints: number;
};

export function useSpoilerAccess(): SpoilerAccess {
  const { user, profile, isModerator, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["spoiler-access", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ count }, { data: settings }] = await Promise.all([
        supabase.from("threads").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
        supabase.from("site_settings").select("downloads_min_points").eq("id", true).maybeSingle(),
      ]);
      return { threadCount: count ?? 0, minPoints: settings?.downloads_min_points ?? 0 };
    },
  });

  if (!user) {
    return { canView: false, loading: authLoading, reason: "signed-out", daysOld: 0, hasThread: false, points: 0, minPoints: 0 };
  }

  // Staff bypass all conditions
  if (isModerator) {
    return { canView: true, loading: false, reason: null, daysOld: 999, hasThread: true, points: profile?.points ?? 0, minPoints: 0 };
  }

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : Date.now();
  const daysOld = Math.floor((Date.now() - createdAt) / 86400000);
  const hasThread = (data?.threadCount ?? 0) > 0;
  const minPoints = data?.minPoints ?? 0;
  const points = profile?.points ?? 0;

  const meetsPoints = minPoints === 0 || points >= minPoints;
  const canView = daysOld >= 10 && hasThread && meetsPoints;
  const reason = !canView
    ? !meetsPoints
      ? "low-points"
      : daysOld < 10
      ? "too-new"
      : "no-thread"
    : null;

  return { canView, loading: authLoading || isLoading, reason, daysOld, hasThread, points, minPoints };
}

