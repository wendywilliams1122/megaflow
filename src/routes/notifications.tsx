import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SideRail } from "@/components/SideRail";
import { timeAgo } from "@/lib/forum";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications - MegaFlow" },
      { name: "description", content: "Your MegaFlow notifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-red-600">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center text-sm">Not found.</div>,
});

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

function NotificationsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications" as never)
        .select("id, type, title, body, link, is_read, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return (data as Notif[] | null) ?? [];
    },
  });

  const markAll = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications" as never)
      .update({ is_read: true } as never)
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications-all", user.id] });
  };

  const clearAll = async () => {
    if (!user || !confirm("Delete all notifications?")) return;
    const { error } = await supabase.from("notifications" as never).delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications-all", user.id] });
  };

  const remove = async (id: string) => {
    await supabase.from("notifications" as never).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications-all", user?.id] });
  };

  if (!loading && !user) {
    return (
      <div className="mx-auto flex max-w-[1440px]">
        <SideRail />
        <main className="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center shadow-sm">
            <Bell className="mx-auto mb-3 text-[#0ea5e9]" size={32} />
            <h1 className="text-2xl font-extrabold text-[#111827]">Sign in for notifications</h1>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="mt-5 inline-block rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const unread = data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#111827]">
                <Bell className="text-[#0ea5e9]" size={24} /> Notifications
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                {unread} unread · {data?.length ?? 0} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              {(data?.length ?? 0) > 0 && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={14} /> Clear all
                </button>
              )}
            </div>
          </header>

          {isLoading && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
              Loading…
            </div>
          )}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center">
              <Bell className="mx-auto mb-3 text-[#6b7280] opacity-50" size={32} />
              <h3 className="text-base font-bold text-[#111827]">No notifications yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#6b7280]">
                When someone replies or reacts to your posts, you'll see it here.
              </p>
            </div>
          )}

          <ul className="divide-y divide-[#e5e7eb] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
            {data?.map((n) => (
              <li
                key={n.id}
                className={`group flex items-start gap-3 px-4 py-4 hover:bg-[#f6f7f8] ${
                  !n.is_read ? "bg-sky-50/50" : ""
                }`}
              >
                <span className="mt-0.5 text-xl">{TYPE_EMOJI[n.type] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link to={n.link as "/"} className="block">
                      <p className="text-sm font-semibold text-[#111827]">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-[#6b7280]">{n.body}</p>}
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#111827]">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-[#6b7280]">{n.body}</p>}
                    </>
                  )}
                  <p className="mt-1 text-[11px] text-[#6b7280]">{timeAgo(n.created_at)}</p>
                </div>
                <button
                  onClick={() => remove(n.id)}
                  className="rounded p-1.5 text-[#6b7280] opacity-0 transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
