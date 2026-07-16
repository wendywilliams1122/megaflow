import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Save, X, Download as DownloadIcon, Plus } from "lucide-react";
import { RichBody } from "./RichBody";
import { RichEditor } from "./RichEditor";


type Props = {
  table: "threads" | "posts";
  id: string;
  initialBody: string;
  initialTitle?: string;
  canEdit: boolean;
  onSaved?: () => void;
  bodyClassName?: string;
  children?: React.ReactNode;
};

type DL = { label: string; url: string };

// Extract [download url="..." label="..."] shortcodes from body → (cleanBody, downloads[])
function splitDownloads(input: string): { body: string; downloads: DL[] } {
  const downloads: DL[] = [];
  const re = /\[download\s+url=["']([^"']+)["'](?:\s+label=["']([^"']*)["'])?\s*\]/gi;
  const body = (input ?? "").replace(re, (_m, url, label) => {
    downloads.push({ url: String(url), label: (String(label ?? "").trim()) || "Download" });
    return "";
  });
  return { body: body.replace(/\n{3,}/g, "\n\n").trim(), downloads };
}

function serializeDownloads(dls: DL[]): string {
  return dls
    .map(
      (d) =>
        `[download url="${d.url.replace(/"/g, "&quot;")}" label="${d.label.replace(/"/g, "&quot;")}"]`,
    )
    .join("\n");
}

export function InlineEdit({ table, id, initialBody, initialTitle, canEdit, onSaved, bodyClassName }: Props) {
  const [editing, setEditing] = useState(false);
  const initial = splitDownloads(initialBody ?? "");
  const [body, setBody] = useState(initial.body);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [downloads, setDownloads] = useState<DL[]>(initial.downloads);
  const [dlLabel, setDlLabel] = useState("");
  const [dlUrl, setDlUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const addDownload = () => {
    const url = dlUrl.trim();
    if (!url) return toast.error("Enter a download URL");
    try { new URL(url); } catch { return toast.error("Enter a valid URL (https://…)"); }
    setDownloads((d) => [...d, { label: dlLabel.trim() || "Download", url }]);
    setDlLabel("");
    setDlUrl("");
  };

  const save = async () => {
    if (!body.trim()) return toast.error("Body can't be empty");
    if (table === "threads" && !title.trim()) return toast.error("Title can't be empty");
    setSaving(true);
    const dlBlock = serializeDownloads(downloads);
    const finalBody = dlBlock ? `${body}\n${dlBlock}` : body;
    const query = table === "threads"
      ? supabase.from("threads").update({ body: finalBody, title })
      : supabase.from("posts").update({ body: finalBody });
    const { error } = await query.eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditing(false);
    onSaved?.();
  };

  const startEditing = () => {
    const fresh = splitDownloads(initialBody ?? "");
    setBody(fresh.body);
    setDownloads(fresh.downloads);
    setTitle(initialTitle ?? "");
    setDlLabel("");
    setDlUrl("");
    setEditing(true);
  };

  if (!editing) {
    return (
      <div className="min-w-0 flex-1">
        <RichBody text={initialBody} className={bodyClassName} />
        {canEdit && (
          <button
            onClick={startEditing}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-bold text-[#374151] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
          >
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 space-y-3">
      {table === "threads" && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-base font-extrabold text-[#111827] focus:border-[#0ea5e9] focus:outline-none"
          maxLength={200}
        />
      )}
      <RichEditor
        value={body}
        onChange={setBody}
        placeholder={table === "threads" ? "Write your post…" : "Write your reply…"}
        minHeight={table === "threads" ? 260 : 180}
      />

      <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
        <div className="mb-3 flex items-center gap-2">
          <DownloadIcon size={16} className="text-[#0ea5e9]" />
          <h3 className="text-sm font-extrabold text-[#111827]">Download Links</h3>
          <span className="text-xs text-[#6b7280]">(add one or more — shown as animated buttons)</span>
        </div>

        {downloads.length > 0 && (
          <ul className="mb-3 space-y-2">
            {downloads.map((d, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm">
                <span className="font-bold text-[#111827]">{d.label}</span>
                <span className="truncate text-xs text-[#6b7280]">{d.url}</span>
                <button
                  type="button"
                  onClick={() => setDownloads((arr) => arr.filter((_, j) => j !== i))}
                  className="ml-auto rounded-md p-1 text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={dlLabel}
            onChange={(e) => setDlLabel(e.target.value)}
            placeholder="Label (e.g. Course PDF)"
            className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm sm:w-56"
            maxLength={60}
          />
          <input
            value={dlUrl}
            onChange={(e) => setDlUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addDownload}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

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
