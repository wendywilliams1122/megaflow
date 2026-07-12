import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/forum";
import { Send, MessageCircle, ShieldAlert, Clock, Ban, XCircle } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — MegaFlow" },
      { name: "description", content: "Your private conversations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ to: typeof s.to === "string" ? s.to : undefined }),
  component: MessagesPage,
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; read_at: string | null; created_at: string; is_staff_intervention?: boolean };
type Conversation = { id: string; user_min: string; user_max: string; status: "pending" | "active" | "stopped" | "ended"; status_note: string | null };
type Profile = { id: string; username: string; display_name: string | null; avatar_url: string | null };

function MessagesPage() {
  const { user, isModerator } = useAuth();
  const { to } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: allMessages } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at, is_staff_intervention")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true });
      return (data ?? []) as Msg[];
    },
    enabled: !!user,
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("conversations")
        .select("id, user_min, user_max, status, status_note")
        .or(`user_min.eq.${user.id},user_max.eq.${user.id}`);
      return (data ?? []) as Conversation[];
    },
    enabled: !!user,
  });

  const convByPartner = useMemo(() => {
    const m: Record<string, Conversation> = {};
    if (!user || !conversations) return m;
    for (const c of conversations) {
      const other = c.user_min === user.id ? c.user_max : c.user_min;
      m[other] = c;
    }
    return m;
  }, [conversations, user]);

  // Derive conversation partners
  const partners = useMemo(() => {
    if (!user || !allMessages) return [] as { id: string; lastAt: string; lastBody: string; unread: number }[];
    const map = new Map<string, { id: string; lastAt: string; lastBody: string; unread: number }>();
    for (const m of allMessages) {
      const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const cur = map.get(other);
      const unreadInc = m.recipient_id === user.id && !m.read_at ? 1 : 0;
      if (!cur || cur.lastAt < m.created_at) {
        map.set(other, { id: other, lastAt: m.created_at, lastBody: m.body, unread: (cur?.unread ?? 0) + unreadInc });
      } else {
        cur.unread += unreadInc;
      }
    }
    return [...map.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  }, [allMessages, user]);

  // Resolve `?to=username` → user id, then open that conversation
  useQuery({
    queryKey: ["dm-open-username", to],
    enabled: !!to && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id").eq("username", to!).maybeSingle();
      if (data?.id) {
        setActive(data.id);
        navigate({ to: "/messages", search: {}, replace: true });
      }
      return data;
    },
  });

  useEffect(() => {
    if (!active && partners.length > 0) setActive(partners[0].id);
  }, [partners, active]);

  const partnerIds = useMemo(() => {
    const ids = new Set(partners.map((p) => p.id));
    if (active) ids.add(active);
    return [...ids];
  }, [partners, active]);

  const { data: profileMap } = useQuery({
    queryKey: ["dm-profiles", partnerIds.join(",")],
    enabled: partnerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", partnerIds);
      const map: Record<string, Profile> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p; });
      return map;
    },
  });

  const conversation = useMemo(() => {
    if (!user || !allMessages || !active) return [] as Msg[];
    return allMessages.filter((m) =>
      (m.sender_id === user.id && m.recipient_id === active) ||
      (m.sender_id === active && m.recipient_id === user.id)
    );
  }, [allMessages, user, active]);

  // Mark unread as read when opening
  useEffect(() => {
    if (!user || !active) return;
    const unread = conversation.filter((m) => m.recipient_id === user.id && !m.read_at).map((m) => m.id);
    if (unread.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {
      qc.invalidateQueries({ queryKey: ["messages", user.id] });
    });
  }, [active, conversation, user, qc]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["messages", user.id] });
        qc.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        qc.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length, active]);

  const activeConv = active ? convByPartner[active] : undefined;
  const myMsgCount = active && user
    ? conversation.filter((m) => m.sender_id === user.id).length
    : 0;
  const canSend = (() => {
    if (!active || !user) return false;
    if (isModerator) return true;
    if (!activeConv) return true; // first-ever message creates pending
    if (activeConv.status === "active") return true;
    if (activeConv.status === "pending") return myMsgCount === 0;
    return false; // stopped / ended
  })();

  async function send() {
    if (!user || !active || text.trim().length === 0 || !canSend) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id, recipient_id: active, body,
    });
    if (error) { alert(error.message); setText(body); return; }
    qc.invalidateQueries({ queryKey: ["messages", user.id] });
    qc.invalidateQueries({ queryKey: ["conversations", user.id] });
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="mb-4 text-[#6b7280]">Sign in to view your messages.</p>
        <Link to="/auth" className="inline-block rounded-lg bg-[#0ea5e9] px-4 py-2 font-bold text-white">Sign in</Link>
      </div>
    );
  }

  const activeProfile = active ? profileMap?.[active] : undefined;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl gap-3 p-3">
      {/* Sidebar */}
      <aside className="w-full max-w-xs shrink-0 overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] p-4">
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-[#111827]">
            <MessageCircle size={18} /> Messages
          </h1>
        </div>
        {partners.length === 0 && (
          <div className="p-6 text-sm text-[#6b7280]">
            No conversations yet. Open a profile and click "Message".
          </div>
        )}
        {partners.map((p) => {
          const prof = profileMap?.[p.id];
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`flex w-full items-center gap-3 border-b border-[#f1f5f9] p-3 text-left hover:bg-[#f6f7f8] ${isActive ? "bg-sky-50" : ""}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9] text-sm font-extrabold text-white">
                {(prof?.username ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-[#111827]">
                    @{prof?.username ?? "…"}
                  </span>
                  {p.unread > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{p.unread}</span>
                  )}
                </div>
                <div className="truncate text-xs text-[#6b7280]">{p.lastBody}</div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Conversation */}
      <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[#e5e7eb] bg-white">
        {!active ? (
          <div className="m-auto text-sm text-[#6b7280]">Select a conversation to start chatting.</div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-[#e5e7eb] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0ea5e9] text-sm font-extrabold text-white">
                {(activeProfile?.username ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-extrabold text-[#111827]">
                  {activeProfile?.display_name ?? activeProfile?.username ?? "Loading…"}
                </div>
                {activeProfile?.username && (
                  <Link to="/u/$username" params={{ username: activeProfile.username }} className="text-xs text-[#6b7280] hover:text-[#0ea5e9]">
                    @{activeProfile.username}
                  </Link>
                )}
              </div>
            </header>

            {activeConv && activeConv.status !== "active" && (
              <div className={`flex items-start gap-2 border-b px-4 py-3 text-sm ${
                activeConv.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-800" :
                activeConv.status === "stopped" ? "border-slate-200 bg-slate-50 text-slate-700" :
                "border-red-200 bg-red-50 text-red-700"
              }`}>
                {activeConv.status === "pending" && <Clock size={16} className="mt-0.5" />}
                {activeConv.status === "stopped" && <Ban size={16} className="mt-0.5" />}
                {activeConv.status === "ended" && <XCircle size={16} className="mt-0.5" />}
                <div>
                  <div className="font-bold">
                    {activeConv.status === "pending" && "Waiting for staff approval"}
                    {activeConv.status === "stopped" && "Paused by staff"}
                    {activeConv.status === "ended" && "Ended by staff"}
                  </div>
                  <div className="text-xs opacity-80">
                    {activeConv.status === "pending" && "Your first message was delivered. Further replies unlock once a moderator approves this chat."}
                    {activeConv.status === "stopped" && "A moderator has paused this conversation. It may resume later."}
                    {activeConv.status === "ended" && "This conversation has been closed by staff."}
                    {activeConv.status_note && <span className="mt-1 block italic">Note: {activeConv.status_note}</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {conversation.map((m) => {
                const mine = m.sender_id === user.id;
                const staff = m.is_staff_intervention;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      staff ? "border-2 border-red-400 bg-red-50 text-red-900" :
                      mine ? "bg-[#0ea5e9] text-white" : "bg-[#f1f5f9] text-[#111827]"
                    }`}>
                      {staff && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-extrabold uppercase text-red-700">
                          <ShieldAlert size={10} /> Staff intervention
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      <div className={`mt-1 text-[10px] ${staff ? "text-red-700" : mine ? "text-sky-100" : "text-[#6b7280]"}`}>
                        {timeAgo(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="border-t border-[#e5e7eb] p-3">
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={2}
                  maxLength={4000}
                  placeholder={
                    !canSend && activeConv?.status === "pending" ? "Waiting for staff approval…" :
                    !canSend && activeConv?.status === "stopped" ? "Conversation paused by staff" :
                    !canSend && activeConv?.status === "ended" ? "Conversation ended by staff" :
                    "Type a message…"
                  }
                  disabled={!canSend}
                  className="flex-1 resize-none rounded-lg border border-[#e5e7eb] p-2 text-sm outline-none focus:border-[#0ea5e9] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                />
                <button
                  onClick={send}
                  disabled={text.trim().length === 0 || !canSend}
                  className="inline-flex items-center gap-1 self-end rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284c7] disabled:opacity-50"
                >
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
