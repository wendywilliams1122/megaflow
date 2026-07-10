import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/forum";
import { MessageSquare, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/c/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const { data: threads } = useQuery({
    queryKey: ["threads", "cat", slug],
    queryFn: async () => {
      if (!category) return [];
      const { data } = await supabase
        .from("threads")
        .select("id, slug, title, body, vote_score, reply_count, last_activity_at, is_pinned, author:profiles(username)")
        .eq("category_id", category.id)
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!category,
  });

  if (!category)
    return <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div
        className="mb-6 rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${category.color ?? "#6366f1"}, oklch(0.55 0.15 260))` }}
      >
        <h1 className="text-2xl font-bold">{category.name}</h1>
        {category.description && <p className="mt-1 opacity-90">{category.description}</p>}
      </div>

      <ul className="space-y-2">
        {threads?.map((t: any) => (
          <li key={t.id}>
            <Link
              to="/t/$slug"
              params={{ slug: t.slug }}
              className="group block rounded-lg border border-border bg-card p-4 hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 pt-0.5 text-xs text-muted-foreground">
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="font-semibold">{t.vote_score}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold group-hover:text-primary">{t.title}</h2>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{t.body}</p>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span>by {t.author?.username}</span>
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
        {threads?.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No threads in this category yet.
          </li>
        )}
      </ul>
    </div>
  );
}
