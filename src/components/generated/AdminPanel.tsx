import type { ReactNode } from 'react';
import { Archive, Bell, BookOpen, ClipboardList, Download, Eye, FileText, Flag, Gem, Gift, Globe, GraduationCap, Grid3x3, Info, Library, Lock, LucideIcon, Mail, MessageCircle, MessageSquare, Monitor, MoreVertical, Package, PenSquare, Pencil, Phone, Plus, RefreshCw, ScrollText, Settings, Shield, ShoppingCart, Tag, Ticket, Trash, TrendingUp, Trophy, Unlock, User, UserPlus, Users, UserX, Wrench, XCircle } from 'lucide-react';
import { Header } from '@/components/Header';
interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change: string;
  iconBg: string;
  trending?: boolean;
}
interface ActivityItem {
  id: string;
  avatar: string;
  name: string;
  action: string;
  time: string;
  icon: ReactNode;
  iconColor: string;
}
interface ReportedPost {
  id: string;
  title: string;
  reporter: string;
  reason: string;
}
interface UserMember {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Mod' | 'Member' | 'Banned';
  posts: number;
  joined: string;
  status: 'online' | 'offline';
}
interface CategoryActivity {
  id: string;
  name: string;
  count: number;
  percentage: number;
  icon: ReactNode;
}
interface QuickAction {
  id: string;
  icon: LucideIcon;
  label: string;
}
interface ShellNavItem {
  id: string;
  label: string;
  icon: ReactNode;
}
const SHELL_NAV_ITEMS: ShellNavItem[] = [{
  id: 'all-discussions',
  label: 'All Discussions',
  icon: <MessageSquare size={18} />
}, {
  id: 'contact-us',
  label: 'Contact Us',
  icon: <Phone size={18} />
}, {
  id: 'advertisement',
  label: 'Advertisement',
  icon: <Globe size={18} />
}, {
  id: 'about-us',
  label: 'About Us',
  icon: <Info size={18} />
}, {
  id: 'best-members',
  label: 'Best Members',
  icon: <Trophy size={18} />
}, {
  id: 'tags',
  label: 'Tags',
  icon: <Tag size={18} />
}];
const SHELL_CATEGORIES: ShellNavItem[] = [{
  id: 'give-away-freebies',
  label: 'Give-Away & Freebies',
  icon: <Gift size={18} />
}, {
  id: 'tutorials-methods',
  label: 'Tutorials & Methods',
  icon: <BookOpen size={18} />
}, {
  id: 'courses',
  label: 'Courses',
  icon: <GraduationCap size={18} />
}, {
  id: 'resources',
  label: 'Resources',
  icon: <Package size={18} />
}, {
  id: 'hq-leaks',
  label: 'HQ Leaks',
  icon: <Gem size={18} />
}, {
  id: 'tools-scripts',
  label: 'Tools & Scripts',
  icon: <Wrench size={18} />
}, {
  id: 'software-plugins',
  label: 'Software & Plugins',
  icon: <Monitor size={18} />
}, {
  id: 'cracked',
  label: 'Cracked',
  icon: <Unlock size={18} />
}, {
  id: 'free-coupons',
  label: 'Free Coupons',
  icon: <Ticket size={18} />
}, {
  id: 'ebooks',
  label: 'eBooks',
  icon: <Library size={18} />
}, {
  id: 'articles-news',
  label: 'Articles or News',
  icon: <FileText size={18} />
}, {
  id: 'discussion-solutions',
  label: 'Discussion & Solutions',
  icon: <MessageCircle size={18} />
}, {
  id: 'request',
  label: 'Request',
  icon: <ClipboardList size={18} />
}, {
  id: 'forum-rules',
  label: 'Forum Rules',
  icon: <ScrollText size={18} />
}, {
  id: 'marketplace',
  label: 'Marketplace',
  icon: <ShoppingCart size={18} />
}, {
  id: 'expired-not-working',
  label: 'Expired/Not Working',
  icon: <XCircle size={18} />
}];
const RECENT_ACTIVITY: ActivityItem[] = [{
  id: 'gamma-posted-thread',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GammaDot',
  name: 'GammaDot',
  action: 'posted new thread',
  time: '4m ago',
  icon: <MessageSquare size={12} />,
  iconColor: 'bg-sky-500'
}, {
  id: 'alex-replied-thread',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexCode',
  name: 'AlexCode',
  action: 'replied to thread',
  time: '12m ago',
  icon: <MessageCircle size={12} />,
  iconColor: 'bg-green-500'
}, {
  id: 'new-user-registered',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser123',
  name: 'NewUser123',
  action: 'registered as a member',
  time: '1h ago',
  icon: <UserPlus size={12} />,
  iconColor: 'bg-purple-500'
}, {
  id: 'joker-flagged-post',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JokerBoss',
  name: 'JokerBoss',
  action: 'post was flagged',
  time: '2h ago',
  icon: <Flag size={12} />,
  iconColor: 'bg-red-500'
}];
const REPORTED_POSTS: ReportedPost[] = [{
  id: 'crypto-leaks',
  title: 'Best crypto leaks 2024...',
  reporter: 'SafeMod',
  reason: 'Spam/Scam'
}, {
  id: 'bypass-filters',
  title: 'How to bypass filters...',
  reporter: 'ConcernedUser',
  reason: 'Abuse'
}, {
  id: 'cheap-accounts',
  title: 'Selling cheap accounts...',
  reporter: 'SystemBot',
  reason: 'Marketplace Violation'
}, {
  id: 'movie-link',
  title: 'Unreleased movie link...',
  reporter: 'DMCA_Agent',
  reason: 'Copyright'
}];
const RECENT_MEMBERS: UserMember[] = [{
  id: '1',
  name: 'Sarah Wilson',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  role: 'Admin',
  posts: 1204,
  joined: 'Oct 2021',
  status: 'online'
}, {
  id: '2',
  name: 'Mike Johnson',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  role: 'Mod',
  posts: 842,
  joined: 'Jan 2022',
  status: 'online'
}, {
  id: '3',
  name: 'Emily Davis',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
  role: 'Member',
  posts: 156,
  joined: 'Mar 2023',
  status: 'offline'
}, {
  id: '4',
  name: 'Chris Brown',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris',
  role: 'Banned',
  posts: 12,
  joined: 'Jun 2023',
  status: 'offline'
}, {
  id: '5',
  name: 'Jessica Lee',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
  role: 'Member',
  posts: 89,
  joined: 'Aug 2023',
  status: 'online'
}, {
  id: '6',
  name: 'David Smith',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  role: 'Member',
  posts: 42,
  joined: 'Sep 2023',
  status: 'online'
}];
const ADMIN_CATEGORIES: CategoryActivity[] = [{
  id: 'general-discussion',
  name: 'General Discussion',
  count: 12402,
  percentage: 85,
  icon: <MessageSquare size={16} />
}, {
  id: 'tech-development',
  name: 'Tech & Development',
  count: 8921,
  percentage: 65,
  icon: <Grid3x3 size={16} />
}, {
  id: 'marketplace',
  name: 'Marketplace',
  count: 5632,
  percentage: 40,
  icon: <ShoppingCart size={16} />
}, {
  id: 'creative-arts',
  name: 'Creative Arts',
  count: 3210,
  percentage: 25,
  icon: <Plus size={16} />
}];
const QUICK_ACTIONS: QuickAction[] = [{
  id: 'add-member',
  icon: UserPlus,
  label: 'Add Member'
}, {
  id: 'review-reports',
  icon: Flag,
  label: 'Review Reports'
}, {
  id: 'new-announcement',
  icon: MessageSquare,
  label: 'New Announcement'
}, {
  id: 'site-config',
  icon: Settings,
  label: 'Site Config'
}, {
  id: 'export-data',
  icon: Download,
  label: 'Export Data'
}, {
  id: 'clear-cache',
  icon: RefreshCw,
  label: 'Clear Cache'
}];
const StatCard = ({
  icon,
  label,
  value,
  change,
  iconBg,
  trending = false
}: StatCardProps) => {
  return <article className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-[#6b7280]"><span>{label}</span></p>
        <h2 className="text-2xl font-bold text-[#111827]"><span>{value}</span></h2>
      </div>
      <div className={`rounded-lg p-2.5 text-white ${iconBg}`}>{icon}</div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${trending ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
        {trending ? <TrendingUp size={12} /> : null}
        <span>{change}</span>
      </span>
      <span className="text-xs text-slate-400">vs last period</span>
    </div>
  </article>;
};
const RoleBadge = ({
  role
}: {
  role: UserMember['role'];
}) => {
  const styles: Record<UserMember['role'], string> = {
    Admin: 'border-sky-200 bg-sky-100 text-sky-700',
    Mod: 'border-green-200 bg-green-100 text-green-700',
    Member: 'border-slate-200 bg-slate-100 text-slate-600',
    Banned: 'border-red-200 bg-red-100 text-red-700'
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles[role]}`}><span>{role}</span></span>;
};
const QuickActionButton = ({
  icon: Icon,
  label
}: {
  icon: LucideIcon;
  label: string;
}) => {
  return <button className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-[#e5e7eb] bg-white p-4 transition-all hover:border-sky-300 hover:bg-sky-50">
    <span className="mb-2 text-slate-400 transition-colors group-hover:text-sky-500"><Icon size={24} /></span>
    <span className="text-center text-xs font-medium text-slate-600 transition-colors group-hover:text-sky-700">{label}</span>
  </button>;
};
export const AdminPanel = () => {
  return <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
    <Header />

    <div className="mx-auto flex max-w-[1440px] pt-16">
      <aside className="hidden min-h-[calc(100vh-4rem)] w-[260px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
        <div className="sticky top-16 space-y-5 px-5 py-6">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm" aria-labelledby="guest-title">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f8] text-[#6b7280] ring-1 ring-[#e5e7eb]">
              <User size={30} />
            </div>
            <h2 id="guest-title" className="mb-1 text-base font-bold text-[#111827]"><span>Welcome Guest</span></h2>
            <p className="mb-4 text-sm leading-6 text-[#6b7280]"><span>Join the community to save threads, reply faster, and follow useful resources.</span></p>
            <button className="w-full rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600"><span>Sign Up</span></button>
          </section>

          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600">
            <PenSquare size={18} />
            <span>Start a Discussion</span>
          </button>

          <nav className="space-y-1" aria-label="Forum navigation">
            {SHELL_NAV_ITEMS.map(item => <a key={item.id} href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]">
              <span className="text-[#0ea5e9]">{item.icon}</span>
              <span>{item.label}</span>
            </a>)}
          </nav>

          <div className="border-t border-[#e5e7eb] pt-5">
            <h2 className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]"><span>Categories</span></h2>
            <nav aria-label="Forum categories">
              <ul className="space-y-1">
                {SHELL_CATEGORIES.map(category => <li key={category.id}>
                  <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]">
                    <span className="text-[#6b7280]">{category.icon}</span>
                    <span className="truncate">{category.label}</span>
                  </a>
                </li>)}
              </ul>
            </nav>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">
            <StatCard icon={<Users size={20} />} label="Total Members" value="48,293" change="+127 this week" iconBg="bg-sky-500" trending />
            <StatCard icon={<MessageSquare size={20} />} label="Discussions" value="38,721" change="+89 today" iconBg="bg-green-500" trending />
            <StatCard icon={<MessageCircle size={20} />} label="Replies" value="241,885" change="+342 today" iconBg="bg-orange-500" trending />
            <StatCard icon={<Eye size={20} />} label="Page Views" value="24,891" change="+12%" iconBg="bg-purple-500" trending />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label="Moderation overview">
            <article className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h2 className="font-bold text-[#111827]"><span>Recent Activity</span></h2>
                <button className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[#0ea5e9] hover:text-sky-600"><span>View Full Logs</span></button>
              </div>
              <div className="flex-1 space-y-1 p-5">
                {RECENT_ACTIVITY.map(item => <div key={item.id} className="flex items-center justify-between border-b border-slate-50 py-3 first:pt-0 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={item.avatar} alt={`${item.name} avatar`} className="h-9 w-9 rounded-full bg-slate-100" />
                      <div className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-white p-0.5 text-white ${item.iconColor}`}>{item.icon}</div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900"><strong className="font-bold">{item.name}</strong><span className="ml-1 text-slate-500">{item.action}</span></p>
                      <p className="text-xs text-slate-400"><span>{item.time}</span></p>
                    </div>
                  </div>
                  <button className="text-slate-400 transition-colors hover:text-slate-600" aria-label={`Open activity actions for ${item.name}`}><MoreVertical size={16} /></button>
                </div>)}
              </div>
            </article>

            <article className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-2">
                  <Flag size={18} className="text-red-500" />
                  <h2 className="font-bold text-[#111827]"><span>Reported Posts</span></h2>
                </div>
                <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">4</span>
              </div>
              <div className="flex-1 space-y-1 p-5">
                {REPORTED_POSTS.map(post => <div key={post.id} className="border-b border-slate-50 py-3 first:pt-0 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-bold text-slate-900"><span>{post.title}</span></h3>
                      <p className="mt-0.5 text-xs text-slate-500"><span>By </span><strong className="font-medium text-slate-700">{post.reporter}</strong><span> · {post.reason}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 cursor-pointer rounded-lg border border-green-200 px-3 py-1.5 text-xs font-bold text-green-600 transition-colors hover:bg-green-50"><span>Approve</span></button>
                    <button className="flex-1 cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"><span>Remove</span></button>
                  </div>
                </div>)}
              </div>
              <div className="rounded-b-xl border-t border-slate-100 bg-slate-50 p-4">
                <button className="w-full cursor-pointer text-center text-xs font-bold uppercase text-slate-500 transition-colors hover:text-slate-800"><span>Review All Queue</span></button>
              </div>
            </article>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm" aria-labelledby="recent-members-title">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 id="recent-members-title" className="font-bold text-[#111827]"><span>Recent Members</span></h2>
              <button className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[#0ea5e9] hover:text-sky-600"><span>View All Members</span></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Avatar & Name</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Posts</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Joined</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RECENT_MEMBERS.map(user => <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={`${user.name} avatar`} className="h-9 w-9 rounded-full border border-slate-200 bg-slate-100" />
                        <span className="text-sm font-bold text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-slate-600">{user.posts.toLocaleString()}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-500"><span>{user.joined}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${user.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} aria-hidden="true"></span>
                        <span className="text-xs font-medium capitalize text-slate-500">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-500" title="Edit Profile"><Pencil size={16} /></button>
                        <button className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-orange-50 hover:text-orange-500" title="Ban User"><UserX size={16} /></button>
                        <button className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete Account"><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Category activity and quick actions">
            <article className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h2 className="font-bold text-[#111827]"><span>Category Activity</span></h2>
                <button className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-600" aria-label="Category activity options"><MoreVertical size={18} /></button>
              </div>
              <div className="space-y-1 p-5">
                {ADMIN_CATEGORIES.map(category => <div key={category.id} className="border-b border-slate-50 py-3 first:pt-0 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 p-1.5 text-slate-500">{category.icon}</span>
                      <span className="text-sm font-medium text-slate-900">{category.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{category.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#0ea5e9]" style={{
                      width: `${category.percentage}%`
                    }}></div>
                  </div>
                </div>)}
              </div>
              <div className="flex justify-center rounded-b-xl border-t border-slate-100 bg-slate-50 p-4">
                <button className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase text-slate-500 transition-colors hover:text-slate-800">
                  <Settings size={14} />
                  <span>Manage All Categories</span>
                </button>
              </div>
            </article>

            <article className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-bold text-[#111827]"><span>Quick Actions</span></h2>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4 p-5 sm:grid-cols-3">
                {QUICK_ACTIONS.map(action => <QuickActionButton key={action.id} icon={action.icon} label={action.label} />)}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  </div>;
};