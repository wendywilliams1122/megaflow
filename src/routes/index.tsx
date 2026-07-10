import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SideRail } from "@/components/SideRail";
import { Footer } from "@/components/Footer";
import { timeAgo } from "@/lib/forum";
import { Megaphone, PenSquare, Pin, MessageSquare, Clock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  component: HomePage,
});

const filters = [
  { id: "latest", label: "Latest" },
  { id: "top", label: "Top" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
] as const;

type FilterId = (typeof filters)[number]["id"];

type ThreadRow = {
  id: string;
  slug: string;
  title: string;
  vote_score: number;
  reply_count: number;
  created_at: string;
  last_activity_at: string;
  is_pinned: boolean;
  category: { slug: string; name: string; color: string | null } | null;
  author: { username: string } | null;
};

const AVATAR_TONES = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500", "bg-purple-500", "bg-rose-500", "bg-slate-500"];
function toneFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function HomePage() {
  const [activeTab, setActiveTab] = useState<FilterId>("latest");

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads", "feed", activeTab],
    queryFn: async () => {
      let q = supabase
        .from("threads")
        .select(
          "id, slug, title, vote_score, reply_count, created_at, last_activity_at, is_pinned, category:categories(slug, name, color), author:profiles(username)",
        )
        .order("is_pinned", { ascending: false });

      if (activeTab === "latest") q = q.order("last_activity_at", { ascending: false });
      else if (activeTab === "top") q = q.order("vote_score", { ascending: false });
      else if (activeTab === "newest") q = q.order("created_at", { ascending: false });
      else q = q.order("created_at", { ascending: true });

      const { data } = await q.limit(30);
      return (data ?? []) as unknown as ThreadRow[];
    },
  });

  return (
    <div className="mx-auto flex max-w-[1440px] pt-16">
      <SideRail />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#0ea5e9] ring-1 ring-sky-100">
              <Megaphone size={19} />
            </div>
            <p className="text-sm font-medium leading-6 text-[#0f172a]">
              Welcome to MegaFlow — join the community, share resources, and grow together.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-4 pt-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                  Community forum
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                  Latest discussions
                </h1>
              </div>
              <Link
                to="/new"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9] lg:hidden"
              >
                <PenSquare size={17} />
                <span>Start a Discussion</span>
              </Link>
            </div>

            <div className="mt-5 flex gap-1 overflow-x-auto" role="tablist">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(f.id)}
                  className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                    activeTab === f.id
                      ? "border-[#0ea5e9] text-[#0ea5e9]"
                      : "border-transparent text-[#6b7280] hover:border-[#e5e7eb] hover:text-[#111827]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 bg-[#f6f7f8] p-3 sm:p-4">
            {isLoading && (
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
                Loading discussions…
              </div>
            )}

            {threads?.map((t) => {
              const authorName = t.author?.username ?? "unknown";
              const initials = authorName.slice(0, 2).toUpperCase();
              const color = t.category?.color ?? "#0ea5e9";
              return (
                <article
                  key={t.id}
                  className="group rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/70"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${toneFor(authorName)}`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {t.category && (
                          <Link
                            to="/c/$slug"
                            params={{ slug: t.category.slug }}
                            className="inline-flex rounded-full border px-2.5 py-1 text-xs font-bold"
                            style={{
                              borderColor: color + "33",
                              backgroundColor: color + "1a",
                              color,
                            }}
                          >
                            {t.category.name}
                          </Link>
                        )}
                        {t.is_pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <Pin size={12} /> Pinned
                          </span>
                        )}
                      </div>

                      <Link to="/t/$slug" params={{ slug: t.slug }} className="block rounded-md">
                        <h2 className="truncate text-base font-extrabold leading-snug text-[#111827] transition-colors group-hover:text-[#0ea5e9] sm:text-lg">
                          {t.title}
                        </h2>
                      </Link>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6b7280]">
                        <span className="font-semibold text-[#374151]">@{authorName}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare size={14} /> {t.reply_count} replies
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} /> {timeAgo(t.last_activity_at)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/t/$slug"
                      params={{ slug: t.slug }}
                      className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[#6b7280] hover:bg-sky-50 hover:text-[#0ea5e9] sm:flex"
                      aria-label={`Open ${t.title}`}
                    >
                      <ChevronRight size={19} />
                    </Link>
                  </div>
                </article>
              );
            })}

            {threads && threads.length === 0 && !isLoading && (
              <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
                No discussions yet. <Link to="/new" className="font-bold text-[#0ea5e9]">Start the first one</Link>.
              </div>
            )}
          </div>

          <div className="flex justify-center border-t border-[#e5e7eb] bg-white p-5">
            <button className="rounded-xl border border-[#e5e7eb] bg-white px-6 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]">
              Load More
            </button>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
