import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote, Plus, Trash2, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

type Note = {
  id: string; user_id: string; author_id: string | null; body: string;
  pinned: boolean; created_at: string;
  author?: { username: string } | null;
};

export function UserNotesCard({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any).from("user_notes")
      .select("id, user_id, author_id, body, pinned, created_at")
      .eq("user_id", userId).order("pinned", { ascending: false }).order("created_at", { ascending: false });
    const list = (data ?? []) as Note[];
    const authorIds = [...new Set(list.map((n) => n.author_id).filter(Boolean))] as string[];
    let authors: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", authorIds);
      (profs ?? []).forEach((p: any) => { authors[p.id] = p; });
    }
    setNotes(list.map((n) => ({ ...n, author: n.author_id ? authors[n.author_id] : null })));
  };
  useEffect(() => { load(); }, [userId]);

  const add = async () => {
    if (!body.trim()) return;
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await (supabase as any).from("user_notes").insert({
      user_id: userId, author_id: sess.session?.user.id, body: body.trim(),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setBody(""); load();
  };
  const togglePin = async (n: Note) => {
    await (supabase as any).from("user_notes").update({ pinned: !n.pinned }).eq("id", n.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete note?")) return;
    await (supabase as any).from("user_notes").delete().eq("id", id);
    load();
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <StickyNote size={14} className="text-amber-500" /> Staff notes
      </h3>
      <div className="mb-3 flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Add a private staff note…"
          className="flex-1 rounded-md border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0ea5e9] focus:outline-none" />
        <button onClick={add} disabled={loading || !body.trim()}
          className="rounded-md bg-[#0ea5e9] px-3 py-2 text-xs font-extrabold text-white hover:bg-sky-600 disabled:opacity-50">
          <Plus size={14} className="inline" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {notes.length === 0 && <p className="text-xs italic text-[#9ca3af]">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className={`rounded-lg border p-3 text-sm ${n.pinned ? "border-amber-200 bg-amber-50" : "border-[#e5e7eb] bg-[#fafafa]"}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1 whitespace-pre-wrap text-[#111827]">{n.body}</p>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => togglePin(n)} className="rounded p-1 text-[#6b7280] hover:bg-white">
                  {n.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <button onClick={() => remove(n.id)} className="rounded p-1 text-red-600 hover:bg-white">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              {n.author?.username ? `@${n.author.username}` : "unknown"} · {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
