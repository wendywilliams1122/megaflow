import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Activity, BookOpen, ChevronRight, ClipboardList, Gem, Gift, Globe, GraduationCap, Info, Library, MessageCircle, MessageSquare, Monitor, Newspaper, Package, PenSquare, Phone, Plus, ScrollText, Shield, ShoppingCart, Tag, Ticket, Trophy, Unlock, User, Users, Wrench, XCircle } from 'lucide-react';


interface Category {
  id: string;
  name: string;
  description: string;
  count: string;
  icon: ReactNode;
  iconTone: string;
}
interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
}
interface StatPill {
  id: string;
  label: string;
  value: string;
  icon: ReactNode;
}
const CATEGORIES: Category[] = [{
  id: 'give-away-freebies',
  name: 'Give-Away & Freebies',
  description: 'Free giveaways, contests and prizes from the community.',
  count: '1.2k',
  icon: <Gift size={18} />,
  iconTone: 'border-teal-100 bg-teal-50 text-teal-700'
}, {
  id: 'tutorials-methods',
  name: 'Tutorials & Methods',
  description: 'Step-by-step guides, playbooks and proven methods.',
  count: '3.4k',
  icon: <BookOpen size={18} />,
  iconTone: 'border-blue-100 bg-blue-50 text-blue-700'
}, {
  id: 'courses',
  name: 'Courses',
  description: 'Premium learning paths and course material shared by members.',
  count: '8.7k',
  icon: <GraduationCap size={18} />,
  iconTone: 'border-emerald-100 bg-emerald-50 text-emerald-700'
}, {
  id: 'resources',
  name: 'Resources',
  description: 'Useful tools, templates, files and production-ready assets.',
  count: '2.1k',
  icon: <Package size={18} />,
  iconTone: 'border-orange-100 bg-orange-50 text-orange-700'
}, {
  id: 'hq-leaks',
  name: 'HQ Leaks',
  description: 'Curated high-quality releases and exclusive community drops.',
  count: '1.8k',
  icon: <Gem size={18} />,
  iconTone: 'border-cyan-100 bg-cyan-50 text-cyan-700'
}, {
  id: 'tools-scripts',
  name: 'Tools & Scripts',
  description: 'Automation scripts, helpers and productivity utilities.',
  count: '956',
  icon: <Wrench size={18} />,
  iconTone: 'border-gray-200 bg-gray-50 text-gray-700'
}, {
  id: 'software-plugins',
  name: 'Software & Plugins',
  description: 'Software, plugins, extensions and setup discussions.',
  count: '1.5k',
  icon: <Monitor size={18} />,
  iconTone: 'border-indigo-100 bg-indigo-50 text-indigo-700'
}, {
  id: 'cracked',
  name: 'Cracked',
  description: 'Unlocked software conversations and premium access notes.',
  count: '2.3k',
  icon: <Unlock size={18} />,
  iconTone: 'border-red-100 bg-red-50 text-red-700'
}, {
  id: 'free-coupons',
  name: 'Free Coupons',
  description: 'Daily coupon finds, discount codes and limited-time offers.',
  count: '4.6k',
  icon: <Ticket size={18} />,
  iconTone: 'border-amber-100 bg-amber-50 text-amber-700'
}, {
  id: 'ebooks',
  name: 'eBooks',
  description: 'Digital books, references and reading lists for members.',
  count: '789',
  icon: <Library size={18} />,
  iconTone: 'border-pink-100 bg-pink-50 text-pink-700'
}, {
  id: 'articles-news',
  name: 'Articles or News',
  description: 'Industry news, useful articles and timely announcements.',
  count: '1.1k',
  icon: <Newspaper size={18} />,
  iconTone: 'border-sky-100 bg-sky-50 text-sky-700'
}, {
  id: 'discussion-solutions',
  name: 'Discussion & Solutions',
  description: 'General discussion, troubleshooting and community answers.',
  count: '2.8k',
  icon: <MessageCircle size={18} />,
  iconTone: 'border-sky-100 bg-sky-50 text-sky-700'
}, {
  id: 'request',
  name: 'Request',
  description: 'Request courses, tools, files and hard-to-find resources.',
  count: '3.2k',
  icon: <ClipboardList size={18} />,
  iconTone: 'border-slate-200 bg-slate-50 text-slate-700'
}, {
  id: 'marketplace',
  name: 'Marketplace',
  description: 'Buy, sell and trade digital products with trusted members.',
  count: '445',
  icon: <ShoppingCart size={18} />,
  iconTone: 'border-emerald-100 bg-emerald-50 text-emerald-700'
}, {
  id: 'rules-instructions',
  name: 'Forum Rules & Instructions',
  description: 'Community guidelines, posting standards and safety notes.',
  count: '12',
  icon: <Shield size={18} />,
  iconTone: 'border-slate-200 bg-slate-50 text-slate-700'
}, {
  id: 'expired-not-working',
  name: 'Expired/Not Working',
  description: 'Report dead links, expired codes and unavailable content.',
  count: '632',
  icon: <XCircle size={18} />,
  iconTone: 'border-rose-100 bg-rose-50 text-rose-700'
}];
const STATS: StatPill[] = [{
  id: 'users',
  label: 'Users',
  value: '48293',
  icon: <Users size={17} />
}, {
  id: 'discussions',
  label: 'Discussions',
  value: '38721',
  icon: <MessageSquare size={17} />
}, {
  id: 'replies',
  label: 'Replies',
  value: '241885',
  icon: <MessageCircle size={17} />
}, {
  id: 'online',
  label: 'Online',
  value: '127 Online',
  icon: <Activity size={17} />
}];
const sidebarNavItems: SidebarItem[] = [{
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
const sidebarCategories: SidebarItem[] = [{
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
  icon: <Newspaper size={18} />
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
export const CategoriesExplorer = () => {
  return <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <Header />

      <div className="mx-auto flex max-w-[1440px] pt-16">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-[260px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
          <div className="sticky top-16 space-y-5 px-5 py-6">
            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm" aria-labelledby="guest-title">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f8] text-[#6b7280] ring-1 ring-[#e5e7eb]">
                <User size={30} />
              </div>
              <h2 id="guest-title" className="mb-1 text-base font-bold text-[#111827]">
                <span>Welcome to MegaFlow</span>
              </h2>
              <p className="mb-4 text-sm leading-6 text-[#6b7280]">
                <span>Join the community to save threads, reply faster, and follow useful resources.</span>
              </p>
              <button className="w-full rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
                <span>Sign Up</span>
              </button>
            </section>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600">
              <PenSquare size={18} />
              <span>Start a Discussion</span>
            </button>

            <nav className="space-y-1" aria-label="Forum navigation">
              {sidebarNavItems.map(item => <a key={item.id} href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]">
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
                  {sidebarCategories.map(category => <li key={category.id}>
                      <Link to="/c/$slug" params={{ slug: category.id }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]">
                        <span className="text-[#6b7280]">{category.icon}</span>
                        <span className="truncate">{category.label}</span>
                      </Link>
                    </li>)}
                </ul>
              </nav>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <section className="mb-6 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm" aria-labelledby="categories-title">
            <div className="border-b border-[#e5e7eb] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                    <span>Categories</span>
                  </p>
                  <h1 id="categories-title" className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                    <span>Explore the forum with less noise.</span>
                  </h1>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#6b7280] sm:text-base">
                    <span>Browse every discussion area in one polished list, from tutorials and resources to marketplace requests and support.</span>
                  </p>
                </div>

                <button className="flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9] lg:hidden">
                  <PenSquare size={17} />
                  <span>Start a Discussion</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 bg-[#f6f7f8] p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
              {STATS.map(stat => <article key={stat.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-[#0ea5e9]">
                    {stat.icon}
                    <strong className="text-base font-extrabold tabular-nums text-[#111827]">
                      <span>{stat.value}</span>
                    </strong>
                  </div>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
                    <span>{stat.label}</span>
                  </p>
                </article>)}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm" aria-labelledby="category-list-title">
            <div className="border-b border-[#e5e7eb] px-4 pt-4 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                    <span>Community sections</span>
                  </p>
                  <h2 id="category-list-title" className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                    <span>All categories</span>
                  </h2>
                </div>
                <p className="text-sm font-semibold text-[#6b7280]">
                  <span>16 sections</span>
                </p>
              </div>
              <div className="mt-5 h-0.5 w-full bg-[#e5e7eb]" aria-hidden="true">
                <div className="h-0.5 w-32 bg-[#0ea5e9]" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-3 bg-[#f6f7f8] p-3 sm:p-4">
              {CATEGORIES.map(category => <Link key={category.id} to="/c/$slug" params={{ slug: category.id }} className="group block rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/70">
                  <span className="flex items-start gap-3 sm:gap-4">
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border ${category.iconTone}`} aria-hidden="true">
                      {category.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-base font-extrabold leading-snug text-[#111827] transition-colors group-hover:text-[#0ea5e9] sm:text-lg">
                        <span>{category.name}</span>
                      </strong>
                      <span className="mt-1 block text-sm leading-6 text-[#6b7280]">
                        <span>{category.description}</span>
                      </span>
                    </span>

                    <span className="ml-auto hidden flex-shrink-0 items-center gap-3 sm:flex">
                      <span className="rounded-full border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-1 text-sm font-extrabold tabular-nums text-[#111827]">
                        <span>{category.count}</span>
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-[#6b7280] group-hover:bg-sky-50 group-hover:text-[#0ea5e9]" aria-hidden="true">
                        <ChevronRight size={19} />
                      </span>
                    </span>
                  </span>
                </Link>)}
            </div>
          </section>
        </main>
      </div>

      <Footer />

      <button className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0ea5e9] text-white shadow-lg shadow-sky-100 transition hover:bg-sky-600 active:scale-95 lg:hidden" aria-label="Start a discussion">
        <Plus size={27} />
      </button>
    </div>;
};