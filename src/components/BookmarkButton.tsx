import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function BookmarkButton({ threadId, className }: { threadId: string; className?: string }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    supabase
      .from("bookmarks" as never)
      .select("id")
      .eq("user_id", user.id)
      .eq("thread_id", threadId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, threadId]);

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to bookmark");
      return;
    }
    setLoading(true);
    if (saved) {
      const { error } = await supabase
        .from("bookmarks" as never)
        .delete()
        .eq("user_id", user.id)
        .eq("thread_id", threadId);
      setLoading(false);
      if (error) return toast.error(error.message);
      setSaved(false);
      toast.success("Removed from bookmarks");
    } else {
      const { error } = await supabase
        .from("bookmarks" as never)
        .insert({ user_id: user.id, thread_id: threadId } as never);
      setLoading(false);
      if (error) return toast.error(error.message);
      setSaved(true);
      toast.success("Bookmarked");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={
        className ??
        `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
          saved
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-amber-200 hover:text-amber-700"
        }`
      }
      title={saved ? "Remove bookmark" : "Bookmark this thread"}
    >
      {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
