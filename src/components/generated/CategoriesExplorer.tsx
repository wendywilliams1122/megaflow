import type { ComponentType } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SideNav } from '@/components/SideNav';
import {
  Activity, BookOpen, ChevronRight, ClipboardList, Gem, Gift, GraduationCap, Library,
  MessageCircle, MessageSquare, Monitor, Newspaper, Package, PenSquare, Plus, ScrollText,
  ShoppingCart, Ticket, Unlock, Users, Wrench, XCircle,
} from 'lucide-react';

const iconMap: Record<string, ComponentType<{ size?: number }>> = {
  Gift, BookOpen, GraduationCap, Package, Gem, Wrench, Monitor, Unlock,
  Ticket, Library, Newspaper, MessageCircle, ClipboardList, ScrollText,
  ShoppingCart, XCircle, MessageSquare,
};

const TONES = [
  'border-teal-100 bg-teal-50 text-teal-700',
  'border-blue-100 bg-blue-50 text-blue-700',
  'border-emerald-100 bg-emerald-50 text-emerald-700',
  'border-orange-100 bg-orange-50 text-orange-700',
  'border-cyan-100 bg-cyan-50 text-cyan-700',
  'border-indigo-100 bg-indigo-50 text-indigo-700',
  'border-amber-100 bg-amber-50 text-amber-700',
  'border-pink-100 bg-pink-50 text-pink-700',
  'border-sky-100 bg-sky-50 text-sky-700',
  'border-rose-100 bg-rose-50 text-rose-700',
];

const fmt = (n: number) => n.toLocaleString();

export const CategoriesExplorer = () => {
  const { data: categories } = useQuery({
    queryKey: ['categories-explorer'],
    queryFn: async () => {
      const [{ data: cats }, { data: rows }] = await Promise.all([
        supabase.from('categories').select('id, slug, name, description, icon').order('sort_order'),
        supabase.from('threads').select('category_id').eq('is_deleted', false).limit(10000),
      ]);
      const tally = new Map<string, number>();
      for (const r of rows ?? []) {
        if (!r.category_id) continue;
        tally.set(r.category_id, (tally.get(r.category_id) ?? 0) + 1);
      }
      return (cats ?? []).map((c) => ({ ...c, count: tally.get(c.id) ?? 0 }));
    },
    staleTime: 60_000,
  });


  const { data: stats } = useQuery({
    queryKey: ['categories-explorer-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const c = (q: any) => q.limit(1);
      const [users, threads, posts, active] = await Promise.all([
        c(supabase.from('profiles').select('id', { count: 'exact' })),
        c(supabase.from('threads').select('id', { count: 'exact' }).eq('is_deleted', false)),
        c(supabase.from('posts').select('id', { count: 'exact' }).eq('is_deleted', false)),
        c(supabase.from('profiles').select('id', { count: 'exact' }).eq('last_active_on', today)),
      ]);

      return {
        users: users.count ?? 0,
        threads: threads.count ?? 0,
        posts: posts.count ?? 0,
        active: active.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  const statPills = [
    { id: 'users', label: 'Members', value: fmt(stats?.users ?? 0), icon: <Users size={17} /> },
    { id: 'discussions', label: 'Discussions', value: fmt(stats?.threads ?? 0), icon: <MessageSquare size={17} /> },
    { id: 'replies', label: 'Replies', value: fmt(stats?.posts ?? 0), icon: <MessageCircle size={17} /> },
    { id: 'active', label: 'Active today', value: fmt(stats?.active ?? 0), icon: <Activity size={17} /> },
  ];

  return <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <div className="mx-auto flex max-w-[1440px]">

        <aside className="hidden min-h-[calc(100vh-4rem)] w-[260px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain px-5 py-6">
            <SideNav />
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

                <Link to="/new" className="flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9] lg:hidden">
                  <PenSquare size={17} />
                  <span>Start a Discussion</span>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 bg-[#f6f7f8] p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
              {statPills.map(stat => <article key={stat.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
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
                  <span>{categories ? `${categories.length} sections` : 'Loading…'}</span>
                </p>
              </div>
              <div className="mt-5 h-0.5 w-full bg-[#e5e7eb]" aria-hidden="true">
                <div className="h-0.5 w-32 bg-[#0ea5e9]" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-3 bg-[#f6f7f8] p-3 sm:p-4">
              {(categories ?? []).map((category, idx) => {
                const Icon = iconMap[category.icon ?? 'MessageSquare'] ?? MessageSquare;
                return <Link key={category.id} to="/c/$slug" params={{ slug: category.slug }} className="group block rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/70">
                  <span className="flex items-start gap-3 sm:gap-4">
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border ${TONES[idx % TONES.length]}`} aria-hidden="true">
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-base font-extrabold leading-snug text-[#111827] transition-colors group-hover:text-[#0ea5e9] sm:text-lg">
                        <span>{category.name}</span>
                      </strong>
                      <span className="mt-1 block text-sm leading-6 text-[#6b7280]">
                        <span>{category.description ?? 'Community discussions.'}</span>
                      </span>
                    </span>

                    <span className="ml-auto hidden flex-shrink-0 items-center gap-3 sm:flex">
                      <span className="rounded-full border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-1 text-sm font-extrabold tabular-nums text-[#111827]">
                        <span>{category.count} {category.count === 1 ? 'thread' : 'threads'}</span>
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-[#6b7280] group-hover:bg-sky-50 group-hover:text-[#0ea5e9]" aria-hidden="true">
                        <ChevronRight size={19} />
                      </span>
                    </span>
                  </span>
                </Link>;
              })}
              {categories && categories.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-6 text-center text-sm text-[#6b7280]">No categories yet.</p>
              )}
            </div>
          </section>
        </main>
      </div>

      <Link to="/new" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0ea5e9] text-white shadow-lg shadow-sky-100 transition hover:bg-sky-600 active:scale-95 lg:hidden" aria-label="Start a discussion">
        <Plus size={27} />
      </Link>
    </div>;
};
