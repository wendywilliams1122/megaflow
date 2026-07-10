import * as React from "react";
import { Award, Bell, BookOpen, Bookmark, CheckCircle, ChevronRight, ClipboardList, Clock, Crown, Eye, FileText, Gem, Gift, Globe, GraduationCap, Heart, Info, Library, LogIn, Mail, Menu, MessageCircle, MessageSquare, Monitor, Newspaper, Package, PenSquare, Phone, ScrollText, Search, Shield, ShoppingCart, Star, Tag, Ticket, Trash2, TrendingUp, Trophy, Unlock, User, Wrench, XCircle, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Types & Constants
 */

interface Stat {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  iconColor: string;
}
interface Activity {
  id: string;
  type: "thread" | "reply" | "badge" | "save" | "follow";
  text: string;
  link: string;
  time: string;
  icon: React.ElementType;
  color: string;
}
interface Notification {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  unread?: boolean;
}
interface Discussion {
  id: string;
  title: string;
  category: string;
  replies: number;
  views: string;
  lastActivity: string;
}
interface Message {
  id: string;
  sender: string;
  avatar: string;
  preview: string;
  time: string;
  unread?: boolean;
}
interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
interface CategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
const sidebarNavItems: SidebarNavItem[] = [{
  id: "all-discussions",
  label: "All Discussions",
  icon: <MessageSquare size={18} />
}, {
  id: "contact-us",
  label: "Contact Us",
  icon: <Phone size={18} />
}, {
  id: "advertisement",
  label: "Advertisement",
  icon: <Globe size={18} />
}, {
  id: "about-us",
  label: "About Us",
  icon: <Info size={18} />
}, {
  id: "best-members",
  label: "Best Members",
  icon: <Trophy size={18} />
}, {
  id: "tags",
  label: "Tags",
  icon: <Tag size={18} />
}];
const categories: CategoryItem[] = [{
  id: "give-away-freebies",
  label: "Give-Away & Freebies",
  icon: <Gift size={18} />
}, {
  id: "tutorials-methods",
  label: "Tutorials & Methods",
  icon: <BookOpen size={18} />
}, {
  id: "courses",
  label: "Courses",
  icon: <GraduationCap size={18} />
}, {
  id: "resources",
  label: "Resources",
  icon: <Package size={18} />
}, {
  id: "hq-leaks",
  label: "HQ Leaks",
  icon: <Gem size={18} />
}, {
  id: "tools-scripts",
  label: "Tools & Scripts",
  icon: <Wrench size={18} />
}, {
  id: "software-plugins",
  label: "Software & Plugins",
  icon: <Monitor size={18} />
}, {
  id: "cracked",
  label: "Cracked",
  icon: <Unlock size={18} />
}, {
  id: "free-coupons",
  label: "Free Coupons",
  icon: <Ticket size={18} />
}, {
  id: "ebooks",
  label: "eBooks",
  icon: <Library size={18} />
}, {
  id: "articles-news",
  label: "Articles or News",
  icon: <Newspaper size={18} />
}, {
  id: "discussion-solutions",
  label: "Discussion & Solutions",
  icon: <MessageCircle size={18} />
}, {
  id: "request",
  label: "Request",
  icon: <ClipboardList size={18} />
}, {
  id: "forum-rules",
  label: "Forum Rules",
  icon: <ScrollText size={18} />
}, {
  id: "marketplace",
  label: "Marketplace",
  icon: <ShoppingCart size={18} />
}, {
  id: "expired-not-working",
  label: "Expired/Not Working",
  icon: <XCircle size={18} />
}];
const STATS: Stat[] = [{
  label: "My Posts",
  value: "2,847",
  change: "+5 this week",
  icon: FileText,
  iconColor: "text-sky-500"
}, {
  label: "Reputation",
  value: "4,521",
  change: "Rank Top 5%",
  icon: Star,
  iconColor: "text-amber-500"
}, {
  label: "Replies",
  value: "2,661",
  change: "+12 this week",
  icon: MessageSquare,
  iconColor: "text-emerald-500"
}, {
  label: "Saved Posts",
  value: "34",
  change: "Across 8 folders",
  icon: Bookmark,
  iconColor: "text-purple-500"
}];
const ACTIVITIES: Activity[] = [{
  id: "1",
  type: "thread",
  text: "Posted a new thread in 'Advanced React Patterns'",
  link: "View Thread",
  time: "4m ago",
  icon: MessageSquare,
  color: "bg-sky-500"
}, {
  id: "2",
  type: "reply",
  text: "Replied to 'Best practices for Vite 6' course thread",
  link: "View Reply",
  time: "1h ago",
  icon: MessageCircle,
  color: "bg-emerald-500"
}, {
  id: "3",
  type: "badge",
  text: "Earned the 'Top Contributor' monthly badge",
  link: "View Badges",
  time: "2h ago",
  icon: Award,
  color: "bg-amber-500"
}, {
  id: "4",
  type: "save",
  text: "Saved a post from 'Performance Optimization'",
  link: "View Saved",
  time: "5h ago",
  icon: Bookmark,
  color: "bg-purple-500"
}, {
  id: "5",
  type: "follow",
  text: "Started following AlexCode",
  link: "View Profile",
  time: "1d ago",
  icon: User,
  color: "bg-indigo-500"
}];
const NOTIFICATIONS: Notification[] = [{
  id: "1",
  user: "SarahDev",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  text: "replied to your post in 'Tailwind Tips'",
  time: "2m ago",
  unread: true
}, {
  id: "2",
  user: "MikeDesign",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
  text: "liked your post 'Why Inter is the best UI font'",
  time: "15m ago"
}, {
  id: "3",
  user: "Admin",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
  text: "sent you a direct message regarding your application",
  time: "1h ago",
  unread: true
}, {
  id: "4",
  user: "PremiumBot",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bot",
  text: "unlocked new premium content for your tier",
  time: "3h ago"
}];
const DISCUSSIONS: Discussion[] = [{
  id: "1",
  title: "Developing high-performance React components in 2024",
  category: "React",
  replies: 124,
  views: "1.2k",
  lastActivity: "4m ago"
}, {
  id: "2",
  title: "Micro-interactions that make your UI feel alive",
  category: "Design",
  replies: 89,
  views: "940",
  lastActivity: "1h ago"
}, {
  id: "3",
  title: "The future of CSS: container queries and more",
  category: "Frontend",
  replies: 45,
  views: "530",
  lastActivity: "3h ago"
}, {
  id: "4",
  title: "Is TypeScript worth the overhead for small projects?",
  category: "Development",
  replies: 256,
  views: "3.4k",
  lastActivity: "1d ago"
}, {
  id: "5",
  title: "Why Framer Motion is the king of React animation",
  category: "React",
  replies: 78,
  views: "820",
  lastActivity: "2d ago"
}, {
  id: "6",
  title: "Case study: Scaling a forum to 1M users",
  category: "Infrastructure",
  replies: 34,
  views: "410",
  lastActivity: "3d ago"
}];
const MESSAGES: Message[] = [{
  id: "1",
  sender: "AlexCode",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  preview: "Hey Gamma, did you check the new API docs?",
  time: "10m ago",
  unread: true
}, {
  id: "2",
  sender: "DesignLead",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Design",
  preview: "The mockups are ready for the new dashboard section.",
  time: "2h ago",
  unread: true
}, {
  id: "3",
  sender: "ModTeam",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mod",
  preview: "Your reported post has been reviewed. Thank you!",
  time: "5h ago"
}];

/**
 * Sub-Components
 */

const Sidebar = () => <aside className="hidden min-h-[calc(100vh-4rem)] w-[260px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
    <div className="sticky top-16 space-y-5 px-5 py-6">
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm" aria-labelledby="member-title">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f8] text-[#6b7280] ring-1 ring-[#e5e7eb]">
          <span className="text-2xl font-extrabold text-[#0ea5e9]">G</span>
        </div>
        <h2 id="member-title" className="mb-1 text-base font-bold text-[#111827]">
          <span>GammaDot</span>
        </h2>
        <p className="mb-4 text-sm leading-6 text-[#6b7280]">
          <span>Senior Member since January 2024. Track your posts, replies, messages, and saved resources.</span>
        </p>
        <button className="w-full rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
          <span>View Profile</span>
        </button>
      </section>

      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600">
        <PenSquare size={18} />
        <span>Start a Discussion</span>
      </button>

      <nav className="space-y-1" aria-label="Forum navigation">
        {sidebarNavItems.map(item => <a key={item.id} href="#" className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]", item.id === "all-discussions" && "bg-sky-50 text-[#0ea5e9]")}>
            <span className="text-[#0ea5e9]">{item.icon}</span>
            <span>{item.label}</span>
          </a>)}
      </nav>

      <div className="border-t border-[#e5e7eb] pt-5">
        <h2 className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
          <span>Categories</span>
        </h2>
        <nav aria-label="Forum categories">
          <ul className="space-y-1">
            {categories.map(category => <li key={category.id}>
                <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]">
                  <span className="text-[#6b7280]">{category.icon}</span>
                  <span className="truncate">{category.label}</span>
                </a>
              </li>)}
          </ul>
        </nav>
      </div>
    </div>
  </aside>;
