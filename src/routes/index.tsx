import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/forum";
import { MessageSquare, TrendingUp, Flame, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
};

type ThreadRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  vote_score: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  last_activity_at: string;
  is_pinned: boolean;
  category: { slug: string; name: string; color: string | null } | null;
  author: { username: string; display_name: string | null } | null;
};

function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      return (data ?? []) as Category[];
    },
  });

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads", "latest"],
    queryFn: async () => {
      const { data } = await supabase
        .from("threads")
        .select(
          "id, slug, title, body, vote_score, reply_count, view_count, created_at, last_activity_at, is_pinned, category:categories(slug, name, color), author:profiles(username, display_name)",
        )
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .limit(30);
      return (data ?? []) as unknown as ThreadRow[];
    },
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_260px]">
      <main>
        <div className="mb-6 rounded-2xl border border-border brand-gradient p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold sm:text-3xl">Where ideas flow.</h1>
          <p className="mt-1 text-sm opacity-90 sm:text-base">
            Discuss code, security, AI and everything in between.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Flame className="h-4 w-4" /> Latest activity
        </div>

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Loading threads...
          </div>
        )}

        <ul className="space-y-2">
          {threads?.map((t) => (
            <li key={t.id}>
              <Link
                to="/t/$slug"
                params={{ slug: t.slug }}
                className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 pt-0.5 text-xs text-muted-foreground">
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span className="font-semibold tabular-nums">{t.vote_score}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.is_pinned && (
                        <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                          Pinned
                        </span>
                      )}
                      {t.category && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                          style={{
                            backgroundColor: (t.category.color ?? "#6366f1") + "20",
                            color: t.category.color ?? "#6366f1",
                          }}
                        >
                          {t.category.name}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 truncate font-semibold group-hover:text-primary">
                      {t.title}
                    </h2>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {t.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>by {t.author?.username ?? "unknown"}</span>
                      <span>· {timeAgo(t.last_activity_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {t.reply_count}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {threads && threads.length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No threads yet. Be the first to start a discussion!
            </li>
          )}
        </ul>
      </main>

      <aside className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4" /> Categories
          </h3>
          <ul className="space-y-1">
            {categories?.map((c) => (
              <li key={c.id}>
                <Link
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color ?? "#6366f1" }}
                  />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
