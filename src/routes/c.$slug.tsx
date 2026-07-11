import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SideRail } from "@/components/SideRail";
import { timeAgo } from "@/lib/forum";
import { MessageSquare, Clock, ChevronRight, Pin } from "lucide-react";

export const Route = createFileRoute("/c/$slug")({
  component: CategoryPage,
});

const TONES = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500", "bg-purple-500", "bg-rose-500", "bg-slate-500"];
function toneFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

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
        .select("id, slug, title, vote_score, reply_count, last_activity_at, is_pinned, author:profiles(username)")
        .eq("category_id", category.id)
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!category,
  });

  const color = category?.color ?? "#0ea5e9";

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {!category ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">Loading…</div>
        ) : (
          <>
            <nav className="mb-4 flex items-center gap-2 text-sm text-[#6b7280]">
              <Link to="/" className="font-medium hover:text-[#0ea5e9]">Home</Link>
              <ChevronRight size={15} />
              <span className="font-semibold text-[#111827]">{category.name}</span>
            </nav>

            <section
              className="mb-6 rounded-2xl border p-5 sm:p-6"
              style={{ borderColor: color + "33", backgroundColor: color + "12" }}
            >
              <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-1 text-sm text-[#374151]">{category.description}</p>
              )}
            </section>

            <div className="space-y-3">
              {threads?.map((t: any) => {
                const authorName = t.author?.username ?? "unknown";
                return (
                  <article
                    key={t.id}
                    className="group rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${toneFor(authorName)}`}>
                        {authorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        {t.is_pinned && (
                          <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <Pin size={12} /> Pinned
                          </span>
                        )}
                        <Link to="/t/$slug" params={{ slug: t.slug }}>
                          <h2 className="truncate text-base font-extrabold leading-snug text-[#111827] group-hover:text-[#0ea5e9] sm:text-lg">
                            {t.title}
                          </h2>
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6b7280]">
                          <span className="font-semibold text-[#374151]">@{authorName}</span>
                          <span className="inline-flex items-center gap-1.5">
                            <MessageSquare size={14} /> {t.reply_count} replies
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} /> {timeAgo(t.last_activity_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              {threads && threads.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
                  No threads in this category yet.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
