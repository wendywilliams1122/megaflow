import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SideRail } from "@/components/SideRail";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { makeThreadSlug } from "@/lib/forum";
import { PenLine } from "lucide-react";

export const Route = createFileRoute("/new")({
  component: NewThreadPage,
});

function NewThreadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/new" } });
    });
  }, [navigate]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, slug, name").order("sort_order");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (categories?.length && !categoryId) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId) return;
    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not signed in");
      const slug = makeThreadSlug(title);
      const { data: thread, error } = await supabase
        .from("threads")
        .insert({
          title: title.trim().slice(0, 200),
          body: body.trim(),
          category_id: categoryId,
          author_id: session.session.user.id,
          slug,
        })
        .select("slug, id")
        .single();
      if (error) throw error;

      const tagNames = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0 && t.length <= 30).slice(0, 5);
      if (tagNames.length && thread) {
        for (const name of tagNames) {
          const tagSlug = name.replace(/[^a-z0-9]+/g, "-");
          const { data: existing } = await supabase.from("tags").select("id").eq("slug", tagSlug).maybeSingle();
          let tagId = existing?.id;
          if (!tagId) {
            const { data: created } = await supabase.from("tags").insert({ slug: tagSlug, name }).select("id").single();
            tagId = created?.id;
          }
          if (tagId) await supabase.from("thread_tags").insert({ thread_id: thread.id, tag_id: tagId });
        }
      }

      toast.success("Thread posted!");
      navigate({ to: "/t/$slug", params: { slug: thread.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[1440px] pt-16">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">Start a Discussion</h1>
          <p className="mb-6 text-sm text-[#6b7280]">Share a resource, ask a question, or start a conversation.</p>

          <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#111827]">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-2.5 text-sm text-[#111827] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#111827]">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your question or topic?"
                required
                maxLength={200}
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#6b7280] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#111827]">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share details, links, code snippets…"
                required
                rows={12}
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-2.5 text-sm leading-7 text-[#111827] placeholder:text-[#6b7280] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#111827]">Tags <span className="font-normal text-[#6b7280]">(comma separated, max 5)</span></label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="react, typescript, courses"
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#6b7280] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e5e7eb] pt-5">
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 disabled:opacity-50"
              >
                <PenLine size={16} />
                {submitting ? "Posting…" : "Post Discussion"}
              </button>
            </div>
          </form>
        </div>
        <Footer />
      </main>
    </div>
  );
}
