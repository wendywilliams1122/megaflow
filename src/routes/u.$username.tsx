import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/forum";

export const Route = createFileRoute("/u/$username")({
  component: UserPage,
});

function UserPage() {
  const { username } = Route.useParams();

  const { data: profile } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      return data;
    },
  });

  const { data: threads } = useQuery({
    queryKey: ["user-threads", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("threads")
        .select("id, slug, title, vote_score, reply_count, created_at")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!profile,
  });

  if (!profile)
    return <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <div className="brand-gradient flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white">
          {profile.username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{profile.display_name ?? profile.username}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <p className="mt-1 text-xs">
            <span className="font-semibold text-primary">{profile.reputation}</span> reputation
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Threads</h2>
      <ul className="space-y-2">
        {threads?.map((t: any) => (
          <li key={t.id}>
            <Link
              to="/t/$slug"
              params={{ slug: t.slug }}
              className="block rounded-lg border border-border bg-card p-3 hover:border-primary/40"
            >
              <div className="font-medium">{t.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.vote_score} votes · {t.reply_count} replies · {timeAgo(t.created_at)}
              </div>
            </Link>
          </li>
        ))}
        {threads?.length === 0 && (
          <li className="text-sm text-muted-foreground">No threads yet.</li>
        )}
      </ul>
    </div>
  );
}
