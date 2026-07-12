import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SideRail } from "@/components/SideRail";
import { BookmarkButton } from "@/components/BookmarkButton";
import { timeAgo } from "@/lib/forum";
import { Bookmark, MessageSquare, Clock } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "My Bookmarks - MegaFlow" },
      { name: "description", content: "Your saved threads on MegaFlow." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookmarksPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-red-600">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center text-sm">Not found.</div>,
});

type Row = {
  id: string;
  created_at: string;
  note: string | null;
  thread: {
    id: string;
    slug: string;
    title: string;
    reply_count: number;
    vote_score: number;
    created_at: string;
    author: { username: string } | null;
    category: { name: string; slug: string; color: string | null } | null;
  } | null;
};

function BookmarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmarks" as never)
        .select(
          "id, created_at, note, thread:threads(id, slug, title, reply_count, vote_score, created_at, author:profiles(username), category:categories(name, slug, color))",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as unknown as Row[]) ?? [];
    },
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto flex max-w-[1440px]">
        <SideRail />
        <main className="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center shadow-sm">
            <Bookmark className="mx-auto mb-3 text-[#0ea5e9]" size={32} />
            <h1 className="text-2xl font-extrabold text-[#111827]">Sign in to see bookmarks</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6b7280]">
              Save your favorite threads and find them here anytime.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="mt-5 inline-block rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#111827]">
                <Bookmark className="text-amber-600" size={24} /> My Bookmarks
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                {data?.length ?? 0} saved thread{(data?.length ?? 0) === 1 ? "" : "s"}
              </p>
            </div>
          </header>

          {isLoading && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
              Loading…
            </div>
          )}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center">
              <Bookmark className="mx-auto mb-3 text-[#6b7280] opacity-50" size={32} />
              <h3 className="text-base font-bold text-[#111827]">No bookmarks yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#6b7280]">
                Tap the Save button on any thread to keep it here for later.
              </p>
              <button
                onClick={() => router.navigate({ to: "/" })}
                className="mt-4 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600"
              >
                Browse Discussions
              </button>
            </div>
          )}

          <ul className="space-y-3">
            {data?.map((b) => {
              if (!b.thread) return null;
              const color = b.thread.category?.color ?? "#0ea5e9";
              return (
                <li
                  key={b.id}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm hover:border-sky-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {b.thread.category && (
                        <span
                          className="mb-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold"
                          style={{ borderColor: color + "33", color, backgroundColor: color + "12" }}
                        >
                          {b.thread.category.name}
                        </span>
                      )}
                      <Link
                        to="/t/$slug"
                        params={{ slug: b.thread.slug }}
                        className="block text-base font-extrabold text-[#111827] hover:text-[#0ea5e9]"
                      >
                        {b.thread.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6b7280]">
                        {b.thread.author && <span>by @{b.thread.author.username}</span>}
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={12} /> {b.thread.reply_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> saved {timeAgo(b.created_at)}
                        </span>
                      </div>
                    </div>
                    <BookmarkButton threadId={b.thread.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}
