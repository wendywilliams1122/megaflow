import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, Bell, Bookmark, ChevronRight, Clock, Eye, FileText, Mail, MessageSquare, PenSquare, Star, TrendingUp, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BadgeList } from "@/components/BadgeList";
import { LevelBadge } from "@/components/LevelBadge";

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function RealDashboard() {
  const { user, profile } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const uid = user!.id;
      const [threadsCount, postsCount, bookmarksCount, unreadNotif, unreadMsgs, myThreads, notifs, msgs] = await Promise.all([
        supabase.from("threads").select("id", { count: "exact", head: true }).eq("author_id", uid),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", uid),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", uid).is("read_at", null),
        supabase.from("threads").select("id, title, slug, reply_count, view_count, last_activity_at, category:categories!threads_category_id_fkey(name)").eq("author_id", uid).order("last_activity_at", { ascending: false }).limit(6),
        supabase.from("notifications").select("id, title, body, link, created_at, is_read").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase.from("messages").select("id, body, created_at, read_at, sender_id, recipient_id").or(`sender_id.eq.${uid},recipient_id.eq.${uid}`).order("created_at", { ascending: false }).limit(5),
      ]);
      const msgList = (msgs.data ?? []) as any[];
      const otherIds = Array.from(new Set(msgList.map((m) => (m.sender_id === uid ? m.recipient_id : m.sender_id))));
      let profMap: Record<string, any> = {};
      if (otherIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", otherIds);
        (profs ?? []).forEach((p: any) => { profMap[p.id] = p; });
      }
      const msgsWithProfile = msgList.map((m) => ({ ...m, other: profMap[m.sender_id === uid ? m.recipient_id : m.sender_id], outgoing: m.sender_id === uid }));
      return {
        threads: threadsCount.count ?? 0,
        posts: postsCount.count ?? 0,
        bookmarks: bookmarksCount.count ?? 0,
        unreadNotif: unreadNotif.count ?? 0,
        unreadMsgs: unreadMsgs.count ?? 0,
        myThreads: (myThreads.data ?? []) as any[],
        notifs: (notifs.data ?? []) as any[],
        msgs: msgsWithProfile,
      };
    },
  });

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center">
          <p className="text-sm text-[#6b7280]">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "My Threads", value: data?.threads ?? 0, icon: FileText, tone: "text-sky-500", bg: "bg-sky-50" },
    { label: "Points", value: profile.points ?? 0, icon: Star, tone: "text-amber-500", bg: "bg-amber-50" },
    { label: "My Replies", value: data?.posts ?? 0, icon: MessageSquare, tone: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Bookmarks", value: data?.bookmarks ?? 0, icon: Bookmark, tone: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-white shadow-xl shadow-sky-100">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back, {profile.display_name || profile.username}!</h1>
            <p className="mt-1 font-medium text-sky-100">@{profile.username} · joined {timeAgo(user.created_at)}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <TrendingUp size={16} className="text-sky-200" />
                <span className="text-sm font-semibold">{data?.threads ?? 0} Threads</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <Star size={16} className="text-amber-300" />
                <span className="text-sm font-semibold">{profile.points ?? 0} Points</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur-md">
                <LevelBadge points={profile.points} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/new" className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95">
              <PenSquare size={18} /> Start Discussion
            </Link>
            <Link to="/u/$username" params={{ username: profile.username }} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95">
              <User size={18} /> View Profile
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl"></div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-2.5 ${s.bg} ${s.tone} transition-transform group-hover:scale-110`}>
                <s.icon size={22} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                <div className="mt-1 text-2xl font-black text-slate-900">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Notifications + Messages */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-900" />
              <h3 className="font-bold text-slate-900">Notifications</h3>
              {(data?.unreadNotif ?? 0) > 0 && (
                <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">{data!.unreadNotif}</span>
              )}
            </div>
            <Link to="/notifications" className="text-xs font-bold text-sky-500 hover:text-sky-600">View All</Link>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {(data?.notifs ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">No notifications yet.</div>
            )}
            {data?.notifs.map((n: any) => (
              <Link key={n.id} to="/notifications" className={`flex gap-3 p-4 hover:bg-slate-50 ${!n.is_read ? "bg-sky-50/30" : ""}`}>
                <div className="mt-0.5 text-sky-500"><Bell size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body && <p className="truncate text-xs text-slate-500">{n.body}</p>}
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-400"><Clock size={10} /> {timeAgo(n.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-slate-900" />
              <h3 className="font-bold text-slate-900">Messages</h3>
              {(data?.unreadMsgs ?? 0) > 0 && (
                <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">{data!.unreadMsgs}</span>
              )}
            </div>
            <Link to="/messages" className="text-xs font-bold text-sky-500 hover:text-sky-600">Go to Inbox</Link>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {(data?.msgs ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">No messages yet.</div>
            )}
            {data?.msgs.map((m: any) => (
              <Link key={m.id} to="/messages" className={`flex gap-3 p-4 hover:bg-slate-50 ${!m.read_at ? "bg-sky-50/20" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                  {(m.profiles?.username ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{m.profiles?.display_name || m.profiles?.username || "User"}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{timeAgo(m.created_at)}</span>
                  </div>
                  <p className="truncate text-xs leading-tight text-slate-500">{m.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* My Threads */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900">My Recent Threads</h3>
          <Link to="/u/$username" params={{ username: profile.username }} className="text-xs font-bold text-sky-500 hover:text-sky-600">View Profile</Link>
        </div>
        {(data?.myThreads ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            You haven't started any threads yet.{" "}
            <Link to="/new" className="font-bold text-sky-600 hover:underline">Start your first discussion</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Engagement</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.myThreads.map((t: any) => (
                  <tr key={t.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link to="/t/$slug" params={{ slug: t.slug }} className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-sky-600">{t.title}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{t.category?.name ?? "General"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1.5"><MessageSquare size={14} /><span className="text-xs font-medium">{t.reply_count ?? 0}</span></div>
                        <div className="flex items-center gap-1.5"><Eye size={14} /><span className="text-xs font-medium">{t.view_count ?? 0}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400"><Clock size={12} /><span className="text-xs font-medium">{timeAgo(t.last_activity_at)}</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/t/$slug" params={{ slug: t.slug }} className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 hover:text-sky-600">
                        Open <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Badges */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Award size={18} className="text-slate-900" />
          <h3 className="font-bold text-slate-900">My Badges</h3>
        </div>
        <BadgeList userId={user.id} />
      </section>
    </div>
  );
}