const Header = () => <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/90">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:hidden" aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <a href="#" className="flex items-center gap-2.5 rounded-lg" aria-label="Lovable Friendly home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0ea5e9] text-white shadow-sm shadow-sky-200">
            <Heart size={18} fill="currentColor" />
          </div>
          <span className="hidden text-xl font-extrabold tracking-tight text-[#111827] sm:inline">
            <span>Lovable Friendly</span>
          </span>
        </a>
      </div>

      <div className="hidden flex-1 justify-center md:flex">
        <label className="relative w-full max-w-xl">
          <span className="sr-only">Search discussions</span>
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6b7280]">
            <Search size={18} />
          </span>
          <input type="search" className="block w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6b7280] hover:border-sky-200 focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100" placeholder="Search discussions, members, tags" />
        </label>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <a href="#" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:flex">
          <Shield size={16} />
          <span>Rules</span>
        </a>
        <a href="#" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:flex">
          <FileText size={16} />
          <span>Policy</span>
        </a>
        <a href="#" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] xl:flex">
          <Heart size={16} />
          <span>Donate</span>
        </a>
        <button className="flex h-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9] sm:px-4">
          <LogIn size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Log In</span>
        </button>
        <button className="rounded-lg bg-[#0ea5e9] px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 sm:px-4">
          <span>Sign Up</span>
        </button>
      </div>
    </div>
  </nav>;
