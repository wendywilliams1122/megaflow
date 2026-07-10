import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { makeThreadSlug } from "@/lib/forum";

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
      const { data } = await supabase
        .from("categories")
        .select("id, slug, name")
        .order("sort_order");
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

      // tags
      const tagNames = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 30)
        .slice(0, 5);
      if (tagNames.length && thread) {
        for (const name of tagNames) {
          const tagSlug = name.replace(/[^a-z0-9]+/g, "-");
          const { data: existing } = await supabase
            .from("tags")
            .select("id")
            .eq("slug", tagSlug)
            .maybeSingle();
          let tagId = existing?.id;
          if (!tagId) {
            const { data: created } = await supabase
              .from("tags")
              .insert({ slug: tagSlug, name })
              .select("id")
              .single();
            tagId = created?.id;
          }
          if (tagId) {
            await supabase.from("thread_tags").insert({ thread_id: thread.id, tag_id: tagId });
          }
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
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Start a new thread</h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            required
            maxLength={200}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share details, code snippets, context..."
            required
            rows={10}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tags (comma separated, max 5)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, typescript, security"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post thread"}
          </button>
        </div>
      </form>
    </div>
  );
}
