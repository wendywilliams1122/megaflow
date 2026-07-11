import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SideRail } from "@/components/SideRail";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  MessageSquare,
  MessageCircle,
  Shield,
  Ban,
  CheckCircle2,
  Pin,
  Lock,
  Unlock,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Loader2,
  Package,
  Plus,
  Pencil,
  X,
  ShoppingCart,
  Settings as SettingsIcon,
  Save,
  Megaphone,
  Eye,
  EyeOff,
} from "lucide-react";

type Tab = "overview" | "users" | "threads" | "products" | "orders" | "ads" | "settings";

type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  reputation: number;
  is_banned: boolean;
  created_at: string;
  roles: string[];
};

type ThreadRow = {
  id: string;
  slug: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  vote_score: number;
  reply_count: number;
  created_at: string;
  author: { username: string } | null;
  category: { slug: string; name: string } | null;
};

type Stats = { members: number; threads: number; posts: number; banned: number; products: number; orders: number };

type OrderRow = {
  id: string;
  product_title: string;
  product_slug: string | null;
  unit_price_cents: number;
  currency: string;
  quantity: number;
  buyer_name: string;
  buyer_contact: string;
  method: "buy" | "cart" | "whatsapp" | "email";
  status: "new" | "contacted" | "completed" | "cancelled";
  note: string | null;
  created_at: string;
};

type SettingsRow = {
  brand_name: string;
  whatsapp_number: string | null;
  contact_email: string | null;
  points_thread: number;
  points_comment: number;
  points_upvote: number;
  points_referral: number;
  max_threads_per_day: number;
  max_comments_per_day: number;
  warnings_before_ban: number;
  downloads_min_points: number;
};


type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  status: "draft" | "active" | "archived";
  featured: boolean;
};

const emptyProduct: Omit<ProductRow, "id"> = {
  title: "",
  slug: "",
  description: "",
  price_cents: 0,
  currency: "USD",
  image_url: "",
  category: "",
  stock: 0,
  status: "active",
  featured: false,
};

type AdRow = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  placement: "home" | "thread" | "both";
  is_active: boolean;
  sort_order: number;
};

const emptyAd: Omit<AdRow, "id"> = {
  title: "",
  image_url: "",
  link_url: "",
  placement: "home",
  is_active: true,
  sort_order: 0,
};