const WelcomeBanner = () => <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 p-8 text-white shadow-xl shadow-sky-100">
    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Welcome back, GammaDot!</h1>
        <p className="mt-1 text-sky-100 font-medium">Senior Member since January 2024</p>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
            <TrendingUp size={16} className="text-sky-300" />
            <span className="text-sm font-semibold">2,847 Posts</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
            <Star size={16} className="text-amber-300" />
            <span className="text-sm font-semibold">4,521 Rep</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
            <Award size={16} className="text-indigo-300" />
            <span className="text-sm font-semibold">Top 5%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-white text-sky-600 hover:bg-sky-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2">
          <PenSquare size={18} />
          Start Discussion
        </button>
        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2">
          <User size={18} />
          View Profile
        </button>
      </div>
    </div>

    {/* Abstract background elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
  </div>;
const StatCard = ({
  stat,
  index
}: {
  stat: Stat;
  index: number;
}) => <motion.div initial={{
  opacity: 0,
  y: 20
}} animate={{
  opacity: 1,
  y: 0
}} transition={{
  delay: index * 0.1
}} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between">
      <div className={cn("p-2.5 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform", stat.iconColor)}>
        <stat.icon size={22} />
      </div>
      <div className="text-right">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
        <div className="text-2xl font-black text-slate-900 mt-1">{stat.value}</div>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500">{stat.change}</span>
      <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
    </div>
  </motion.div>;
const RecentActivity = () => <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
      <h3 className="font-bold text-slate-900">Recent Activity</h3>
      <button className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors">View All</button>
    </div>
    <div className="p-5 flex-1 space-y-6">
      {ACTIVITIES.map((activity, i) => <div key={activity.id} className="relative pl-8 group last:pb-0">
          {/* Vertical Line */}
          {i !== ACTIVITIES.length - 1 && <div className="absolute left-[11px] top-[24px] bottom-[-24px] w-px bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>}
          {/* Dot */}
          <div className={cn("absolute left-0 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white z-10 shadow-sm transition-transform group-hover:scale-110", activity.color)}>
            <activity.icon size={12} />
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-slate-600 leading-relaxed">
              {activity.text}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <button className="text-xs font-bold text-sky-500 hover:underline">{activity.link}</button>
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                <Clock size={10} />
                {activity.time}
              </span>
            </div>
          </div>
        </div>)}
    </div>
  </div>;
