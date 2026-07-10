import React, { useState } from 'react';
import { AlertCircle, Archive, BarChart2, Bell, BookOpen, CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Gem, Gift, Globe, GraduationCap, Headphones, Heart, Inbox, Info, Library, LogIn, LogOut, Menu, MessageCircle, MessageSquare, Monitor, MoreVertical, Package, Phone, Plus, ScrollText, Search, Settings, Shield, ShoppingCart, SlidersHorizontal, Star, Tag, Ticket as TicketIcon, Trophy, Unlock, Users, Wrench, XCircle } from 'lucide-react';
type TicketCategory = 'Account' | 'Bug' | 'Payment' | 'General' | 'Content';
type TicketPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
interface TicketRecord {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgent?: string;
  time: string;
}
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}
interface ForumCategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
interface StatItem {
  id: string;
  label: string;
  value: string | number;
  subValue: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}
interface FilterTab {
  id: string;
  label: string;
}
const NAV_ITEMS: NavItem[] = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: <BarChart2 size={18} />
}, {
  id: 'all',
  label: 'All Tickets',
  icon: <Inbox size={18} />,
  badge: 12
}, {
  id: 'open',
  label: 'Open',
  icon: <AlertCircle size={18} />,
  badge: 23
}, {
  id: 'progress',
  label: 'In Progress',
  icon: <Clock size={18} />,
  badge: 11
}, {
  id: 'resolved',
  label: 'Resolved',
  icon: <CheckCircle size={18} />
}, {
  id: 'closed',
  label: 'Closed',
  icon: <Archive size={18} />
}, {
  id: 'chat',
  label: 'Live Chat',
  icon: <MessageSquare size={18} />
}, {
  id: 'customers',
  label: 'Customers',
  icon: <Users size={18} />
}, {
  id: 'kb',
  label: 'Knowledge Base',
  icon: <BookOpen size={18} />
}, {
  id: 'reports',
  label: 'Reports',
  icon: <Trophy size={18} />
}, {
  id: 'settings',
  label: 'Settings',
  icon: <Settings size={18} />
}];
const CATEGORIES: ForumCategoryItem[] = [{
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
  icon: <TicketIcon size={18} />
}, {
  id: 'ebooks',
  label: 'eBooks',
  icon: <Library size={18} />
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
const TICKETS_DATA: TicketRecord[] = [{
  id: '#1001',
  user: {
    name: 'GammaDot',
    avatar: 'GD'
  },
  subject: 'Cannot access premium',
  category: 'Account',
  priority: 'Urgent',
  status: 'Open',
  time: '12m ago'
}, {
  id: '#1002',
  user: {
    name: 'AlexCode',
    avatar: 'AC'
  },
  subject: 'Post not showing',
  category: 'Bug',
  priority: 'High',
  status: 'In Progress',
  assignedAgent: 'Sarah',
  time: '45m ago'
}, {
  id: '#1003',
  user: {
    name: 'NewUser123',
    avatar: 'NU'
  },
  subject: 'Change username',
  category: 'General',
  priority: 'Normal',
  status: 'Open',
  time: '1h ago'
}, {
  id: '#1004',
  user: {
    name: 'JokerBoss',
    avatar: 'JB'
  },
  subject: 'Payment charged no access',
  category: 'Payment',
  priority: 'Urgent',
  status: 'Open',
  time: '2h ago'
}, {
  id: '#1005',
  user: {
    name: 'MrZodiac',
    avatar: 'MZ'
  },
  subject: 'Image upload broken',
  category: 'Bug',
  priority: 'High',
  status: 'In Progress',
  assignedAgent: 'Mike',
  time: '3h ago'
}, {
  id: '#1006',
  user: {
    name: 'AnimeNova8K',
    avatar: 'AN'
  },
  subject: 'Profile picture error',
  category: 'Bug',
  priority: 'Normal',
  status: 'Open',
  time: '4h ago'
}, {
  id: '#1007',
  user: {
    name: 'Wajahatwh',
    avatar: 'WW'
  },
  subject: 'Course link expired',
  category: 'Content',
  priority: 'Normal',
  status: 'Resolved',
  assignedAgent: 'Sarah',
  time: '5h ago'
}, {
  id: '#1008',
  user: {
    name: 'thalapathy',
    avatar: 'TH'
  },
  subject: 'How to get premium',
  category: 'General',
  priority: 'Low',
  status: 'Resolved',
  time: '6h ago'
}, {
  id: '#1009',
  user: {
    name: 'AlexLob',
    avatar: 'AL'
  },
  subject: 'Ban appeal',
  category: 'Account',
  priority: 'High',
  status: 'Open',
  time: '8h ago'
}, {
  id: '#1010',
  user: {
    name: 'motomato',
    avatar: 'MM'
  },
  subject: 'Download speed slow',
  category: 'General',
  priority: 'Normal',
  status: 'In Progress',
  assignedAgent: 'Mike',
  time: '10h ago'
}, {
  id: '#1011',
  user: {
    name: 'Vishal8383',
    avatar: 'VS'
  },
  subject: 'Two-factor auth issue',
  category: 'Account',
  priority: 'High',
  status: 'Open',
  time: '1d ago'
}, {
  id: '#1012',
  user: {
    name: 'JayVyas',
    avatar: 'JV'
  },
  subject: 'Cannot post in Courses',
  category: 'Content',
  priority: 'Normal',
  status: 'Resolved',
  time: '1d ago'
}];
const STATS_DATA: StatItem[] = [{
  id: 'open-tickets',
  label: 'Open Tickets',
  value: 23,
  subValue: '5 urgent',
  icon: <Inbox size={24} />,
  color: 'text-sky-500',
  bg: 'bg-sky-50'
}, {
  id: 'in-progress',
  label: 'In Progress',
  value: 11,
  subValue: 'avg 2.3h',
  icon: <Clock size={24} />,
  color: 'text-orange-500',
  bg: 'bg-orange-50'
}, {
  id: 'resolved-today',
  label: 'Resolved Today',
  value: 47,
  subValue: '+18%',
  icon: <CheckCircle size={24} />,
  color: 'text-emerald-500',
  bg: 'bg-emerald-50'
}, {
  id: 'satisfaction',
  label: 'Satisfaction',
  value: '94%',
  subValue: '312 ratings',
  icon: <Star size={24} />,
  color: 'text-amber-500',
  bg: 'bg-amber-50'
}];
const FILTER_TABS: FilterTab[] = [{
  id: 'all',
  label: 'All'
}, {
  id: 'open',
  label: 'Open'
}, {
  id: 'in-progress',
  label: 'In Progress'
}, {
  id: 'resolved',
  label: 'Resolved'
}, {
  id: 'closed',
  label: 'Closed'
}];
const PAGE_BUTTONS: FilterTab[] = [{
  id: 'page-1',
  label: '1'
}, {
  id: 'page-2',
  label: '2'
}, {
  id: 'page-3',
  label: '3'
}];
const CATEGORY_BADGE_STYLES: Record<TicketCategory, string> = {
  Account: 'bg-sky-50 text-sky-700 border-sky-100',
  Bug: 'bg-red-50 text-red-700 border-red-100',
  Payment: 'bg-orange-50 text-orange-700 border-orange-100',
  General: 'bg-gray-50 text-gray-700 border-gray-100',
  Content: 'bg-emerald-50 text-emerald-700 border-emerald-100'
};
const PRIORITY_BADGE_STYLES: Record<TicketPriority, string> = {
  Urgent: 'bg-red-50 text-red-700 border-red-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Normal: 'bg-blue-50 text-blue-700 border-blue-100',
  Low: 'bg-gray-50 text-gray-700 border-gray-100'
};
const STATUS_BADGE_STYLES: Record<TicketStatus, string> = {
  Open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
  Resolved: 'bg-blue-50 text-blue-700 border-blue-100',
  Closed: 'bg-gray-50 text-gray-700 border-gray-100'
};
export const SupportPanel = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  return <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur supports-[backdrop-filter]:bg-[#ffffff]/90" aria-label="Primary navigation">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:hidden" aria-label="Open navigation" type="button">
              <Menu size={20} />
            </button>
            <a href="#" className="flex items-center gap-2.5 rounded-lg" aria-label="MegaFlow home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0ea5e9] text-white shadow-sm shadow-sky-200" aria-hidden="true">
                <Heart size={18} fill="currentColor" />
              </div>
              <span className="hidden text-xl font-extrabold tracking-tight text-[#111827] sm:inline">
                <span>MegaFlow</span>
              </span>
            </a>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <label className="relative w-full max-w-xl">
              <span className="sr-only">Search support tickets</span>
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
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]" aria-label="Notifications" type="button">
              <Bell size={20} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />
            </button>
            <button className="flex h-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9] sm:px-4" type="button">
              <LogIn size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Log In</span>
            </button>
            <button className="rounded-lg bg-[#0ea5e9] px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 sm:px-4" type="button">
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-[1440px] pt-16">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-[260px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
          <div className="sticky top-16 space-y-5 px-5 py-6">
            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm" aria-labelledby="support-agent-title">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f8] text-[#6b7280] ring-1 ring-[#e5e7eb]">
                <Headphones size={30} />
              </div>
              <h1 id="support-agent-title" className="mb-1 text-base font-bold text-[#111827]">
                <span>Support Panel</span>
              </h1>
              <p className="mb-4 text-sm leading-6 text-[#6b7280]">
                <span>Manage tickets, prioritize urgent requests, and keep the community moving.</span>
              </p>
              <button className="w-full rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600" type="button">
                <span>New Ticket</span>
              </button>
            </section>

            <nav className="space-y-1" aria-label="Support navigation">
              <h2 className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
                <span>Support</span>
              </h2>
              {NAV_ITEMS.map(item => <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${activeTab === item.id ? 'bg-sky-50 font-semibold text-[#0ea5e9]' : 'font-semibold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]'}`} type="button">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={activeTab === item.id ? 'text-[#0ea5e9]' : 'text-[#0ea5e9]'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge ? <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${activeTab === item.id ? 'bg-[#0ea5e9] text-white' : 'bg-[#f6f7f8] text-[#6b7280] ring-1 ring-[#e5e7eb]'}`}>
                      <span>{item.badge}</span>
                    </span> : null}
                </button>)}
            </nav>

            <div className="border-t border-[#e5e7eb] pt-5">
              <h2 className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
                <span>Categories</span>
              </h2>
              <nav aria-label="Forum categories">
                <ul className="space-y-1">
                  {CATEGORIES.map(category => <li key={category.id}>
                      <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]">
                        <span className="text-[#6b7280]">{category.icon}</span>
                        <span className="truncate">{category.label}</span>
                      </a>
                    </li>)}
                </ul>
              </nav>
            </div>

            <div className="border-t border-[#e5e7eb] pt-5">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]" type="button">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="Support statistics">
            {STATS_DATA.map(stat => <article key={stat.id} className="flex items-center gap-5 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className={`${stat.bg} ${stat.color} rounded-2xl p-3.5 ring-1 ring-inset ring-black/[0.03]`} aria-hidden="true">
                  {stat.icon}
                </div>
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">
                    <span>{stat.label}</span>
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#111827]">{stat.value}</span>
                    <span className="text-xs font-bold text-[#6b7280]">· {stat.subValue}</span>
                  </div>
                </div>
              </article>)}
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm" aria-labelledby="tickets-title">
            <div className="border-b border-[#e5e7eb] px-4 pt-4 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                    <span>Support</span>
                  </p>
                  <h2 id="tickets-title" className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                    <span>Tickets</span>
                  </h2>
                </div>

                <div className="flex flex-col items-stretch gap-3 lg:flex-1 lg:flex-row lg:items-center lg:justify-end">
                  <button className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 active:scale-95" type="button">
                    <Plus size={18} />
                    <span>New Ticket</span>
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-2xl">
                    <label className="relative flex-1">
                      <span className="sr-only">Search tickets, users or subjects</span>
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6b7280]">
                        <Search size={18} />
                      </span>
                      <input type="text" placeholder="Search tickets, users or subjects..." className="w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6b7280] hover:border-sky-200 focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
                    </label>
                    <button className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]" type="button">
                      <SlidersHorizontal size={18} />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-1 overflow-x-auto" role="tablist" aria-label="Ticket status filters">
                {FILTER_TABS.map(tab => <button key={tab.id} className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${tab.id === 'all' ? 'border-[#0ea5e9] text-[#0ea5e9]' : 'border-transparent text-[#6b7280] hover:border-[#e5e7eb] hover:text-[#111827]'}`} type="button" role="tab" aria-selected={tab.id === 'all'}>
                    <span>{tab.label}</span>
                  </button>)}
              </div>
            </div>

            <div className="overflow-x-auto bg-white">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Ticket ID</span></th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>User</span></th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Subject</span></th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Category</span></th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Priority</span></th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Status</span></th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Assigned</span></th>
                    <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Time</span></th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#6b7280]" scope="col"><span>Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {TICKETS_DATA.map(ticket => <tr key={ticket.id} className="group transition-colors hover:bg-[#f9fafb]">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-xs font-bold text-[#6b7280]">{ticket.id}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-[#6b7280] ring-1 ring-[#e5e7eb]" aria-hidden="true">
                            <span>{ticket.user.avatar}</span>
                          </div>
                          <span className="text-sm font-bold text-[#111827]">{ticket.user.name}</span>
                        </div>
                      </td>
                      <td className="min-w-[240px] px-6 py-4">
                        <button className="block text-left text-sm font-bold text-[#111827] transition-colors hover:text-[#0ea5e9]" type="button">
                          <span>{ticket.subject}</span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${CATEGORY_BADGE_STYLES[ticket.category]}`}>
                          <span>{ticket.category}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${PRIORITY_BADGE_STYLES[ticket.priority]}`}>
                          <span>{ticket.priority}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_BADGE_STYLES[ticket.status]}`}>
                          <span>{ticket.status}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#4b5563]">
                        {ticket.assignedAgent ? <span>{ticket.assignedAgent}</span> : <span className="italic text-[#9ca3af]">Unassigned</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[#6b7280]">
                          <Clock size={14} />
                          <span className="text-xs font-bold">{ticket.time}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="rounded-lg p-1.5 text-[#6b7280] transition-all hover:bg-sky-50 hover:text-[#0ea5e9]" title="View" type="button">
                            <span className="sr-only">View ticket</span>
                            <Info size={16} />
                          </button>
                          <button className="rounded-lg p-1.5 text-[#6b7280] transition-all hover:bg-sky-50 hover:text-[#0ea5e9]" title="Chat" type="button">
                            <span className="sr-only">Chat about ticket</span>
                            <MessageCircle size={16} />
                          </button>
                          <button className="rounded-lg p-1.5 text-[#6b7280] transition-all hover:bg-emerald-50 hover:text-emerald-600" title="Resolve" type="button">
                            <span className="sr-only">Resolve ticket</span>
                            <CheckCircle size={16} />
                          </button>
                          <button className="rounded-lg p-1.5 text-[#6b7280] transition-all hover:bg-[#f3f4f6] hover:text-[#111827]" aria-label="More ticket actions" type="button">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e5e7eb] bg-white px-6 py-4 sm:flex-row">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
                <p className="text-xs font-bold text-[#6b7280]">
                  <span>Showing </span>
                  <span className="text-[#111827]">1</span>
                  <span> to </span>
                  <span className="text-[#111827]">12</span>
                  <span> of </span>
                  <span className="text-[#111827]">12</span>
                  <span> tickets</span>
                </p>
                <label className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#6b7280]">Rows per page:</span>
                  <select className="rounded-lg border border-[#e5e7eb] bg-[#f6f7f8] px-2 py-1 text-xs font-bold outline-none focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-100" aria-label="Rows per page">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-[#9ca3af]" aria-label="Previous page" disabled type="button">
                  <ChevronLeft size={18} />
                </button>
                {PAGE_BUTTONS.map(page => <button key={page.id} className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${page.label === '1' ? 'bg-[#0ea5e9] text-white shadow-sm' : 'text-[#6b7280] hover:bg-[#f6f7f8]'}`} type="button">
                    <span>{page.label}</span>
                  </button>)}
                <button className="rounded-lg p-2 text-[#6b7280] transition-colors hover:bg-[#f6f7f8]" aria-label="Next page" type="button">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>;
};