export const AdminPanel = () => {
  const { user, isAdmin, isModerator, loading } = useAuth();
  const isStaff = isAdmin || isModerator;
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [editingAd, setEditingAd] = useState<Partial<AdRow> | null>(null);
  const [settings, setSettings] = useState<SettingsRow>({ brand_name: "MegaFlow", whatsapp_number: "", contact_email: "", points_thread: 10, points_comment: 2, points_upvote: 1, points_referral: 25, max_threads_per_day: 5, max_comments_per_day: 30, warnings_before_ban: 3, downloads_min_points: 0 });
  const [editingProduct, setEditingProduct] = useState<Partial<ProductRow> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  };

  const loadStats = async () => {
    const [m, t, p, b, pr, o] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("threads").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
      supabase.from("products").select("id", { count: "exact", head: true }),
      (supabase as any).from("orders").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      members: m.count ?? 0,
      threads: t.count ?? 0,
      posts: p.count ?? 0,
      banned: b.count ?? 0,
      products: pr.count ?? 0,
      orders: o.count ?? 0,
    });
  };

  const loadUsers = async () => {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, display_name, reputation, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const ids = (profs ?? []).map((p) => p.id);
    const { data: rolesRows } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const roleMap = new Map<string, string[]>();
    (rolesRows ?? []).forEach((r) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    setUsers(
      (profs ?? []).map((p) => ({
        ...(p as Omit<UserRow, "roles">),
        roles: roleMap.get(p.id) ?? [],
      })),
    );
  };

  const loadThreads = async () => {
    const { data } = await supabase
      .from("threads")
      .select(
        "id, slug, title, is_pinned, is_locked, vote_score, reply_count, created_at, author:profiles(username), category:categories(slug, name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    setThreads((data as unknown as ThreadRow[]) ?? []);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, slug, description, price_cents, currency, image_url, category, stock, status, featured")
      .order("created_at", { ascending: false });
    setProducts((data as ProductRow[]) ?? []);
  };

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const saveProduct = async () => {
    if (!editingProduct) return;
    const title = (editingProduct.title ?? "").trim();
    if (!title) return flash("Title required");
    const slug = (editingProduct.slug || slugify(title)).trim();
    const payload = {
      title,
      slug,
      description: editingProduct.description ?? null,
      price_cents: Number(editingProduct.price_cents ?? 0),
      currency: editingProduct.currency ?? "USD",
      image_url: editingProduct.image_url || null,
      category: editingProduct.category || null,
      stock: Number(editingProduct.stock ?? 0),
      status: editingProduct.status ?? "active",
      featured: !!editingProduct.featured,
    };
    setBusy("save-product");
    const { error } = editingProduct.id
      ? await supabase.from("products").update(payload).eq("id", editingProduct.id)
      : await supabase.from("products").insert({ ...payload, created_by: user?.id ?? null });
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(editingProduct.id ? "Product updated" : "Product created");
    setEditingProduct(null);
    loadProducts();
    loadStats();
  };

  const deleteProduct = async (p: ProductRow) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    setBusy(p.id);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Product deleted");
    loadProducts();
    loadStats();
  };

  const loadOrders = async () => {
    const { data } = await (supabase as any)
      .from("orders")
      .select("id, product_title, product_slug, unit_price_cents, currency, quantity, buyer_name, buyer_contact, method, status, note, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setOrders((data as OrderRow[]) ?? []);
  };

  const loadSettings = async () => {
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (data) setSettings({
      brand_name: data.brand_name ?? "MegaFlow",
      whatsapp_number: data.whatsapp_number ?? "",
      contact_email: data.contact_email ?? "",
      points_thread: data.points_thread ?? 10,
      points_comment: data.points_comment ?? 2,
      points_upvote: data.points_upvote ?? 1,
      points_referral: data.points_referral ?? 25,
      max_threads_per_day: data.max_threads_per_day ?? 5,
      max_comments_per_day: data.max_comments_per_day ?? 30,
      warnings_before_ban: data.warnings_before_ban ?? 3,
      downloads_min_points: data.downloads_min_points ?? 0,
    });
  };

  const saveSettings = async () => {
    setBusy("save-settings");
    const { error } = await (supabase as any)
      .from("site_settings")
      .update({
        brand_name: settings.brand_name.trim() || "MegaFlow",
        whatsapp_number: settings.whatsapp_number?.trim() || null,
        contact_email: settings.contact_email?.trim() || null,
        points_thread: settings.points_thread,
        points_comment: settings.points_comment,
        points_upvote: settings.points_upvote,
        points_referral: settings.points_referral,
        max_threads_per_day: settings.max_threads_per_day,
        max_comments_per_day: settings.max_comments_per_day,
        warnings_before_ban: settings.warnings_before_ban,
        downloads_min_points: settings.downloads_min_points,
      })
      .eq("id", true);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Settings saved");
  };


  const updateOrderStatus = async (o: OrderRow, status: OrderRow["status"]) => {
    setBusy(o.id);
    const { error } = await (supabase as any).from("orders").update({ status }).eq("id", o.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Order updated");
    loadOrders();
  };

  const deleteOrder = async (o: OrderRow) => {
    if (!confirm("Delete this order?")) return;
    setBusy(o.id);
    const { error } = await (supabase as any).from("orders").delete().eq("id", o.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Order deleted");
    loadOrders();
    loadStats();
  };

  const loadAds = async () => {
    const { data } = await (supabase as any)
      .from("advertisements")
      .select("id, title, image_url, link_url, placement, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setAds((data as AdRow[]) ?? []);
  };

  const saveAd = async () => {
    if (!editingAd) return;
    const image_url = (editingAd.image_url ?? "").trim();
    if (!image_url) return flash("Image URL required");
    const payload = {
      title: (editingAd.title ?? "").trim(),
      image_url,
      link_url: (editingAd.link_url ?? "").trim() || null,
      placement: (editingAd.placement ?? "home") as string,
      is_active: editingAd.is_active !== false,
      sort_order: Number(editingAd.sort_order ?? 0),
    };
    setBusy("save-ad");
    const { error } = editingAd.id
      ? await (supabase as any).from("advertisements").update(payload).eq("id", editingAd.id)
      : await (supabase as any).from("advertisements").insert({ ...payload, created_by: user?.id ?? null });
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(editingAd.id ? "Ad updated" : "Ad created");
    setEditingAd(null);
    loadAds();
  };

  const deleteAd = async (a: AdRow) => {
    if (!confirm(`Delete ad "${a.title || a.image_url}"?`)) return;
    setBusy(a.id);
    const { error } = await (supabase as any).from("advertisements").delete().eq("id", a.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Ad deleted");
    loadAds();
  };

  const toggleAdActive = async (a: AdRow) => {
    setBusy(a.id);
    const { error } = await (supabase as any).from("advertisements").update({ is_active: !a.is_active }).eq("id", a.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    loadAds();
  };

  useEffect(() => {
    if (!isStaff) return;
    loadStats();
    if (tab === "users") loadUsers();
    if (tab === "threads") loadThreads();
    if (tab === "products") loadProducts();
    if (tab === "orders") loadOrders();
    if (tab === "ads") loadAds();
    if (tab === "settings") loadSettings();
  }, [isStaff, tab]);

  const toggleBan = async (u: UserRow) => {
    setBusy(u.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !u.is_banned })
      .eq("id", u.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(u.is_banned ? "User unbanned" : "User banned");
    loadUsers();
    loadStats();
  };

  const toggleRole = async (u: UserRow, role: "admin" | "moderator") => {
    setBusy(u.id + role);
    const has = u.roles.includes(role);
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", u.id)
        .eq("role", role);
      setBusy(null);
      if (error) return flash("Failed: " + error.message);
      flash(`Removed ${role}`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role });
      setBusy(null);
      if (error) return flash("Failed: " + error.message);
      flash(`Granted ${role}`);
    }
    loadUsers();
  };

  const togglePin = async (t: ThreadRow) => {
    setBusy(t.id);
    const { error } = await supabase
      .from("threads")
      .update({ is_pinned: !t.is_pinned })
      .eq("id", t.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(t.is_pinned ? "Unpinned" : "Pinned");
    loadThreads();
  };

  const toggleLock = async (t: ThreadRow) => {
    setBusy(t.id);
    const { error } = await supabase
      .from("threads")
      .update({ is_locked: !t.is_locked })
      .eq("id", t.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(t.is_locked ? "Unlocked" : "Locked");
    loadThreads();
  };

  const deleteThread = async (t: ThreadRow) => {
    if (!confirm(`Delete thread "${t.title}"? This cannot be undone.`)) return;
    setBusy(t.id);
    const { error } = await supabase.from("threads").delete().eq("id", t.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Thread deleted");
    loadThreads();
    loadStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        
        <div className="pt-8 text-center text-[#6b7280]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        
        <div className="mx-auto max-w-md pt-8 text-center">
          <Shield size={40} className="mx-auto mb-3 text-[#6b7280]" />
          <h1 className="mb-2 text-xl font-extrabold text-[#111827]">Sign in required</h1>
          <p className="mb-4 text-sm text-[#6b7280]">You need to sign in to access the admin panel.</p>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="inline-block rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        
        <div className="mx-auto max-w-md pt-8 text-center">
          <ShieldOff size={40} className="mx-auto mb-3 text-red-500" />
          <h1 className="mb-2 text-xl font-extrabold text-[#111827]">Access denied</h1>
          <p className="text-sm text-[#6b7280]">
            Admin or moderator role required. Ask a super admin to grant you access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      
      <div className="mx-auto flex max-w-[1440px] pt-4">
        <SideRail />
        <main className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {msg && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700">
              {msg}
            </div>
          )}

          <header className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0ea5e9] text-white">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {isAdmin ? "Admin Panel" : "Staff Panel"}
              </h1>
              <p className="text-sm text-[#6b7280]">Manage members, threads, products, and moderation.</p>
            </div>
          </header>

          <nav className="flex gap-2 border-b border-[#e5e7eb]">
            {(["overview", "users", "threads", "products", "orders", "ads", "settings"] as Tab[]).map((t) => {
              // moderators can't manage users
              if (t === "users" && !isAdmin) return null;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-4 py-2 text-sm font-bold capitalize transition-colors ${
                    tab === t
                      ? "border-[#0ea5e9] text-[#0ea5e9]"
                      : "border-transparent text-[#6b7280] hover:text-[#111827]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </nav>

          {tab === "overview" && (
            <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {[
                { icon: <Users size={20} />, label: "Members", value: stats?.members ?? 0, bg: "bg-sky-500" },
                { icon: <MessageSquare size={20} />, label: "Threads", value: stats?.threads ?? 0, bg: "bg-emerald-500" },
                { icon: <MessageCircle size={20} />, label: "Replies", value: stats?.posts ?? 0, bg: "bg-orange-500" },
                { icon: <Package size={20} />, label: "Products", value: stats?.products ?? 0, bg: "bg-violet-500" },
                { icon: <ShoppingCart size={20} />, label: "Orders", value: stats?.orders ?? 0, bg: "bg-amber-500" },
                { icon: <Ban size={20} />, label: "Banned", value: stats?.banned ?? 0, bg: "bg-red-500" },
              ].map((s) => (
                <article key={s.label} className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-white ${s.bg}`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-extrabold tabular-nums">{s.value.toLocaleString()}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280]">{s.label}</p>
                </article>
              ))}
            </section>
          )}

          {tab === "users" && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Roles</th>
                      <th className="px-4 py-3">Rep</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <Link
                            to="/u/$username"
                            params={{ username: u.username }}
                            className="font-bold text-[#111827] hover:text-[#0ea5e9]"
                          >
                            {u.username}
                          </Link>
                          {u.display_name && (
                            <p className="text-xs text-[#6b7280]">{u.display_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-xs text-[#6b7280]">user</span>}
                            {u.roles.map((r) => (
                              <span
                                key={r}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  r === "admin"
                                    ? "bg-red-100 text-red-700"
                                    : r === "moderator"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{u.reputation}</td>
                        <td className="px-4 py-3">
                          {u.is_banned ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-700">
                              Banned
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              disabled={busy === u.id + "admin"}
                              onClick={() => toggleRole(u, "admin")}
                              className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold text-[#111827] hover:border-red-300 hover:text-red-600"
                              title="Toggle admin"
                            >
                              {u.roles.includes("admin") ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                            </button>
                            <button
                              disabled={busy === u.id + "moderator"}
                              onClick={() => toggleRole(u, "moderator")}
                              className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold text-[#111827] hover:border-amber-300 hover:text-amber-600"
                              title="Toggle moderator"
                            >
                              Mod
                            </button>
                            <button
                              disabled={busy === u.id || u.id === user.id}
                              onClick={() => toggleBan(u)}
                              className={`rounded-md border px-2 py-1 text-xs font-bold ${
                                u.is_banned
                                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  : "border-red-200 text-red-700 hover:bg-red-50"
                              } disabled:opacity-40`}
                            >
                              {busy === u.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : u.is_banned ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <Ban size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                          No members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "threads" && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="px-4 py-3">Thread</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Votes</th>
                      <th className="px-4 py-3 text-right">Replies</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {threads.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="max-w-[280px] px-4 py-3">
                          <Link
                            to="/t/$slug"
                            params={{ slug: t.slug }}
                            className="line-clamp-1 font-bold text-[#111827] hover:text-[#0ea5e9]"
                          >
                            {t.is_pinned && <Pin size={12} className="mr-1 inline text-[#0ea5e9]" />}
                            {t.is_locked && <Lock size={12} className="mr-1 inline text-red-500" />}
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#6b7280]">
                          {t.author ? (
                            <Link
                              to="/u/$username"
                              params={{ username: t.author.username }}
                              className="hover:text-[#0ea5e9]"
                            >
                              {t.author.username}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#6b7280]">
                          {t.category ? (
                            <Link
                              to="/c/$slug"
                              params={{ slug: t.category.slug }}
                              className="hover:text-[#0ea5e9]"
                            >
                              {t.category.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{t.vote_score}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{t.reply_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              disabled={busy === t.id}
                              onClick={() => togglePin(t)}
                              className={`rounded-md border px-2 py-1 text-xs font-bold ${
                                t.is_pinned
                                  ? "border-[#0ea5e9] bg-sky-50 text-[#0ea5e9]"
                                  : "border-[#e5e7eb] text-[#6b7280] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                              }`}
                              title={t.is_pinned ? "Unpin" : "Pin"}
                            >
                              <Pin size={13} />
                            </button>
                            <button
                              disabled={busy === t.id}
                              onClick={() => toggleLock(t)}
                              className={`rounded-md border px-2 py-1 text-xs font-bold ${
                                t.is_locked
                                  ? "border-red-300 bg-red-50 text-red-600"
                                  : "border-[#e5e7eb] text-[#6b7280] hover:border-red-300 hover:text-red-600"
                              }`}
                              title={t.is_locked ? "Unlock" : "Lock"}
                            >
                              {t.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
                            </button>
                            <button
                              disabled={busy === t.id}
                              onClick={() => deleteThread(t)}
                              className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              {busy === t.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {threads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                          No threads yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "products" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Marketplace products</h2>
                <button
                  onClick={() => setEditingProduct({ ...emptyProduct })}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600"
                >
                  <Plus size={16} /> New product
                </button>
              </div>

              {editingProduct && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold">
                      {editingProduct.id ? "Edit product" : "New product"}
                    </h3>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="rounded-md p-1 text-[#6b7280] hover:bg-slate-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs font-bold text-[#6b7280]">
                      Title
                      <input
                        value={editingProduct.title ?? ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Slug (auto if empty)
                      <input
                        value={editingProduct.slug ?? ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">
                      Description
                      <textarea
                        rows={3}
                        value={editingProduct.description ?? ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Price (cents)
                      <input
                        type="number"
                        value={editingProduct.price_cents ?? 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price_cents: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Currency
                      <input
                        value={editingProduct.currency ?? "USD"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value.toUpperCase() })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Stock
                      <input
                        type="number"
                        value={editingProduct.stock ?? 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Category
                      <input
                        value={editingProduct.category ?? ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">
                      Image URL
                      <input
                        value={editingProduct.image_url ?? ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                        placeholder="https://…"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Status
                      <select
                        value={editingProduct.status ?? "active"}
                        onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as ProductRow["status"] })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280]">
                      <input
                        type="checkbox"
                        checked={!!editingProduct.featured}
                        onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                        className="h-4 w-4 rounded border-[#e5e7eb]"
                      />
                      Featured
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-bold text-[#6b7280] hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={busy === "save-product"}
                      onClick={saveProduct}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      {busy === "save-product" && <Loader2 size={14} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Stock</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img src={p.image_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[#6b7280]">
                                  <Package size={16} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-[#111827]">
                                  {p.featured && <span className="mr-1 text-amber-500">★</span>}
                                  {p.title}
                                </p>
                                <p className="text-xs text-[#6b7280]">/{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#6b7280]">{p.category ?? "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(p.price_cents / 100)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                p.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : p.status === "draft"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold text-[#6b7280] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                disabled={busy === p.id}
                                onClick={() => deleteProduct(p)}
                                className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                              >
                                {busy === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                            No products yet. Click "New product" to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
          </section>
          )}

          {tab === "orders" && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Buyer</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          {o.product_slug ? (
                            <Link to="/marketplace/$slug" params={{ slug: o.product_slug }} className="font-bold text-[#111827] hover:text-[#0ea5e9]">
                              {o.product_title}
                            </Link>
                          ) : (
                            <span className="font-bold text-[#111827]">{o.product_title}</span>
                          )}
                          {o.note && <p className="mt-0.5 line-clamp-1 text-xs text-[#6b7280]">“{o.note}”</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#111827]">{o.buyer_name}</p>
                          <p className="text-xs text-[#6b7280]">{o.buyer_contact}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            o.method === "whatsapp" ? "bg-emerald-100 text-emerald-700"
                            : o.method === "email" ? "bg-slate-200 text-slate-700"
                            : o.method === "cart" ? "bg-violet-100 text-violet-700"
                            : "bg-sky-100 text-sky-700"
                          }`}>{o.method}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{o.quantity}</td>
                        <td className="px-4 py-3 text-right font-extrabold tabular-nums">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency }).format((o.unit_price_cents * o.quantity) / 100)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={busy === o.id}
                            value={o.status}
                            onChange={(e) => updateOrderStatus(o, e.target.value as OrderRow["status"])}
                            className={`rounded-md border px-2 py-1 text-xs font-bold ${
                              o.status === "new" ? "border-amber-300 bg-amber-50 text-amber-700"
                              : o.status === "contacted" ? "border-sky-300 bg-sky-50 text-sky-700"
                              : o.status === "completed" ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-red-300 bg-red-50 text-red-700"
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b7280]">
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              disabled={busy === o.id}
                              onClick={() => deleteOrder(o)}
                              className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              {busy === o.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                          No orders yet. Buyer requests from the Marketplace will appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "ads" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold">Advertisements</h2>
                    <p className="text-xs text-[#6b7280]">Show image posters between posts on the home feed and thread pages.</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAd({ ...emptyAd })}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600"
                >
                  <Plus size={16} /> New ad
                </button>
              </div>

              {editingAd && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold">{editingAd.id ? "Edit ad" : "New ad"}</h3>
                    <button onClick={() => setEditingAd(null)} className="rounded-md p-1 text-[#6b7280] hover:bg-slate-100">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">
                      Title (optional)
                      <input
                        value={editingAd.title ?? ""}
                        onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                        placeholder="Promo of the week"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">
                      Image URL <span className="text-red-500">*</span>
                      <input
                        value={editingAd.image_url ?? ""}
                        onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })}
                        placeholder="https://…/banner.jpg"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">
                      Link URL (optional)
                      <input
                        value={editingAd.link_url ?? ""}
                        onChange={(e) => setEditingAd({ ...editingAd, link_url: e.target.value })}
                        placeholder="https://your-landing-page.com"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Placement
                      <select
                        value={editingAd.placement ?? "home"}
                        onChange={(e) => setEditingAd({ ...editingAd, placement: e.target.value as AdRow["placement"] })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="home">Home feed</option>
                        <option value="thread">Thread pages</option>
                        <option value="both">Both</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Sort order
                      <input
                        type="number"
                        value={editingAd.sort_order ?? 0}
                        onChange={(e) => setEditingAd({ ...editingAd, sort_order: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280] md:col-span-2">
                      <input
                        type="checkbox"
                        checked={editingAd.is_active !== false}
                        onChange={(e) => setEditingAd({ ...editingAd, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-[#e5e7eb]"
                      />
                      Active (visible to visitors)
                    </label>
                    {editingAd.image_url && (
                      <div className="md:col-span-2">
                        <p className="mb-1 text-xs font-bold text-[#6b7280]">Preview</p>
                        <img src={editingAd.image_url} alt="" className="max-h-48 rounded-lg border border-[#e5e7eb] object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setEditingAd(null)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-bold text-[#6b7280] hover:bg-slate-50">Cancel</button>
                    <button
                      disabled={busy === "save-ad"}
                      onClick={saveAd}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50"
                    >
                      {busy === "save-ad" && <Loader2 size={14} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ads.map((a) => (
                  <article key={a.id} className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-extrabold text-[#111827]">{a.title || "(no title)"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {a.is_active ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b7280]">Placement: <span className="font-bold text-[#374151]">{a.placement}</span> · Order: {a.sort_order}</p>
                      {a.link_url && <p className="truncate text-xs text-sky-600">{a.link_url}</p>}
                      <div className="flex flex-wrap justify-end gap-1 pt-1">
                        <button
                          disabled={busy === a.id}
                          onClick={() => toggleAdActive(a)}
                          className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold text-[#6b7280] hover:border-emerald-300 hover:text-emerald-700"
                          title={a.is_active ? "Turn off" : "Turn on"}
                        >
                          {a.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => setEditingAd(a)}
                          className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold text-[#6b7280] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          disabled={busy === a.id}
                          onClick={() => deleteAd(a)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          {busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {ads.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">
                    No ads yet. Click "New ad" to add a banner poster.
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "settings" && (
            <section className="max-w-2xl space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white">
                  <SettingsIcon size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">Site & contact settings</h2>
                  <p className="text-xs text-[#6b7280]">
                    Configure the WhatsApp number and email buyers can use to reach you.
                  </p>
                </div>
              </div>

              <label className="block text-xs font-bold text-[#6b7280]">
                Brand name
                <input
                  value={settings.brand_name}
                  onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="block text-xs font-bold text-[#6b7280]">
                WhatsApp number (with country code, e.g. +92300…)
                <input
                  value={settings.whatsapp_number ?? ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  placeholder="+923001234567"
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="mt-1 block text-[11px] font-normal text-[#6b7280]">
                  Used for the “Buy on WhatsApp” button. Digits only will be kept when opening WhatsApp.
                </span>
              </label>

              <label className="block text-xs font-bold text-[#6b7280]">
                Contact email
                <input
                  type="email"
                  value={settings.contact_email ?? ""}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  placeholder="sales@yourbrand.com"
                  className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <span className="mt-1 block text-[11px] font-normal text-[#6b7280]">
                  Used for the “Buy on Email” button (opens the buyer's email app).
                </span>
              </label>

              <div className="mt-2 border-t border-[#e5e7eb] pt-4">
                <h3 className="mb-3 text-sm font-extrabold text-[#111827]">Points & rewards</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    ["points_thread","Per thread"],
                    ["points_comment","Per comment"],
                    ["points_upvote","Per upvote"],
                    ["points_referral","Per referral"],
                  ] as const).map(([k,label]) => (
                    <label key={k} className="block text-xs font-bold text-[#6b7280]">
                      {label}
                      <input type="number" min={0} value={settings[k]}
                        onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) || 0 })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827]" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-2 border-t border-[#e5e7eb] pt-4">
                <h3 className="mb-3 text-sm font-extrabold text-[#111827]">Anti-spam & access</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    ["max_threads_per_day","Threads / day"],
                    ["max_comments_per_day","Comments / day"],
                    ["warnings_before_ban","Warnings → ban"],
                    ["downloads_min_points","Min points for downloads"],
                  ] as const).map(([k,label]) => (
                    <label key={k} className="block text-xs font-bold text-[#6b7280]">
                      {label}
                      <input type="number" min={0} value={settings[k]}
                        onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) || 0 })}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827]" />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-[#6b7280]">
                  Admins & moderators bypass all download conditions. Regular users still need the 10-day + own-thread rule; set min points to 0 to disable the extra points gate.
                </p>
              </div>

              <div className="flex justify-end">

                <button
                  disabled={busy === "save-settings"}
                  onClick={saveSettings}
                  className="flex items-center gap-2 rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50"
                >
                  {busy === "save-settings" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save settings
                </button>
              </div>
            </section>
          )}

          {tab === "settings" && (
            <>
              <BlockedDomainsCard flash={flash} />
              <MultiAccountIPCard />
            </>
          )}

        </main>
      </div>
      
    </div>
  );
};
