import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/forum";
import { ShieldAlert, Send, Check, Play, Pause, XCircle } from "lucide-react";

export const Route = createFileRoute("/mod-chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat Moderation — MegaFlow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModChatDetail,
});

type Conv = {
  id: string; user_min: string; user_max: string;
  status: "pending" | "active" | "stopped" | "ended";
  status_note: string | null; approved_at: string | null;
};
type Msg = {
  id: string; sender_id: string; recipient_id: string; body: string;
  created_at: string; is_staff_intervention: boolean;
};

function ModChatDetail() {
  const { id } = Route.useParams();
  const { user, isModerator, loading } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [recipient, setRecipient] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: ["mod-conv", id],
    enabled: !!isModerator,
    queryFn: async () => {
      const { data } = await supabase.from("conversations")
        .select("id, user_min, user_max, status, status_note, approved_at")
        .eq("id", id).maybeSingle();
      return data as Conv | null;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["mod-conv-parties", conv?.user_min, conv?.user_max],
    enabled: !!conv,
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", [conv!.user_min, conv!.user_max]);
      const m: Record<string, any> = {};
      (data ?? []).forEach((p: any) => { m[p.id] = p; });
      return m;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["mod-conv-messages", id],
    enabled: !!conv,
    queryFn: async () => {
      const { data } = await supabase.from("messages")
        .select("id, sender_id, recipient_id, body, created_at, is_staff_intervention")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    if (!conv) return;
    if (!recipient) setRecipient(conv.user_min);
  }, [conv, recipient]);

  useEffect(() => {
    if (!conv) return;
    const channel = supabase.channel("mod-chat-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["mod-conv-messages", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["mod-conv", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, conv, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  if (loading) return <div className="p-10 text-center text-sm text-[#6b7280]">Loading…</div>;
  if (!user) return <div className="p-10 text-center text-sm text-[#6b7280]">Sign in required.</div>;
  if (!isModerator) { throw redirect({ to: "/" }); }

  async function setStatus(status: "active" | "stopped" | "ended", promptNote = true) {
    if (!user || !conv) return;
    const note = promptNote ? (prompt("Optional note for participants:") ?? null) : null;
    const patch: any = {
      status, status_changed_by: user.id, status_note: note,
    };
    if (status === "active") {
      patch.approved_by = user.id;
      patch.approved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("conversations").update(patch).eq("id", conv.id);
    if (error) { alert(error.message); return; }
    qc.invalidateQueries({ queryKey: ["mod-conv", id] });
    qc.invalidateQueries({ queryKey: ["mod-conversations"] });
  }

  async function sendAsStaff() {
    if (!user || !conv || !text.trim() || !recipient) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id, recipient_id: recipient, body,
    });
    if (error) { alert(error.message); setText(body); return; }
    qc.invalidateQueries({ queryKey: ["mod-conv-messages", id] });
  }

  if (!conv) return <div className="p-10 text-center text-sm text-[#6b7280]">Conversation not found.</div>;

  const a = profiles?.[conv.user_min];
  const b = profiles?.[conv.user_max];

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col gap-3 p-3">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <ShieldAlert className="text-red-600" size={22} />
          <div className="text-lg font-extrabold text-[#111827]">Staff view</div>
          <Link to="/mod-chats" className="ml-auto text-sm font-bold text-[#0ea5e9] hover:underline">← All chats</Link>
        </div>
        <div className="mt-2 text-sm text-[#374151]">
          <b>@{a?.username ?? "…"}</b> ↔ <b>@{b?.username ?? "…"}</b>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-extrabold uppercase ${
            conv.status === "active" ? "bg-emerald-100 text-emerald-700" :
            conv.status === "pending" ? "bg-amber-100 text-amber-700" :
            conv.status === "stopped" ? "bg-slate-100 text-slate-700" :
            "bg-red-100 text-red-700"
          }`}>{conv.status}</span>
        </div>
        {conv.status_note && <p className="mt-1 text-xs italic text-[#6b7280]">Note: {conv.status_note}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {conv.status !== "active" && (
            <button onClick={() => setStatus("active")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
              <Check size={12} /> {conv.status === "pending" ? "Approve" : "Resume"}
            </button>
          )}
          {conv.status === "active" && (
            <button onClick={() => setStatus("stopped")} className="inline-flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
              <Pause size={12} /> Pause
            </button>
          )}
          {conv.status === "stopped" && (
            <button onClick={() => setStatus("active")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
              <Play size={12} /> Resume
            </button>
          )}
          {conv.status !== "ended" && (
            <button onClick={() => setStatus("ended")} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">
              <XCircle size={12} /> End
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {(messages ?? []).map((m) => {
            const isA = m.sender_id === conv.user_min;
            const senderProfile = profiles?.[m.sender_id];
            return (
              <div key={m.id} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.is_staff_intervention ? "border-2 border-red-400 bg-red-50 text-red-900" :
                  isA ? "bg-[#f1f5f9] text-[#111827]" : "bg-sky-100 text-[#111827]"
                }`}>
                  <div className="text-[10px] font-extrabold uppercase text-[#6b7280]">
                    @{senderProfile?.username ?? "…"} {m.is_staff_intervention && <span className="text-red-700">· staff</span>}
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="mt-1 text-[10px] text-[#6b7280]">{timeAgo(m.created_at)}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="border-t border-[#e5e7eb] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-[#6b7280]">
            <span>Reply as staff to:</span>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="rounded border border-[#e5e7eb] px-2 py-1 text-xs"
            >
              <option value={conv.user_min}>@{a?.username ?? "user"}</option>
              <option value={conv.user_max}>@{b?.username ?? "user"}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAsStaff(); } }}
              rows={2}
              maxLength={4000}
              placeholder="Message from staff…"
              className="flex-1 resize-none rounded-lg border border-red-200 bg-red-50 p-2 text-sm outline-none focus:border-red-400"
            />
            <button
              onClick={sendAsStaff}
              disabled={!text.trim()}
              className="inline-flex items-center gap-1 self-end rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
