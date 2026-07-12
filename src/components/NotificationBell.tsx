import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/lib/forum";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_EMOJI: Record<string, string> = {
  reply: "💬",
  mention: "@",
  reaction: "😊",
  bookmark: "🔖",
  badge: "🏆",
  system: "📢",
  moderation: "🛡️",
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as never)
      .select("id, type, title, body, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);
    const list = (data as Notif[] | null) ?? [];
    setItems(list);
    setUnread(list.filter((n) => !n.is_read).length);
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }
    load();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markOne = async (id: string) => {
    await supabase.from("notifications" as never).update({ is_read: true } as never).eq("id", id);
    setItems((s) => s.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(u - 1, 0));
  };

  const markAll = async () => {
    if (!user) return;
    await supabase
      .from("notifications" as never)
      .update({ is_read: true } as never)
      .eq("user_id", user.id)
      .eq("is_read", false);
    setItems((s) => s.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const remove = async (id: string) => {
    await supabase.from("notifications" as never).delete().eq("id", id);
    setItems((s) => s.filter((n) => n.id !== id));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f6f7f8] px-4 py-3">
            <h3 className="text-sm font-extrabold text-[#111827]">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-[#0ea5e9] hover:bg-sky-50"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#6b7280]">
                <Bell className="mx-auto mb-2 opacity-40" size={24} />
                <p>You're all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#e5e7eb]">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`group flex gap-3 px-4 py-3 hover:bg-[#f6f7f8] ${
                      !n.is_read ? "bg-sky-50/50" : ""
                    }`}
                  >
                    <span className="mt-0.5 text-lg">{TYPE_EMOJI[n.type] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      {n.link ? (
                        <Link
                          to={n.link as "/"}
                          onClick={() => {
                            if (!n.is_read) markOne(n.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          <p className="line-clamp-2 text-sm font-semibold text-[#111827]">{n.title}</p>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-[#6b7280]">{n.body}</p>
                          )}
                        </Link>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#111827]">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-xs text-[#6b7280]">{n.body}</p>}
                        </>
                      )}
                      <p className="mt-1 text-[11px] text-[#6b7280]">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!n.is_read && (
                        <button
                          onClick={() => markOne(n.id)}
                          title="Mark read"
                          className="rounded p-1 text-[#6b7280] hover:bg-white hover:text-[#0ea5e9]"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        title="Delete"
                        className="rounded p-1 text-[#6b7280] hover:bg-white hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[#e5e7eb] bg-[#f6f7f8] px-4 py-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#0ea5e9] hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
