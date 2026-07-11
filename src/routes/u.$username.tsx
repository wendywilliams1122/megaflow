import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SideRail } from "@/components/SideRail";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/forum";
import { MessageSquare, Clock, Settings } from "lucide-react";

export const Route = createFileRoute("/u/$username")({
  component: UserPage,
});

function UserPage() {
  const { username } = Route.useParams();
  const { user } = useAuth();


  const { data: profile } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, reputation, points, is_banned, created_at")
        .eq("username", username)
        .maybeSingle();
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

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {!profile ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">Loading…</div>
        ) : (
          <>
            <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9] text-xl font-extrabold text-white">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-extrabold text-[#111827]">
                  {profile.display_name ?? profile.username}
                </h1>
                <p className="text-sm text-[#6b7280]">@{profile.username}</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  <span className="font-bold text-[#0ea5e9]">{profile.reputation}</span> reputation
                </p>
                {profile.bio && <p className="mt-2 text-sm text-[#374151]">{profile.bio}</p>}
              </div>
              {user?.id === profile.id && (
                <Link to="/settings" className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]">
                  <Settings size={16} /> Edit Profile
                </Link>
              )}
            </section>


            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">Threads</h2>
            <div className="space-y-3">
              {threads?.map((t: any) => (
                <Link
                  key={t.id}
                  to="/t/$slug"
                  params={{ slug: t.slug }}
                  className="block rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm hover:border-sky-200 hover:shadow-md"
                >
                  <h3 className="font-extrabold text-[#111827]">{t.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6b7280]">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare size={14} /> {t.reply_count} replies
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} /> {timeAgo(t.created_at)}
                    </span>
                    <span>· {t.vote_score} votes</span>
                  </div>
                </Link>
              ))}
              {threads?.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
                  No threads yet.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
