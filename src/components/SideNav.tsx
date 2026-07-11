import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageSquare, Phone, Globe, Info, Trophy, PenSquare, User,
  Gift, BookOpen, GraduationCap, Package, Gem, Wrench, Monitor, Unlock,
  Ticket, Library, Newspaper, MessageCircle, ClipboardList, ScrollText,
  ShoppingCart, XCircle, ShoppingBag, ShieldCheck, LifeBuoy, LayoutDashboard, Settings as SettingsIcon,
} from "lucide-react";
import type { ComponentType } from "react";


const iconMap: Record<string, ComponentType<{ size?: number }>> = {
  Gift, BookOpen, GraduationCap, Package, Gem, Wrench, Monitor, Unlock,
  Ticket, Library, Newspaper, MessageCircle, ClipboardList, ScrollText,
  ShoppingCart, XCircle, MessageSquare,
};

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  to: "/" | "/marketplace" | "/rules" | "/support" | "/contact" | "/advertisement" | "/about" | "/best-members" | "/categories" | "/dashboard" | "/settings";
  authOnly?: boolean;
};

const sidebarNavItems: NavItem[] = [
  { id: "all", label: "All Discussions", icon: MessageSquare, to: "/" },
  { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard, to: "/dashboard", authOnly: true },
  { id: "settings", label: "Account Settings", icon: SettingsIcon, to: "/settings", authOnly: true },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, to: "/marketplace" },
  { id: "categories", label: "Categories", icon: Package, to: "/categories" },
  { id: "rules", label: "Forum Rules", icon: ShieldCheck, to: "/rules" },
  { id: "support", label: "Support", icon: LifeBuoy, to: "/support" },
  { id: "contact", label: "Contact Us", icon: Phone, to: "/contact" },
  { id: "ads", label: "Advertisement", icon: Globe, to: "/advertisement" },
  { id: "about", label: "About Us", icon: Info, to: "/about" },
  { id: "best", label: "Best Members", icon: Trophy, to: "/best-members" },
];


export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, profile } = useAuth();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, slug, name, icon")
        .order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-5">
      {user && profile ? (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#0ea5e9] text-xl font-extrabold text-white">
            {profile.username.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="mb-1 text-base font-bold text-[#111827]">@{profile.username}</h2>
          <p className="mb-4 text-sm leading-6 text-[#6b7280]">
            <span className="font-semibold text-[#0ea5e9]">{profile.reputation}</span> reputation
          </p>
          <Link
            to="/u/$username"
            params={{ username: profile.username }}
            onClick={onNavigate}
            className="block w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
          >
            My Profile
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f7f8] text-[#6b7280] ring-1 ring-[#e5e7eb]">
            <User size={30} />
          </div>
          <h2 className="mb-1 text-base font-bold text-[#111827]">Welcome to MegaFlow</h2>
          <p className="mb-4 text-sm leading-6 text-[#6b7280]">
            Join the community to save threads, reply faster, and follow useful resources.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            onClick={onNavigate}
            className="block w-full rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
          >
            Sign Up
          </Link>
        </section>
      )}

      <Link
        to="/new"
        onClick={onNavigate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600"
      >
        <PenSquare size={18} />
        <span>Start a Discussion</span>
      </Link>

      <nav className="space-y-1" aria-label="Forum navigation">
        {sidebarNavItems.filter((i) => !i.authOnly || !!user).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]"
              activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold bg-sky-50 text-[#0ea5e9]" }}
              activeOptions={{ exact: true }}
            >
              <span className="text-[#0ea5e9]"><Icon size={18} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#e5e7eb] pt-5">
        <h2 className="mb-3 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
          Categories
        </h2>
        <nav aria-label="Forum categories">
          <ul className="space-y-1">
            {categories?.map((c) => {
              const Icon = iconMap[c.icon ?? "MessageSquare"] ?? MessageSquare;
              return (
                <li key={c.id}>
                  <Link
                    to="/c/$slug"
                    params={{ slug: c.slug }}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827]"
                  >
                    <span className="text-[#6b7280]"><Icon size={18} /></span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
