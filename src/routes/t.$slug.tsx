import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { VoteButtons } from "@/components/VoteButtons";
import { SideRail } from "@/components/SideRail";
import { RichBody } from "@/components/RichBody";
import { AdCard, useAds } from "@/components/AdSlot";
import { timeAgo } from "@/lib/forum";
import { toast } from "sonner";
import { Lock, Pin, Trash2, ChevronRight, MessageSquare, Clock, PenLine, EyeOff } from "lucide-react";

export const Route = createFileRoute("/t/$slug")({
  component: ThreadPage,
});

type Thread = {
  id: string; slug: string; title: string; body: string;
  vote_score: number; reply_count: number;
  is_pinned: boolean; is_locked: boolean;
  created_at: string; author_id: string;
  category: { slug: string; name: string; color: string | null } | null;
  author: { username: string; display_name: string | null; avatar_url: string | null; reputation: number; is_banned?: boolean; points?: number } | null;
};

type Post = {
  id: string; body: string; vote_score: number; created_at: string; author_id: string;
  author: { username: string; display_name: string | null; reputation: number; is_banned?: boolean; points?: number } | null;
};


const TONES = ["bg-sky-500","bg-indigo-500","bg-emerald-500","bg-amber-500","bg-cyan-500","bg-purple-500","bg-rose-500","bg-slate-500"];
function toneFor(name: string){let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))>>>0;return TONES[h%TONES.length];}

function ThreadPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const { data: ads } = useAds("thread");

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("threads")
        .select("id, slug, title, body:body_public, vote_score, reply_count, is_pinned, is_locked, created_at, author_id, category:categories(slug, name, color), author:profiles(username, display_name, avatar_url, reputation, is_banned, points)")
        .eq("slug", slug)
        .maybeSingle();
      return data as unknown as Thread | null;
    },
  });

  const { data: threadFullBody } = useQuery({
    queryKey: ["thread-body", thread?.id, user?.id],
    enabled: !!thread?.id && !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_full_body", { _target_type: "thread", _target_id: thread!.id });
      return (data as string | null) ?? null;
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", thread?.id],
    queryFn: async () => {
      if (!thread) return [];
      const { data } = await supabase
        .from("posts")
        .select("id, body:body_public, vote_score, created_at, author_id, author:profiles(username, display_name, reputation, is_banned, points)")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });
      return (data ?? []) as unknown as Post[];
    },
    enabled: !!thread,
  });

  const { data: postFullBodies } = useQuery({
    queryKey: ["post-bodies", thread?.id, user?.id, posts?.length],
    enabled: !!user && !!posts && (posts?.length ?? 0) > 0,
    queryFn: async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        (posts ?? []).map(async (p) => {
          const { data } = await supabase.rpc("get_full_body", { _target_type: "post", _target_id: p.id });
          if (typeof data === "string") map[p.id] = data;
        }),
      );
      return map;
    },
  });

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !thread || !reply.trim()) return;
    setReplying(true);
    const { error } = await supabase.from("posts").insert({
      thread_id: thread.id, author_id: user.id, body: reply.trim(),
    });
    setReplying(false);
    if (error) return toast.error(error.message);
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

  const color = thread?.category?.color ?? "#0ea5e9";

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {isLoading && <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">Loading…</div>}
          {!isLoading && !thread && <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">Thread not found.</div>}

          {thread && (
            <>
              <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#6b7280]">
                <Link to="/" className="font-medium hover:text-[#0ea5e9]">Home</Link>
                <ChevronRight size={15} />
                {thread.category && (
                  <>
                    <Link to="/c/$slug" params={{ slug: thread.category.slug }} className="font-medium hover:text-[#0ea5e9]">
                      {thread.category.name}
                    </Link>
                    <ChevronRight size={15} />
                  </>
                )}
                <span className="truncate font-semibold text-[#111827]">{thread.title}</span>
              </nav>

              <header
                className="mb-7 rounded-2xl border p-5 sm:p-6"
                style={{ borderColor: color + "33", backgroundColor: color + "12" }}
              >
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
                  {thread.category && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
                      style={{ borderColor: color + "33", backgroundColor: "#ffffff", color }}
                    >
                      {thread.category.name}
                    </span>
                  )}
                  {thread.is_pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                      <Pin size={12} /> Pinned
                    </span>
                  )}
                  {thread.is_locked && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5"><MessageSquare size={16} /> {thread.reply_count} replies</span>
                  <span className="inline-flex items-center gap-1.5"><Clock size={16} /> {timeAgo(thread.created_at)}</span>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">{thread.title}</h1>
              </header>

              <article className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
                <div className="md:flex">
                  <aside className="border-b border-[#e5e7eb] p-5 md:w-56 md:border-b-0 md:border-r">
                    <div className="flex items-center gap-4 md:block">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white ${toneFor(thread.author?.username ?? "u")}`}>
                        {(thread.author?.username ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 md:mt-3">
                        {thread.author && (
                          <Link to="/u/$username" params={{ username: thread.author.username }} className="block truncate text-sm font-extrabold text-[#111827] hover:text-[#0ea5e9]">
                            @{thread.author.username}
                          </Link>
                        )}
                        {thread.author?.is_banned && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-red-700">User Banned</span>
                        )}
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          {thread.author?.points ?? thread.author?.reputation ?? 0} pts
                        </p>
                      </div>

                    </div>
                  </aside>
                  <div className="min-w-0 flex-1 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <VoteButtons targetType="thread" targetId={thread.id} initialScore={thread.vote_score} />
                        <RichBody text={threadFullBody ?? thread.body} className="text-base leading-7 text-[#374151]" />
                      </div>
                      {user?.id === thread.author_id && (
                        <button onClick={deleteThread} className="rounded-lg p-2 text-[#6b7280] hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              <h2 className="mt-8 mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
                {posts?.length ?? 0} {posts?.length === 1 ? "reply" : "replies"}
              </h2>

              <ul className="space-y-3">
                {posts?.map((p, idx) => (
                  <li key={p.id} className="space-y-3">
                    {ads && ads.length > 0 && idx > 0 && idx % 3 === 0 && (
                      <AdCard ad={ads[(Math.floor(idx / 3) - 1) % ads.length]} />
                    )}
                    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
                      <div className="md:flex">
                        <aside className="border-b border-[#e5e7eb] p-4 md:w-56 md:border-b-0 md:border-r">
                          <div className="flex items-center gap-3 md:block">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${toneFor(p.author?.username ?? "u")}`}>
                              {(p.author?.username ?? "?").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 md:mt-2">
                              {p.author && (
                                <Link to="/u/$username" params={{ username: p.author.username }} className="block text-sm font-extrabold text-[#111827] hover:text-[#0ea5e9]">
                                  @{p.author.username}
                                </Link>
                              )}
                              {p.author?.is_banned && (
                                <span className="mt-0.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-red-700">Banned</span>
                              )}
                              <p className="text-xs text-[#6b7280]">{p.author?.points ?? p.author?.reputation ?? 0} pts · {timeAgo(p.created_at)}</p>
                            </div>

                          </div>
                        </aside>
                        <div className="min-w-0 flex-1 p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 flex-1 gap-4">
                              <VoteButtons targetType="post" targetId={p.id} initialScore={p.vote_score} />
                              <RichBody text={p.body} className="min-w-0 flex-1 text-sm leading-7 text-[#374151]" />
                            </div>
                            {user?.id === p.author_id && (
                              <button onClick={() => deletePost(p.id)} className="rounded-lg p-2 text-[#6b7280] hover:bg-red-50 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <section className="mt-10">
                <h2 className="mb-4 text-xl font-extrabold text-[#111827]">Post a Reply</h2>
                <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
                  {thread.is_locked ? (
                    <p className="p-8 text-center text-sm text-[#6b7280]">This thread is locked.</p>
                  ) : user ? (
                    <form onSubmit={submitReply}>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={5}
                        placeholder="Write a thoughtful reply…"
                        className="block w-full resize-y bg-white p-4 text-sm leading-7 text-[#111827] placeholder:text-[#6b7280] focus:outline-none"
                        maxLength={5000}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e7eb] bg-[#f6f7f8] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReply((r) => r + (r ? "\n" : "") + "[spoiler]Hidden resource here…[/spoiler]")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs font-bold text-[#374151] hover:border-amber-300 hover:text-amber-700"
                            title="Wrap hidden content that only 10+ day members with a thread can see"
                          >
                            <EyeOff size={12} /> Spoiler
                          </button>
                          <span className="text-xs text-[#6b7280]">{reply.length} / 5,000</span>
                        </div>
                        <button
                          type="submit"
                          disabled={replying || !reply.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 disabled:opacity-50"
                        >
                          <PenLine size={16} />
                          {replying ? "Posting…" : "Post Reply"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-8 text-center">
                      <h3 className="text-base font-extrabold text-[#111827]">Sign in to participate</h3>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6b7280]">
                        Members can reply and follow updates for this thread.
                      </p>
                      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                        <Link to="/auth" search={{ mode: "signin", redirect: `/t/${slug}` }} className="rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
                          Sign In
                        </Link>
                        <Link to="/auth" search={{ mode: "signup", redirect: `/t/${slug}` }} className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]">
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

void notFound;