const NotificationsList = () => <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell size={18} className="text-slate-900" />
        <h3 className="font-bold text-slate-900">Notifications</h3>
      </div>
      <button className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors">Mark All Read</button>
    </div>
    <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
      {NOTIFICATIONS.map(notif => <div key={notif.id} className={cn("p-4 flex gap-4 transition-colors hover:bg-slate-50 cursor-pointer relative", notif.unread && "bg-sky-50/30")}>
          {notif.unread && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full"></div>}
          <img src={notif.avatar} alt={notif.user} className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-600 leading-tight">
              <span className="font-bold text-slate-900">{notif.user}</span> {notif.text}
            </p>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1 block">{notif.time}</span>
          </div>
        </div>)}
    </div>
    <button className="p-4 text-center text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-sky-500 border-t border-slate-50 transition-all">
      View All Notifications
    </button>
  </div>;
const RecentDiscussions = () => <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
      <h3 className="font-bold text-slate-900">My Recent Discussions</h3>
      <button className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors">View All Discussions</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-black">Title</th>
            <th className="px-6 py-4 font-black">Category</th>
            <th className="px-6 py-4 font-black">Engagement</th>
            <th className="px-6 py-4 font-black">Last Activity</th>
            <th className="px-6 py-4 font-black text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {DISCUSSIONS.map(disc => <tr key={disc.id} className="group hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer line-clamp-1">
                  {disc.title}
                </p>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  {disc.category}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    <span className="text-xs font-medium">{disc.replies}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye size={14} />
                    <span className="text-xs font-medium">{disc.views}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={12} />
                  <span className="text-xs font-medium">{disc.lastActivity}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-all">
                    <Pencil size={16} />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
const PremiumStatus = () => <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm p-6 flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
          <Crown size={22} fill="currentColor" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Premium Member</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Valid until Dec 2026</p>
        </div>
      </div>
      <div className="px-3 py-1 rounded-full bg-amber-400 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">
        Active
      </div>
    </div>

    <div className="space-y-4 mb-8 flex-1">
      {["HQ Leaks Access", "Exclusive Methods", "Priority Support", "No Advertisements", "Exclusive VIP Badge"].map(benefit => <div key={benefit} className="flex items-center gap-3 text-slate-600">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-medium">{benefit}</span>
        </div>)}
    </div>

    <button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-[0.98]">
      Renew Now
    </button>
  </div>;
const MessagesPreview = () => <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Mail size={18} className="text-slate-900" />
        <h3 className="font-bold text-slate-900">Messages Preview</h3>
      </div>
      <button className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors">Go to Inbox</button>
    </div>
    <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
      {MESSAGES.map(msg => <div key={msg.id} className={cn("p-4 flex gap-4 transition-colors hover:bg-slate-50 cursor-pointer relative", msg.unread && "bg-sky-50/20")}>
          {msg.unread && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full"></div>}
          <img src={msg.avatar} alt={msg.sender} className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-slate-900 text-sm">{msg.sender}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{msg.time}</span>
            </div>
            <p className="text-xs text-slate-500 truncate leading-tight">
              {msg.preview}
            </p>
          </div>
        </div>)}
    </div>
    <div className="p-4 border-t border-slate-50">
      <button className="w-full bg-slate-50 hover:bg-sky-50 hover:text-sky-600 text-slate-600 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
        <Mail size={16} />
        Compose Message
      </button>
    </div>
  </div>;

/**
 * Main Page Component
 */

export const UserDashboard = () => {
  return <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827] selection:bg-sky-100 selection:text-sky-600">
      <Header />

      <div className="mx-auto flex max-w-[1440px] pt-16">
        <Sidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-8">
          {/* Welcome Section */}
          <section>
            <WelcomeBanner />
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
          </section>

          {/* Activity & Notifications Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
            <div className="lg:col-span-1">
              <NotificationsList />
            </div>
          </section>

          {/* Discussions Table Row */}
          <section>
            <RecentDiscussions />
          </section>

          {/* Premium & Messages Row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PremiumStatus />
            <MessagesPreview />
          </section>

          {/* Small Footer for Dashboard */}
          <footer className="pt-8 pb-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="font-black text-slate-500">Lovable Friendly</span>
              <span>&copy; 2024 Dashboard. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-sky-500 transition-colors uppercase tracking-widest">Privacy Policy</a>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-sky-500 transition-colors uppercase tracking-widest">Terms of Service</a>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-sky-500 transition-colors uppercase tracking-widest">Support Center</a>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#0ea5e9] text-white rounded-full flex items-center justify-center shadow-2xl shadow-sky-200 lg:hidden active:scale-90 transition-transform">
        <PenSquare size={24} />
      </button>
    </div>;
};