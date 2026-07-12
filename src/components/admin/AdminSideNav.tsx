import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, MessageSquare, MessageCircle, Trash2, Flag, FolderTree, Tags,
  Award, Package, ShoppingCart, Megaphone, Image as ImageIcon, Settings,
  ShieldCheck, ClipboardList, ArrowLeft, Zap, Gavel, Ticket, CalendarClock,
} from "lucide-react";
import type { ComponentType } from "react";

export type AdminTab =
  | "overview" | "users" | "threads" | "trash" | "reports" | "categories"
  | "tags" | "badges" | "products" | "orders" | "broadcast" | "ads"
  | "settings" | "security" | "audit" | "modactions" | "automod";

type Item = {
  id: AdminTab;
  label: string;
  icon: ComponentType<{ size?: number }>;
  adminOnly?: boolean;
  badge?: number;
};

type Group = { title: string; items: Item[] };

export function AdminSideNav({
  tab, setTab, isAdmin, pendingReports,
}: {
  tab: AdminTab;
  setTab: (t: AdminTab) => void;
  isAdmin: boolean;
  pendingReports: number;
}) {
  const groups: Group[] = [
    {
      title: "Overview",
      items: [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Community",
      items: [
        { id: "users", label: "Members", icon: Users, adminOnly: true },
        { id: "threads", label: "Threads", icon: MessageSquare },
        { id: "trash", label: "Trash", icon: Trash2 },
        { id: "reports", label: "Reports", icon: Flag, badge: pendingReports },
        { id: "modactions", label: "Mod Actions", icon: Gavel },
        { id: "automod", label: "AutoMod", icon: Zap, adminOnly: true },
        { id: "categories", label: "Categories", icon: FolderTree, adminOnly: true },
        { id: "tags", label: "Tags", icon: Tags, adminOnly: true },
        { id: "badges", label: "Badges", icon: Award, adminOnly: true },
      ],
    },
    {
      title: "Marketplace",
      items: [
        { id: "products", label: "Products", icon: Package },
        { id: "orders", label: "Orders", icon: ShoppingCart },
      ],
    },
    {
      title: "System",
      items: [
        { id: "broadcast", label: "Broadcast", icon: Megaphone, adminOnly: true },
        { id: "ads", label: "Advertisements", icon: ImageIcon, adminOnly: true },
        { id: "settings", label: "Site Settings", icon: Settings, adminOnly: true },
        { id: "security", label: "Security & 2FA", icon: ShieldCheck, adminOnly: true },
        { id: "audit", label: "Audit Log", icon: ClipboardList, adminOnly: true },
      ],
    },
  ];

  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-[248px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-indigo-600 p-3 text-white shadow-sm">
          <ShieldCheck size={22} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Control Center</p>
            <p className="truncate text-sm font-extrabold">{isAdmin ? "Admin Console" : "Moderator Console"}</p>
          </div>
        </div>

        {groups.map((g) => {
          const visible = g.items.filter((i) => !i.adminOnly || isAdmin);
          if (visible.length === 0) return null;
          return (
            <div key={g.title} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9ca3af]">
                {g.title}
              </p>
              <ul className="space-y-0.5">
                {visible.map((i) => {
                  const Icon = i.icon;
                  const active = tab === i.id;
                  return (
                    <li key={i.id}>
                      <button
                        onClick={() => setTab(i.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-sky-50 text-[#0ea5e9]"
                            : "text-[#4b5563] hover:bg-[#f6f7f8] hover:text-[#111827]"
                        }`}
                      >
                        <Icon size={17} />
                        <span className="flex-1 truncate text-left">{i.label}</span>
                        {i.badge ? (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            {i.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="mb-4">
          <p className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9ca3af]">
            Direct Messages
          </p>
          <Link
            to="/mod-chats"
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#4b5563] hover:bg-[#f6f7f8] hover:text-[#111827]"
          >
            <MessageCircle size={17} />
            <span className="flex-1 truncate text-left">Chats moderation</span>
          </Link>
        </div>

        <div className="mt-6 border-t border-[#e5e7eb] pt-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#0ea5e9]"
          >
            <ArrowLeft size={14} /> Back to forum
          </Link>
        </div>
      </div>
    </aside>
  );
}
