import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { VoteButtons } from "@/components/VoteButtons";
import { timeAgo } from "@/lib/forum";
import { toast } from "sonner";
import { Lock, Pin, Trash2 } from "lucide-react";

export const Route = createFileRoute("/t/$slug")({
  component: ThreadPage,
});

type Thread = {
  id: string;
  slug: string;
  title: string;
  body: string;
  vote_score: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author_id: string;
  category: { slug: string; name: string; color: string | null } | null;
  author: { username: string; display_name: string | null; avatar_url: string | null; reputation: number } | null;
};

type Post = {
  id: string;
  body: string;
  vote_score: number;
  created_at: string;
  author_id: string;
  author: { username: string; display_name: string | null; reputation: number } | null;
};

function ThreadPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("threads")
        .select(
          "id, slug, title, body, vote_score, reply_count, is_pinned, is_locked, created_at, author_id, category:categories(slug, name, color), author:profiles(username, display_name, avatar_url, reputation)",
        )
        .eq("slug", slug)
        .maybeSingle();
      return data as unknown as Thread | null;
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", thread?.id],
    queryFn: async () => {
      if (!thread) return [];
      const { data } = await supabase
        .from("posts")
        .select("id, body, vote_score, created_at, author_id, author:profiles(username, display_name, reputation)")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });
      return (data ?? []) as unknown as Post[];
    },
    enabled: !!thread,
  });


  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !thread || !reply.trim()) return;
    setReplying(true);
    const { error } = await supabase
      .from("posts")
      .insert({ thread_id: thread.id, author_id: user.id, body: reply.trim() });
    setReplying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReply("");
    qc.invalidateQueries({ queryKey: ["posts", thread.id] });
    qc.invalidateQueries({ queryKey: ["thread", slug] });
  };

  const deleteThread = async () => {
    if (!thread || !confirm("Delete this thread?")) return;
    const { error } = await supabase.from("threads").delete().eq("id", thread.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    window.location.href = "/";
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this reply?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["posts", thread?.id] });
  };

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">Loading...</div>;
  if (!thread) return <div className="mx-auto max-w-4xl px-4 py-6">Thread not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {thread.category && (
          <Link
            to="/c/$slug"
            params={{ slug: thread.category.slug }}
            className="rounded px-1.5 py-0.5 font-semibold uppercase"
            style={{
              backgroundColor: (thread.category.color ?? "#6366f1") + "20",
              color: thread.category.color ?? "#6366f1",
            }}
          >
            {thread.category.name}
          </Link>
        )}
        {thread.is_pinned && (
          <span className="inline-flex items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 font-semibold uppercase text-warning">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
        {thread.is_locked && (
          <span className="inline-flex items-center gap-1 rounded bg-destructive/20 px-1.5 py-0.5 font-semibold uppercase text-destructive">
            <Lock className="h-3 w-3" /> Locked
          </span>
        )}
      </div>
      <h1 className="text-2xl font-bold sm:text-3xl">{thread.title}</h1>

      <article className="mt-4 rounded-lg border border-border bg-card p-5">
        <div className="flex gap-4">
          <VoteButtons targetType="thread" targetId={thread.id} initialScore={thread.vote_score} />
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div>
                by{" "}
                {thread.author && (
                  <Link
                    to="/u/$username"
                    params={{ username: thread.author.username }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {thread.author.username}
                  </Link>
                )}{" "}
                · {timeAgo(thread.created_at)}
              </div>
              {user?.id === thread.author_id && (
                <button onClick={deleteThread} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">{thread.body}</div>
          </div>
        </div>
      </article>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">
        {posts?.length ?? 0} {posts?.length === 1 ? "reply" : "replies"}
      </h2>

      <ul className="space-y-3">
        {posts?.map((p) => (
          <li key={p.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex gap-4">
              <VoteButtons targetType="post" targetId={p.id} initialScore={p.vote_score} />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div>
                    {p.author && (
                      <Link
                        to="/u/$username"
                        params={{ username: p.author.username }}
                        className="font-medium text-foreground hover:underline"
                      >
                        {p.author.username}
                      </Link>
                    )}{" "}
                    · {timeAgo(p.created_at)}
                    <span className="ml-2 text-[10px]">rep {p.author?.reputation ?? 0}</span>
                  </div>
                  {user?.id === p.author_id && (
                    <button onClick={() => deletePost(p.id)} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-sm">{p.body}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        {thread.is_locked ? (
          <p className="text-center text-sm text-muted-foreground">This thread is locked.</p>
        ) : user ? (
          <form onSubmit={submitReply} className="space-y-3">
            <label className="block text-sm font-semibold">Add a reply</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Share your thoughts..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replying || !reply.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {replying ? "Posting..." : "Post reply"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth" search={{ redirect: `/t/${slug}` }} className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to reply.
          </p>
        )}
      </div>
    </div>
  );
}

// Prevent unused warning for notFound
void notFound;
