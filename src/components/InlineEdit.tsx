import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";
import { RichBody } from "./RichBody";

type Props = {
  table: "threads" | "posts";
  id: string;
  initialBody: string;
  initialTitle?: string;
  canEdit: boolean;
  onSaved?: () => void;
  bodyClassName?: string;
  children?: React.ReactNode; // rendered title/body area when not editing (fallback to RichBody)
};

export function InlineEdit({ table, id, initialBody, initialTitle, canEdit, onSaved, bodyClassName }: Props) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody ?? "");
  const [title, setTitle] = useState(initialTitle ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!body.trim()) return toast.error("Body can't be empty");
    if (table === "threads" && !title.trim()) return toast.error("Title can't be empty");
    setSaving(true);
    const query = table === "threads"
      ? supabase.from("threads").update({ body, title })
      : supabase.from("posts").update({ body });
    const { error } = await query.eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditing(false);
    onSaved?.();
  };

  if (!editing) {
    return (
      <div className="min-w-0 flex-1">
        <RichBody text={initialBody} className={bodyClassName} />
        {canEdit && (
          <button
            onClick={() => { setBody(initialBody); setTitle(initialTitle ?? ""); setEditing(true); }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-bold text-[#374151] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
          >
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {table === "threads" && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-base font-extrabold text-[#111827] focus:border-[#0ea5e9] focus:outline-none"
          maxLength={200}
        />
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={table === "threads" ? 10 : 6}
        className="w-full resize-y rounded-lg border border-[#e5e7eb] bg-white p-3 text-sm leading-7 text-[#111827] focus:border-[#0ea5e9] focus:outline-none"
        maxLength={20000}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-50"
        >
          <Save size={12} /> {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-bold text-[#374151] hover:border-[#e5e7eb]"
        >
          <X size={12} /> Cancel
        </button>
        <span className="ml-auto text-[11px] text-[#6b7280]">HTML/markdown allowed</span>
      </div>
    </div>
  );
}
