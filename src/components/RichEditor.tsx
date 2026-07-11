import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon,
  Undo, Redo, Minus,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function RichEditor({ value, onChange, placeholder = "Write your post…", minHeight = 260 }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg border border-[#e5e7eb] my-2 max-w-full h-auto" } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#0ea5e9] underline" } }),
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360, HTMLAttributes: { class: "rounded-lg my-3 w-full aspect-video" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: `tiptap prose prose-sm max-w-none focus:outline-none p-4`,
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const uploadImage = useCallback(async (file: File, ed: Editor) => {
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) return toast.error("Sign in to upload images");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("forum-uploads").upload(path, file, {
      contentType: file.type, upsert: false,
    });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("forum-uploads").getPublicUrl(path);
    ed.chain().focus().setImage({ src: data.publicUrl }).run();
  }, []);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("Link URL", editor.getAttributes("link").href ?? "https://");
    if (url === null) return;
    if (url === "") return editor.chain().focus().unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("Video URL (YouTube)");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const Btn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-[#374151] transition-colors ${
        active ? "border-[#0ea5e9] bg-sky-50 text-[#0ea5e9]" : "border-transparent hover:border-[#e5e7eb] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white focus-within:border-[#0ea5e9] focus-within:ring-4 focus-within:ring-sky-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e5e7eb] bg-[#f6f7f8] p-2">
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></Btn>
        <Btn title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-[#e5e7eb]" />
        <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></Btn>
        <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={15} /></Btn>
        <Btn title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></Btn>
        <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={15} /></Btn>
        <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-[#e5e7eb]" />
        <Btn title="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon size={15} /></Btn>
        <Btn title="Upload image" onClick={() => fileRef.current?.click()}><ImageIcon size={15} /></Btn>
        <Btn title="Embed video by URL" onClick={addYoutube}><YoutubeIcon size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-[#e5e7eb]" />
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo size={15} /></Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo size={15} /></Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f, editor);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
