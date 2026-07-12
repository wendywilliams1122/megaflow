import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SideRail } from "@/components/SideRail";
import { BlockedDomainsCard } from "@/components/admin/BlockedDomainsCard";
import { MultiAccountIPCard } from "@/components/admin/MultiAccountIPCard";
import { RichEditor } from "@/components/RichEditor";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, MessageSquare, MessageCircle, Shield, Ban, CheckCircle2,
  Pin, Lock, Unlock, Trash2, ShieldOff, ShieldCheck, Loader2, Package,
  Plus, Pencil, X, ShoppingCart, Settings as SettingsIcon, Save,
  Megaphone, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Download,
  Flag, FolderTree, DollarSign, Plus as PlusIcon, Minus, AlertTriangle,
  ClipboardList, Bell,
} from "lucide-react";

type Tab = "overview" | "users" | "threads" | "products" | "orders" | "reports" | "categories" | "badges" | "tags" | "broadcast" | "ads" | "settings" | "audit";
type BadgeRow = { id: string; name: string; description: string; icon: string; tier: string; criteria: any };
type TagRow = { id: string; slug: string; name: string; thread_count: number };
type UserDetail = {
  profile: any; roles: string[]; ips: any[]; badges: any[];
  threads: any[]; posts: any[]; orders: any[]; warnings: number; ban_reason: string | null;
};

type UserRow = {
  id: string; username: string; display_name: string | null;
  reputation: number; points: number; is_banned: boolean; created_at: string;
  roles: string[]; warnings: number;
};
type ThreadRow = {
  id: string; slug: string; title: string; is_pinned: boolean; is_locked: boolean;
  vote_score: number; reply_count: number; created_at: string;
  author: { username: string } | null; category: { slug: string; name: string } | null;
};
type Stats = {
  members: number; threads: number; posts: number; banned: number;
  products: number; orders: number; revenue_cents: number; pending_reports: number;
};
type OrderRow = {
  id: string; product_title: string; product_slug: string | null; unit_price_cents: number;
  currency: string; quantity: number; buyer_name: string; buyer_contact: string;
  method: "buy" | "cart" | "whatsapp" | "email"; status: "new" | "contacted" | "completed" | "cancelled";
  note: string | null; created_at: string;
};
type SettingsRow = {
  brand_name: string; whatsapp_number: string | null; contact_email: string | null;
  points_thread: number; points_comment: number; points_upvote: number; points_referral: number;
  max_threads_per_day: number; max_comments_per_day: number; warnings_before_ban: number;
  downloads_min_points: number; announcement: string | null; announcement_active: boolean;
};
type ProductRow = {
  id: string; title: string; slug: string; description: string | null;
  price_cents: number; currency: string; image_url: string | null; category: string | null;
  stock: number; status: "draft" | "active" | "archived"; featured: boolean;
};
type AdRow = {
  id: string; title: string; image_url: string; link_url: string | null;
  placement: "home" | "thread" | "both"; is_active: boolean; sort_order: number;
};
type ReportRow = {
  id: string; reporter_id: string | null; target_type: string; target_id: string;
  reason: string; status: string; resolution_note: string | null; created_at: string;
  reporter: { username: string } | null;
};
type CategoryRow = {
  id: string; slug: string; name: string; description: string | null;
  icon: string | null; color: string | null; sort_order: number;
};
type AuditRow = {
  id: string; actor_email: string | null; action: string;
  target_type: string | null; target_id: string | null; created_at: string; details: any;
};

const emptyProduct: Omit<ProductRow, "id"> = {
  title: "", slug: "", description: "", price_cents: 0, currency: "USD",
  image_url: "", category: "", stock: 0, status: "active", featured: false,
};
const emptyAd: Omit<AdRow, "id"> = {
  title: "", image_url: "", link_url: "", placement: "home", is_active: true, sort_order: 0,
};
const emptyCategory: Omit<CategoryRow, "id"> = {
  slug: "", name: "", description: "", icon: "", color: "#0ea5e9", sort_order: 0,
};

const PAGE_SIZE = 25;

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
function downloadCSV(name: string, rows: Record<string, any>[]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const AdminPanel = () => {
  const { user, isAdmin, isModerator, loading } = useAuth();
  const isStaff = isAdmin || isModerator;
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);

  // Lists + pagination + search
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [usersQ, setUsersQ] = useState("");
  const [usersSel, setUsersSel] = useState<Set<string>>(new Set());

  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadsTotal, setThreadsTotal] = useState(0);
  const [threadsPage, setThreadsPage] = useState(0);
  const [threadsQ, setThreadsQ] = useState("");
  const [threadsSel, setThreadsSel] = useState<Set<string>>(new Set());

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const [productsQ, setProductsQ] = useState("");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersQ, setOrdersQ] = useState("");
  const [ordersStatus, setOrdersStatus] = useState<string>("all");

  const [ads, setAds] = useState<AdRow[]>([]);
  const [editingAd, setEditingAd] = useState<Partial<AdRow> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductRow> | null>(null);

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsStatus, setReportsStatus] = useState("pending");

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryRow> | null>(null);

  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);

  const [settings, setSettings] = useState<SettingsRow>({
    brand_name: "MegaFlow", whatsapp_number: "", contact_email: "",
    points_thread: 10, points_comment: 2, points_upvote: 1, points_referral: 25,
    max_threads_per_day: 5, max_comments_per_day: 30, warnings_before_ban: 3,
    downloads_min_points: 0, announcement: "", announcement_active: false,
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };

  const logAction = async (action: string, target_type?: string, target_id?: string, details: any = {}) => {
    try {
      await (supabase as any).from("audit_log").insert({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action, target_type: target_type ?? null, target_id: target_id ?? null, details,
      });
    } catch { /* non-fatal */ }
  };

  const loadStats = async () => {
    const [m, t, p, b, pr, o, r, rev] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("threads").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
      supabase.from("products").select("id", { count: "exact", head: true }),
      (supabase as any).from("orders").select("id", { count: "exact", head: true }),
      (supabase as any).from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      (supabase as any).from("orders").select("unit_price_cents, quantity").eq("status", "completed"),
    ]);
    const revenue_cents = ((rev as any).data ?? []).reduce(
      (sum: number, row: any) => sum + (row.unit_price_cents ?? 0) * (row.quantity ?? 1), 0,
    );
    setStats({
      members: m.count ?? 0, threads: t.count ?? 0, posts: p.count ?? 0, banned: b.count ?? 0,
      products: pr.count ?? 0, orders: o.count ?? 0, revenue_cents,
      pending_reports: (r as any).count ?? 0,
    });
  };

  const loadUsers = async () => {
    const from = usersPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase.from("profiles")
      .select("id, username, display_name, reputation, points, is_banned, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (usersQ.trim()) q = q.or(`username.ilike.%${usersQ.trim()}%,display_name.ilike.%${usersQ.trim()}%`);
    const { data: profs, count } = await q;
    setUsersTotal(count ?? 0);
    const ids = (profs ?? []).map((p) => p.id);
    const [rolesRes, modRes] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      (supabase as any).from("profile_moderation").select("user_id, warnings").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const roleMap = new Map<string, string[]>();
    (rolesRes.data ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? []; arr.push(r.role); roleMap.set(r.user_id, arr);
    });
    const warnMap = new Map<string, number>();
    ((modRes as any).data ?? []).forEach((r: any) => warnMap.set(r.user_id, r.warnings ?? 0));
    setUsers((profs ?? []).map((p: any) => ({
      ...p, roles: roleMap.get(p.id) ?? [], warnings: warnMap.get(p.id) ?? 0,
    })));
    setUsersSel(new Set());
  };

  const loadThreads = async () => {
    const from = threadsPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase.from("threads").select(
      "id, slug, title, is_pinned, is_locked, vote_score, reply_count, created_at, author:profiles(username), category:categories!threads_category_id_fkey(slug, name)",
      { count: "exact" },
    ).order("created_at", { ascending: false }).range(from, to);
    if (threadsQ.trim()) q = q.ilike("title", `%${threadsQ.trim()}%`);
    const { data, count } = await q;
    setThreads((data as unknown as ThreadRow[]) ?? []);
    setThreadsTotal(count ?? 0);
    setThreadsSel(new Set());
  };

  const loadProducts = async () => {
    const from = productsPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase.from("products")
      .select("id, title, slug, description, price_cents, currency, image_url, category, stock, status, featured", { count: "exact" })
      .order("created_at", { ascending: false }).range(from, to);
    if (productsQ.trim()) q = q.ilike("title", `%${productsQ.trim()}%`);
    const { data, count } = await q;
    setProducts((data as ProductRow[]) ?? []);
    setProductsTotal(count ?? 0);
  };

  const loadOrders = async () => {
    const from = ordersPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = (supabase as any).from("orders")
      .select("id, product_title, product_slug, unit_price_cents, currency, quantity, buyer_name, buyer_contact, method, status, note, created_at", { count: "exact" })
      .order("created_at", { ascending: false }).range(from, to);
    if (ordersStatus !== "all") q = q.eq("status", ordersStatus);
    if (ordersQ.trim()) q = q.or(`product_title.ilike.%${ordersQ.trim()}%,buyer_name.ilike.%${ordersQ.trim()}%,buyer_contact.ilike.%${ordersQ.trim()}%`);
    const { data, count } = await q;
    setOrders((data as OrderRow[]) ?? []);
    setOrdersTotal(count ?? 0);
  };

  const loadReports = async () => {
    let q = (supabase as any).from("reports")
      .select("id, reporter_id, target_type, target_id, reason, status, resolution_note, created_at, reporter:profiles!reports_reporter_id_fkey(username)")
      .order("created_at", { ascending: false }).limit(200);
    if (reportsStatus !== "all") q = q.eq("status", reportsStatus);
    const { data } = await q;
    setReports((data as ReportRow[]) ?? []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
    setCategories((data as CategoryRow[]) ?? []);
  };

  const loadAudit = async () => {
    const { data } = await (supabase as any).from("audit_log")
      .select("id, actor_email, action, target_type, target_id, created_at, details")
      .order("created_at", { ascending: false }).limit(200);
    setAuditRows((data as AuditRow[]) ?? []);
  };

  const loadSettings = async () => {
    const { data } = await (supabase as any).from("site_settings").select("*").eq("id", true).maybeSingle();
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
      announcement: data.announcement ?? "",
      announcement_active: !!data.announcement_active,
    });
  };

  const saveSettings = async () => {
    setBusy("save-settings");
    const { error } = await (supabase as any).from("site_settings").update({
      brand_name: settings.brand_name.trim() || "MegaFlow",
      whatsapp_number: settings.whatsapp_number?.trim() || null,
      contact_email: settings.contact_email?.trim() || null,
      points_thread: settings.points_thread, points_comment: settings.points_comment,
      points_upvote: settings.points_upvote, points_referral: settings.points_referral,
      max_threads_per_day: settings.max_threads_per_day,
      max_comments_per_day: settings.max_comments_per_day,
      warnings_before_ban: settings.warnings_before_ban,
      downloads_min_points: settings.downloads_min_points,
      announcement: settings.announcement?.trim() || null,
      announcement_active: settings.announcement_active,
    }).eq("id", true);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Settings saved");
    logAction("settings.update");
  };

  // ---------- User actions ----------
  const toggleBan = async (u: UserRow) => {
    setBusy(u.id);
    const { error } = await supabase.from("profiles").update({ is_banned: !u.is_banned }).eq("id", u.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(u.is_banned ? "User unbanned" : "User banned");
    logAction(u.is_banned ? "user.unban" : "user.ban", "user", u.id, { username: u.username });
    loadUsers(); loadStats();
  };
  const bulkBan = async (ban: boolean) => {
    if (usersSel.size === 0) return;
    if (!confirm(`${ban ? "Ban" : "Unban"} ${usersSel.size} users?`)) return;
    setBusy("bulk-ban");
    const ids = [...usersSel];
    const { error } = await supabase.from("profiles").update({ is_banned: ban }).in("id", ids);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(`${ban ? "Banned" : "Unbanned"} ${ids.length} users`);
    logAction(ban ? "user.bulk_ban" : "user.bulk_unban", "user", null as any, { ids });
    loadUsers(); loadStats();
  };
  const toggleRole = async (u: UserRow, role: "admin" | "moderator") => {
    setBusy(u.id + role);
    const has = u.roles.includes(role);
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: u.id, role });
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(`${has ? "Removed" : "Granted"} ${role}`);
    logAction(has ? "role.revoke" : "role.grant", "user", u.id, { username: u.username, role });
    loadUsers();
  };
  const adjustPoints = async (u: UserRow, delta: number) => {
    const raw = prompt(`Adjust points for ${u.username} (current: ${u.points}). Enter amount to ${delta > 0 ? "ADD" : "SUBTRACT"}:`, "10");
    if (raw === null) return;
    const n = Math.abs(parseInt(raw, 10));
    if (!Number.isFinite(n) || n <= 0) return;
    const next = Math.max(0, u.points + delta * n);
    setBusy(u.id + "pts");
    const { error } = await supabase.from("profiles").update({ points: next }).eq("id", u.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(`${delta > 0 ? "+" : "-"}${n} points → ${u.username}`);
    logAction("user.points_adjust", "user", u.id, { username: u.username, delta: delta * n, from: u.points, to: next });
    loadUsers();
  };
  const issueWarning = async (u: UserRow) => {
    const reason = prompt(`Warn ${u.username}. Enter reason:`, "");
    if (reason === null) return;
    setBusy(u.id + "warn");
    const { error } = await (supabase as any).from("profile_moderation").upsert(
      { user_id: u.id, warnings: (u.warnings ?? 0) + 1, ban_reason: reason || null },
      { onConflict: "user_id" },
    );
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(`Warned ${u.username} (${u.warnings + 1})`);
    logAction("user.warn", "user", u.id, { username: u.username, reason });
    loadUsers();
  };
  const clearWarnings = async (u: UserRow) => {
    if (!confirm(`Clear all warnings for ${u.username}?`)) return;
    setBusy(u.id + "clear");
    const { error } = await (supabase as any).from("profile_moderation").upsert(
      { user_id: u.id, warnings: 0 }, { onConflict: "user_id" },
    );
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Warnings cleared");
    logAction("user.warn_clear", "user", u.id, { username: u.username });
    loadUsers();
  };

  // ---------- Thread actions ----------
  const togglePin = async (t: ThreadRow) => {
    setBusy(t.id);
    const { error } = await supabase.from("threads").update({ is_pinned: !t.is_pinned }).eq("id", t.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    logAction(t.is_pinned ? "thread.unpin" : "thread.pin", "thread", t.id, { title: t.title });
    loadThreads();
  };
  const toggleLock = async (t: ThreadRow) => {
    setBusy(t.id);
    const { error } = await supabase.from("threads").update({ is_locked: !t.is_locked }).eq("id", t.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    logAction(t.is_locked ? "thread.unlock" : "thread.lock", "thread", t.id, { title: t.title });
    loadThreads();
  };
  const deleteThread = async (t: ThreadRow) => {
    if (!confirm(`Delete thread "${t.title}"?`)) return;
    setBusy(t.id);
    const { error } = await supabase.from("threads").delete().eq("id", t.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Thread deleted");
    logAction("thread.delete", "thread", t.id, { title: t.title });
    loadThreads(); loadStats();
  };
  const bulkDeleteThreads = async () => {
    if (threadsSel.size === 0) return;
    if (!confirm(`Delete ${threadsSel.size} threads? This cannot be undone.`)) return;
    setBusy("bulk-thread");
    const ids = [...threadsSel];
    const { error } = await supabase.from("threads").delete().in("id", ids);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(`Deleted ${ids.length} threads`);
    logAction("thread.bulk_delete", "thread", null as any, { ids });
    loadThreads(); loadStats();
  };

  // ---------- Product ----------
  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const saveProduct = async () => {
    if (!editingProduct) return;
    const title = (editingProduct.title ?? "").trim();
    if (!title) return flash("Title required");
    const slug = (editingProduct.slug || slugify(title)).trim();
    const payload = {
      title, slug, description: editingProduct.description ?? null,
      price_cents: Number(editingProduct.price_cents ?? 0),
      currency: editingProduct.currency ?? "USD",
      image_url: editingProduct.image_url || null,
      category: editingProduct.category || null,
      stock: Number(editingProduct.stock ?? 0),
      status: editingProduct.status ?? "active", featured: !!editingProduct.featured,
    };
    setBusy("save-product");
    const { error } = editingProduct.id
      ? await supabase.from("products").update(payload).eq("id", editingProduct.id)
      : await supabase.from("products").insert({ ...payload, created_by: user?.id ?? null });
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(editingProduct.id ? "Product updated" : "Product created");
    logAction(editingProduct.id ? "product.update" : "product.create", "product", editingProduct.id ?? slug, { title });
    setEditingProduct(null); loadProducts(); loadStats();
  };
  const deleteProduct = async (p: ProductRow) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    setBusy(p.id);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Product deleted");
    logAction("product.delete", "product", p.id, { title: p.title });
    loadProducts(); loadStats();
  };

  // ---------- Orders ----------
  const updateOrderStatus = async (o: OrderRow, status: OrderRow["status"]) => {
    setBusy(o.id);
    const { error } = await (supabase as any).from("orders").update({ status }).eq("id", o.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    logAction("order.status", "order", o.id, { status });
    loadOrders(); loadStats();
  };
  const deleteOrder = async (o: OrderRow) => {
    if (!confirm("Delete this order?")) return;
    setBusy(o.id);
    const { error } = await (supabase as any).from("orders").delete().eq("id", o.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    logAction("order.delete", "order", o.id);
    loadOrders(); loadStats();
  };

  // ---------- Reports ----------
  const resolveReport = async (r: ReportRow, status: "resolved" | "dismissed") => {
    const note = prompt(`Add a note (${status}):`, r.resolution_note ?? "");
    if (note === null) return;
    setBusy(r.id);
    const { error } = await (supabase as any).from("reports").update({
      status, resolution_note: note || null, resolved_by: user?.id ?? null, resolved_at: new Date().toISOString(),
    }).eq("id", r.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(`Report ${status}`);
    logAction("report." + status, "report", r.id, { target_type: r.target_type });
    loadReports(); loadStats();
  };

  // ---------- Categories ----------
  const saveCategory = async () => {
    if (!editingCategory) return;
    const name = (editingCategory.name ?? "").trim();
    if (!name) return flash("Name required");
    const slug = (editingCategory.slug || slugify(name)).trim();
    const payload = {
      slug, name, description: editingCategory.description || null,
      icon: editingCategory.icon || null, color: editingCategory.color || null,
      sort_order: Number(editingCategory.sort_order ?? 0),
    };
    setBusy("save-cat");
    const { error } = editingCategory.id
      ? await supabase.from("categories").update(payload).eq("id", editingCategory.id)
      : await supabase.from("categories").insert(payload);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash(editingCategory.id ? "Category updated" : "Category created");
    logAction(editingCategory.id ? "category.update" : "category.create", "category", editingCategory.id ?? slug, { name });
    setEditingCategory(null); loadCategories();
  };
  const deleteCategory = async (c: CategoryRow) => {
    if (!confirm(`Delete category "${c.name}"? Threads inside will lose their category.`)) return;
    setBusy(c.id);
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    flash("Category deleted");
    logAction("category.delete", "category", c.id, { name: c.name });
    loadCategories();
  };

  // ---------- Ads ----------
  const loadAds = async () => {
    const { data } = await (supabase as any).from("advertisements")
      .select("id, title, image_url, link_url, placement, is_active, sort_order")
      .order("sort_order").order("created_at", { ascending: false });
    setAds((data as AdRow[]) ?? []);
  };
  const saveAd = async () => {
    if (!editingAd) return;
    const image_url = (editingAd.image_url ?? "").trim();
    if (!image_url) return flash("Image URL required");
    const payload = {
      title: (editingAd.title ?? "").trim(), image_url,
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
    logAction(editingAd.id ? "ad.update" : "ad.create", "ad", editingAd.id ?? "new");
    setEditingAd(null); loadAds();
  };
  const deleteAd = async (a: AdRow) => {
    if (!confirm(`Delete ad "${a.title || a.image_url}"?`)) return;
    setBusy(a.id);
    const { error } = await (supabase as any).from("advertisements").delete().eq("id", a.id);
    setBusy(null);
    if (error) return flash("Failed: " + error.message);
    logAction("ad.delete", "ad", a.id);
    loadAds();
  };
  const toggleAdActive = async (a: AdRow) => {
    setBusy(a.id);
    await (supabase as any).from("advertisements").update({ is_active: !a.is_active }).eq("id", a.id);
    setBusy(null);
    loadAds();
  };

  // ---------- Exports ----------
  const exportUsers = async () => {
    const { data } = await supabase.from("profiles")
      .select("id, username, display_name, points, reputation, is_banned, created_at")
      .order("created_at", { ascending: false });
    downloadCSV("users", (data as any[]) ?? []);
  };
  const exportOrders = async () => {
    const { data } = await (supabase as any).from("orders")
      .select("id, product_title, buyer_name, buyer_contact, quantity, unit_price_cents, currency, method, status, created_at")
      .order("created_at", { ascending: false });
    downloadCSV("orders", (data as any[]) ?? []);
  };

  useEffect(() => {
    if (!isStaff) return;
    loadStats();
  }, [isStaff]);

  useEffect(() => { if (isStaff && tab === "users") loadUsers(); /* eslint-disable-next-line */ }, [isStaff, tab, usersPage, usersQ]);
  useEffect(() => { if (isStaff && tab === "threads") loadThreads(); /* eslint-disable-next-line */ }, [isStaff, tab, threadsPage, threadsQ]);
  useEffect(() => { if (isStaff && tab === "products") loadProducts(); /* eslint-disable-next-line */ }, [isStaff, tab, productsPage, productsQ]);
  useEffect(() => { if (isStaff && tab === "orders") loadOrders(); /* eslint-disable-next-line */ }, [isStaff, tab, ordersPage, ordersQ, ordersStatus]);
  useEffect(() => { if (isStaff && tab === "reports") loadReports(); /* eslint-disable-next-line */ }, [isStaff, tab, reportsStatus]);
  useEffect(() => { if (isStaff && tab === "categories") loadCategories(); /* eslint-disable-next-line */ }, [isStaff, tab]);
  useEffect(() => { if (isStaff && tab === "ads") loadAds(); /* eslint-disable-next-line */ }, [isStaff, tab]);
  useEffect(() => { if (isStaff && tab === "settings") loadSettings(); /* eslint-disable-next-line */ }, [isStaff, tab]);
  useEffect(() => { if (isStaff && tab === "audit") loadAudit(); /* eslint-disable-next-line */ }, [isStaff, tab]);

  const tabs: { id: Tab; label: string; adminOnly?: boolean; badge?: number }[] = useMemo(() => [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users", adminOnly: true },
    { id: "threads", label: "Threads" },
    { id: "reports", label: "Reports", badge: stats?.pending_reports ?? 0 },
    { id: "categories", label: "Categories", adminOnly: true },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "ads", label: "Ads", adminOnly: true },
    { id: "settings", label: "Settings", adminOnly: true },
    { id: "audit", label: "Audit log", adminOnly: true },
  ], [stats?.pending_reports]);

  if (loading) return <div className="min-h-screen bg-[#f6f7f8] pt-8 text-center text-[#6b7280]">Loading…</div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        <div className="mx-auto max-w-md pt-8 text-center">
          <Shield size={40} className="mx-auto mb-3 text-[#6b7280]" />
          <h1 className="mb-2 text-xl font-extrabold">Sign in required</h1>
          <Link to="/auth" search={{ mode: "signin" }} className="inline-block rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">Sign In</Link>
        </div>
      </div>
    );
  }
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        <div className="mx-auto max-w-md pt-8 text-center">
          <ShieldOff size={40} className="mx-auto mb-3 text-red-500" />
          <h1 className="mb-2 text-xl font-extrabold">Access denied</h1>
          <p className="text-sm text-[#6b7280]">Admin or moderator role required.</p>
        </div>
      </div>
    );
  }

  const totalPages = (t: number) => Math.max(1, Math.ceil(t / PAGE_SIZE));
  const Pager = ({ page, total, onPage }: { page: number; total: number; onPage: (n: number) => void }) => (
    <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-slate-50 px-4 py-2 text-xs text-[#6b7280]">
      <span>{total.toLocaleString()} total · page {page + 1} / {totalPages(total)}</span>
      <div className="flex gap-1">
        <button disabled={page === 0} onClick={() => onPage(page - 1)} className="rounded border border-[#e5e7eb] bg-white px-2 py-1 disabled:opacity-40"><ChevronLeft size={14} /></button>
        <button disabled={page + 1 >= totalPages(total)} onClick={() => onPage(page + 1)} className="rounded border border-[#e5e7eb] bg-white px-2 py-1 disabled:opacity-40"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-64 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 pl-8 text-sm focus:border-[#0ea5e9] focus:outline-none" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <div className="mx-auto flex max-w-[1440px] pt-4">
        <SideRail />
        <main className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {msg && <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700">{msg}</div>}

          <header className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0ea5e9] text-white"><Shield size={20} /></div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{isAdmin ? "Admin Panel" : "Staff Panel"}</h1>
              <p className="text-sm text-[#6b7280]">Manage members, threads, marketplace, reports and site config.</p>
            </div>
          </header>

          <nav className="flex flex-wrap gap-1 border-b border-[#e5e7eb]">
            {tabs.map((t) => {
              if (t.adminOnly && !isAdmin) return null;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-bold capitalize transition-colors ${
                    tab === t.id ? "border-[#0ea5e9] text-[#0ea5e9]" : "border-transparent text-[#6b7280] hover:text-[#111827]"
                  }`}>
                  {t.label}
                  {t.badge ? <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{t.badge}</span> : null}
                </button>
              );
            })}
          </nav>

          {/* ---------- OVERVIEW ---------- */}
          {tab === "overview" && (
            <>
              <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                {[
                  { icon: <Users size={20} />, label: "Members", value: stats?.members ?? 0, bg: "bg-sky-500" },
                  { icon: <MessageSquare size={20} />, label: "Threads", value: stats?.threads ?? 0, bg: "bg-emerald-500" },
                  { icon: <MessageCircle size={20} />, label: "Replies", value: stats?.posts ?? 0, bg: "bg-orange-500" },
                  { icon: <Package size={20} />, label: "Products", value: stats?.products ?? 0, bg: "bg-violet-500" },
                  { icon: <ShoppingCart size={20} />, label: "Orders", value: stats?.orders ?? 0, bg: "bg-amber-500" },
                  { icon: <Flag size={20} />, label: "Reports", value: stats?.pending_reports ?? 0, bg: "bg-rose-500" },
                  { icon: <Ban size={20} />, label: "Banned", value: stats?.banned ?? 0, bg: "bg-red-500" },
                ].map((s) => (
                  <article key={s.label} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-white ${s.bg}`}>{s.icon}</div>
                    <p className="text-2xl font-extrabold tabular-nums">{s.value.toLocaleString()}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280]">{s.label}</p>
                  </article>
                ))}
              </section>
              <section className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <DollarSign size={28} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total revenue (completed orders)</p>
                    <p className="text-3xl font-extrabold tabular-nums">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((stats?.revenue_cents ?? 0) / 100)}
                    </p>
                  </div>
                </div>
              </section>
              <BlockedDomainsCard flash={flash} />
              <MultiAccountIPCard />

            </>
          )}

          {/* ---------- USERS ---------- */}
          {tab === "users" && isAdmin && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e7eb] px-4 py-3">
                <SearchInput value={usersQ} onChange={(v) => { setUsersPage(0); setUsersQ(v); }} placeholder="Search username / name…" />
                <div className="flex gap-2">
                  {usersSel.size > 0 && (
                    <>
                      <button onClick={() => bulkBan(true)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"><Ban size={12} className="mr-1 inline" /> Ban {usersSel.size}</button>
                      <button onClick={() => bulkBan(false)} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><CheckCircle2 size={12} className="mr-1 inline" /> Unban {usersSel.size}</button>
                    </>
                  )}
                  <button onClick={exportUsers} className="rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs font-bold text-[#374151] hover:border-[#0ea5e9]"><Download size={12} className="mr-1 inline" /> CSV</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="px-3 py-3"><input type="checkbox" checked={users.length > 0 && usersSel.size === users.length} onChange={(e) => setUsersSel(e.target.checked ? new Set(users.map((u) => u.id)) : new Set())} /></th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Roles</th>
                      <th className="px-4 py-3 text-right">Rep</th>
                      <th className="px-4 py-3 text-right">Points</th>
                      <th className="px-4 py-3 text-right">Warn</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={usersSel.has(u.id)} onChange={(e) => {
                            const n = new Set(usersSel); e.target.checked ? n.add(u.id) : n.delete(u.id); setUsersSel(n);
                          }} />
                        </td>
                        <td className="px-4 py-3">
                          <Link to="/u/$username" params={{ username: u.username }} className="font-bold text-[#111827] hover:text-[#0ea5e9]">{u.username}</Link>
                          {u.display_name && <p className="text-xs text-[#6b7280]">{u.display_name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-xs text-[#6b7280]">user</span>}
                            {u.roles.map((r) => (
                              <span key={r} className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${r === "admin" ? "bg-red-100 text-red-700" : r === "moderator" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{r}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{u.reputation}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => adjustPoints(u, -1)} className="rounded border border-[#e5e7eb] p-0.5 hover:border-red-300 hover:text-red-600" title="Subtract"><Minus size={11} /></button>
                            <span className="min-w-[2rem] text-center font-bold">{u.points}</span>
                            <button onClick={() => adjustPoints(u, 1)} className="rounded border border-[#e5e7eb] p-0.5 hover:border-emerald-300 hover:text-emerald-600" title="Add"><PlusIcon size={11} /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={u.warnings >= (settings.warnings_before_ban ?? 3) ? "font-extrabold text-red-600" : u.warnings > 0 ? "font-bold text-amber-600" : ""}>{u.warnings}</span>
                        </td>
                        <td className="px-4 py-3">
                          {u.is_banned
                            ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-700">Banned</span>
                            : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">Active</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button onClick={() => toggleRole(u, "admin")} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-red-300 hover:text-red-600" title="Toggle admin">
                              {u.roles.includes("admin") ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                            </button>
                            <button onClick={() => toggleRole(u, "moderator")} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-amber-300 hover:text-amber-600" title="Toggle moderator">Mod</button>
                            <button onClick={() => issueWarning(u)} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-amber-300 hover:text-amber-600" title="Warn"><AlertTriangle size={13} /></button>
                            {u.warnings > 0 && <button onClick={() => clearWarnings(u)} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-sky-300 hover:text-sky-600" title="Clear warnings">Clr</button>}
                            <button disabled={busy === u.id || u.id === user.id} onClick={() => toggleBan(u)} className={`rounded-md border px-2 py-1 text-xs font-bold ${u.is_banned ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-red-200 text-red-700 hover:bg-red-50"} disabled:opacity-40`}>
                              {busy === u.id ? <Loader2 size={13} className="animate-spin" /> : u.is_banned ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#6b7280]">No members found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pager page={usersPage} total={usersTotal} onPage={setUsersPage} />
            </section>
          )}

          {/* ---------- THREADS ---------- */}
          {tab === "threads" && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e7eb] px-4 py-3">
                <SearchInput value={threadsQ} onChange={(v) => { setThreadsPage(0); setThreadsQ(v); }} placeholder="Search thread title…" />
                {threadsSel.size > 0 && (
                  <button onClick={bulkDeleteThreads} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 size={12} className="mr-1 inline" /> Delete {threadsSel.size}</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    <tr>
                      <th className="px-3 py-3"><input type="checkbox" checked={threads.length > 0 && threadsSel.size === threads.length} onChange={(e) => setThreadsSel(e.target.checked ? new Set(threads.map((t) => t.id)) : new Set())} /></th>
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
                        <td className="px-3 py-3"><input type="checkbox" checked={threadsSel.has(t.id)} onChange={(e) => {
                          const n = new Set(threadsSel); e.target.checked ? n.add(t.id) : n.delete(t.id); setThreadsSel(n);
                        }} /></td>
                        <td className="max-w-[280px] px-4 py-3">
                          <Link to="/t/$slug" params={{ slug: t.slug }} className="line-clamp-1 font-bold text-[#111827] hover:text-[#0ea5e9]">
                            {t.is_pinned && <Pin size={12} className="mr-1 inline text-[#0ea5e9]" />}
                            {t.is_locked && <Lock size={12} className="mr-1 inline text-red-500" />}
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#6b7280]">{t.author ? <Link to="/u/$username" params={{ username: t.author.username }} className="hover:text-[#0ea5e9]">{t.author.username}</Link> : "-"}</td>
                        <td className="px-4 py-3 text-[#6b7280]">{t.category ? <Link to="/c/$slug" params={{ slug: t.category.slug }} className="hover:text-[#0ea5e9]">{t.category.name}</Link> : "-"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{t.vote_score}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{t.reply_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button disabled={busy === t.id} onClick={() => togglePin(t)} className={`rounded-md border px-2 py-1 text-xs font-bold ${t.is_pinned ? "border-[#0ea5e9] bg-sky-50 text-[#0ea5e9]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"}`}><Pin size={13} /></button>
                            <button disabled={busy === t.id} onClick={() => toggleLock(t)} className={`rounded-md border px-2 py-1 text-xs font-bold ${t.is_locked ? "border-red-300 bg-red-50 text-red-600" : "border-[#e5e7eb] text-[#6b7280] hover:border-red-300 hover:text-red-600"}`}>{t.is_locked ? <Unlock size={13} /> : <Lock size={13} />}</button>
                            <button disabled={busy === t.id} onClick={() => deleteThread(t)} className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                              {busy === t.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {threads.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6b7280]">No threads.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pager page={threadsPage} total={threadsTotal} onPage={setThreadsPage} />
            </section>
          )}

          {/* ---------- REPORTS ---------- */}
          {tab === "reports" && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e7eb] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500 text-white"><Flag size={16} /></div>
                  <div><h2 className="text-sm font-extrabold">User reports</h2><p className="text-xs text-[#6b7280]">Review flagged threads, posts and users.</p></div>
                </div>
                <select value={reportsStatus} onChange={(e) => setReportsStatus(e.target.value)} className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm">
                  <option value="pending">Pending</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="all">All</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                    <tr><th className="px-4 py-3">Target</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">When</th><th className="px-4 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                        <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700">{r.target_type}</span><p className="mt-1 font-mono text-xs text-[#6b7280]">{r.target_id.slice(0, 8)}…</p></td>
                        <td className="px-4 py-3 text-[#6b7280]">{r.reporter?.username ?? "—"}</td>
                        <td className="max-w-md px-4 py-3 text-[#374151]"><p className="line-clamp-3">{r.reason}</p></td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${r.status === "pending" ? "bg-amber-100 text-amber-700" : r.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{r.status}</span></td>
                        <td className="px-4 py-3 text-xs text-[#6b7280]">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {r.status === "pending" && <>
                              <button disabled={busy === r.id} onClick={() => resolveReport(r, "resolved")} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">Resolve</button>
                              <button disabled={busy === r.id} onClick={() => resolveReport(r, "dismissed")} className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-xs font-bold text-[#6b7280] hover:border-slate-400">Dismiss</button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]">No reports.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ---------- CATEGORIES ---------- */}
          {tab === "categories" && isAdmin && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white"><FolderTree size={18} /></div>
                  <div><h2 className="text-lg font-extrabold">Categories</h2><p className="text-xs text-[#6b7280]">Forum categories where members post threads.</p></div>
                </div>
                <button onClick={() => setEditingCategory({ ...emptyCategory })} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600"><Plus size={16} /> New category</button>
              </div>
              {editingCategory && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold">{editingCategory.id ? "Edit category" : "New category"}</h3>
                    <button onClick={() => setEditingCategory(null)} className="rounded-md p-1 text-[#6b7280] hover:bg-slate-100"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs font-bold text-[#6b7280]">Name<input value={editingCategory.name ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Slug (auto)<input value={editingCategory.slug ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">Description<textarea rows={2} value={editingCategory.description ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Icon (lucide name)<input value={editingCategory.icon ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })} placeholder="MessageSquare" className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Color<input type="color" value={editingCategory.color ?? "#0ea5e9"} onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-[#e5e7eb]" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Sort order<input type="number" value={editingCategory.sort_order ?? 0} onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setEditingCategory(null)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-bold text-[#6b7280]">Cancel</button>
                    <button disabled={busy === "save-cat"} onClick={saveCategory} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{busy === "save-cat" && <Loader2 size={14} className="animate-spin" />}Save</button>
                  </div>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Sort</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: c.color ?? "#0ea5e9" }} /><span className="font-bold">{c.name}</span>{c.description && <p className="text-xs text-[#6b7280]">{c.description}</p>}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{c.slug}</td>
                        <td className="px-4 py-3 tabular-nums">{c.sort_order}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingCategory(c)} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-[#0ea5e9] hover:text-[#0ea5e9]"><Pencil size={13} /></button>
                            <button disabled={busy === c.id} onClick={() => deleteCategory(c)} className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">{busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[#6b7280]">No categories.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ---------- PRODUCTS ---------- */}
          {tab === "products" && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3"><h2 className="text-lg font-extrabold">Marketplace products</h2><SearchInput value={productsQ} onChange={(v) => { setProductsPage(0); setProductsQ(v); }} placeholder="Search product…" /></div>
                <button onClick={() => setEditingProduct({ ...emptyProduct })} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600"><Plus size={16} /> New product</button>
              </div>
              {editingProduct && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold">{editingProduct.id ? "Edit product" : "New product"}</h3>
                    <button onClick={() => setEditingProduct(null)} className="rounded-md p-1 text-[#6b7280] hover:bg-slate-100"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs font-bold text-[#6b7280]">Title<input value={editingProduct.title ?? ""} onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Slug (auto if empty)<input value={editingProduct.slug ?? ""} onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <div className="text-xs font-bold text-[#6b7280] md:col-span-2">Description
                      <div className="mt-1"><RichEditor value={editingProduct.description ?? ""} onChange={(html) => setEditingProduct({ ...editingProduct, description: html })} placeholder="Describe your product…" minHeight={320} /></div>
                      <p className="mt-1 text-[11px] font-normal text-[#9ca3af]">Full block editor: headings, lists, images, YouTube, links.</p>
                    </div>
                    <label className="text-xs font-bold text-[#6b7280]">Price (cents)<input type="number" value={editingProduct.price_cents ?? 0} onChange={(e) => setEditingProduct({ ...editingProduct, price_cents: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Currency<input value={editingProduct.currency ?? "USD"} onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Stock<input type="number" value={editingProduct.stock ?? 0} onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Category<input value={editingProduct.category ?? ""} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">Image URL<input value={editingProduct.image_url ?? ""} onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Status<select value={editingProduct.status ?? "active"} onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as ProductRow["status"] })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280]"><input type="checkbox" checked={!!editingProduct.featured} onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })} />Featured</label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setEditingProduct(null)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-bold text-[#6b7280]">Cancel</button>
                    <button disabled={busy === "save-product"} onClick={saveProduct} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{busy === "save-product" && <Loader2 size={14} className="animate-spin" />}Save</button>
                  </div>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3"><Link to="/marketplace/$slug" params={{ slug: p.slug }} className="font-bold hover:text-[#0ea5e9]">{p.title}</Link>{p.category && <p className="text-xs text-[#6b7280]">{p.category}</p>}</td>
                          <td className="px-4 py-3 font-bold tabular-nums">{new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(p.price_cents / 100)}</td>
                          <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : p.status === "draft" ? "bg-slate-200 text-slate-600" : "bg-red-100 text-red-700"}`}>{p.status}</span></td>
                          <td className="px-4 py-3">{p.featured ? "★" : ""}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditingProduct(p)} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-[#0ea5e9] hover:text-[#0ea5e9]"><Pencil size={13} /></button>
                              <button disabled={busy === p.id} onClick={() => deleteProduct(p)} className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">{busy === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]">No products yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <Pager page={productsPage} total={productsTotal} onPage={setProductsPage} />
              </div>
            </section>
          )}

          {/* ---------- ORDERS ---------- */}
          {tab === "orders" && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e7eb] px-4 py-3">
                <div className="flex items-center gap-2">
                  <SearchInput value={ordersQ} onChange={(v) => { setOrdersPage(0); setOrdersQ(v); }} placeholder="Search product / buyer…" />
                  <select value={ordersStatus} onChange={(e) => { setOrdersPage(0); setOrdersStatus(e.target.value); }} className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm">
                    <option value="all">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <button onClick={exportOrders} className="rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs font-bold hover:border-[#0ea5e9]"><Download size={12} className="mr-1 inline" /> CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Buyer</th><th className="px-4 py-3">Method</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">When</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-3">{o.product_slug ? <Link to="/marketplace/$slug" params={{ slug: o.product_slug }} className="font-bold hover:text-[#0ea5e9]">{o.product_title}</Link> : <span className="font-bold">{o.product_title}</span>}{o.note && <p className="mt-0.5 line-clamp-1 text-xs text-[#6b7280]">"{o.note}"</p>}</td>
                        <td className="px-4 py-3"><p className="font-bold">{o.buyer_name}</p><p className="text-xs text-[#6b7280]">{o.buyer_contact}</p></td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${o.method === "whatsapp" ? "bg-emerald-100 text-emerald-700" : o.method === "email" ? "bg-slate-200 text-slate-700" : o.method === "cart" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{o.method}</span></td>
                        <td className="px-4 py-3 text-right tabular-nums">{o.quantity}</td>
                        <td className="px-4 py-3 text-right font-extrabold tabular-nums">{new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency }).format((o.unit_price_cents * o.quantity) / 100)}</td>
                        <td className="px-4 py-3">
                          <select disabled={busy === o.id} value={o.status} onChange={(e) => updateOrderStatus(o, e.target.value as OrderRow["status"])} className={`rounded-md border px-2 py-1 text-xs font-bold ${o.status === "new" ? "border-amber-300 bg-amber-50 text-amber-700" : o.status === "contacted" ? "border-sky-300 bg-sky-50 text-sky-700" : o.status === "completed" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
                            <option value="new">New</option><option value="contacted">Contacted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b7280]">{new Date(o.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3"><div className="flex justify-end"><button disabled={busy === o.id} onClick={() => deleteOrder(o)} className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">{busy === o.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}</button></div></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#6b7280]">No orders.</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pager page={ordersPage} total={ordersTotal} onPage={setOrdersPage} />
            </section>
          )}

          {/* ---------- ADS ---------- */}
          {tab === "ads" && isAdmin && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white"><Megaphone size={18} /></div><div><h2 className="text-lg font-extrabold">Advertisements</h2><p className="text-xs text-[#6b7280]">Image posters between posts.</p></div></div>
                <button onClick={() => setEditingAd({ ...emptyAd })} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2 text-sm font-bold text-white hover:bg-sky-600"><Plus size={16} /> New ad</button>
              </div>
              {editingAd && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-extrabold">{editingAd.id ? "Edit ad" : "New ad"}</h3><button onClick={() => setEditingAd(null)} className="rounded-md p-1 hover:bg-slate-100"><X size={16} /></button></div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">Title<input value={editingAd.title ?? ""} onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">Image URL<input value={editingAd.image_url ?? ""} onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280] md:col-span-2">Link URL<input value={editingAd.link_url ?? ""} onChange={(e) => setEditingAd({ ...editingAd, link_url: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="text-xs font-bold text-[#6b7280]">Placement<select value={editingAd.placement ?? "home"} onChange={(e) => setEditingAd({ ...editingAd, placement: e.target.value as AdRow["placement"] })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"><option value="home">Home</option><option value="thread">Thread</option><option value="both">Both</option></select></label>
                    <label className="text-xs font-bold text-[#6b7280]">Sort order<input type="number" value={editingAd.sort_order ?? 0} onChange={(e) => setEditingAd({ ...editingAd, sort_order: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280] md:col-span-2"><input type="checkbox" checked={editingAd.is_active !== false} onChange={(e) => setEditingAd({ ...editingAd, is_active: e.target.checked })} />Active</label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditingAd(null)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-bold text-[#6b7280]">Cancel</button><button disabled={busy === "save-ad"} onClick={saveAd} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50">{busy === "save-ad" && <Loader2 size={14} className="animate-spin" />}Save</button></div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ads.map((a) => (
                  <article key={a.id} className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100"><img src={a.image_url} alt={a.title} className="h-full w-full object-cover" /></div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-extrabold">{a.title || "(no title)"}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{a.is_active ? "Active" : "Off"}</span></div>
                      <p className="text-xs text-[#6b7280]">Placement: <span className="font-bold text-[#374151]">{a.placement}</span> · Order: {a.sort_order}</p>
                      <div className="flex flex-wrap justify-end gap-1 pt-1">
                        <button disabled={busy === a.id} onClick={() => toggleAdActive(a)} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-emerald-300">{a.is_active ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                        <button onClick={() => setEditingAd(a)} className="rounded-md border border-[#e5e7eb] px-2 py-1 text-xs font-bold hover:border-[#0ea5e9]"><Pencil size={13} /></button>
                        <button disabled={busy === a.id} onClick={() => deleteAd(a)} className="rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">{busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}</button>
                      </div>
                    </div>
                  </article>
                ))}
                {ads.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6b7280]">No ads yet.</div>}
              </div>
            </section>
          )}

          {/* ---------- SETTINGS ---------- */}
          {tab === "settings" && isAdmin && (
            <section className="max-w-2xl space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white"><SettingsIcon size={18} /></div><div><h2 className="text-lg font-extrabold">Site settings</h2><p className="text-xs text-[#6b7280]">Brand, contact, points economy, limits and site announcement.</p></div></div>

              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2"><Bell size={16} className="text-amber-600" /><span className="text-sm font-extrabold text-amber-900">Site-wide announcement banner</span></div>
                <textarea rows={2} value={settings.announcement ?? ""} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} placeholder="e.g. 🎉 Maintenance on Sunday…" className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm" />
                <label className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-900"><input type="checkbox" checked={settings.announcement_active} onChange={(e) => setSettings({ ...settings, announcement_active: e.target.checked })} />Show banner to all visitors</label>
              </div>

              <label className="block text-xs font-bold text-[#6b7280]">Brand name<input value={settings.brand_name} onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
              <label className="block text-xs font-bold text-[#6b7280]">WhatsApp<input value={settings.whatsapp_number ?? ""} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
              <label className="block text-xs font-bold text-[#6b7280]">Contact email<input value={settings.contact_email ?? ""} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {([
                  ["points_thread", "+pts thread"], ["points_comment", "+pts reply"], ["points_upvote", "+pts upvote"], ["points_referral", "+pts referral"],
                  ["max_threads_per_day", "Max threads/day"], ["max_comments_per_day", "Max replies/day"], ["warnings_before_ban", "Warnings → ban"], ["downloads_min_points", "Min points for downloads"],
                ] as [keyof SettingsRow, string][]).map(([k, label]) => (
                  <label key={k} className="text-xs font-bold text-[#6b7280]">{label}<input type="number" value={settings[k] as number} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm" /></label>
                ))}
              </div>

              <div className="flex justify-end"><button disabled={busy === "save-settings"} onClick={saveSettings} className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50"><Save size={14} />{busy === "save-settings" ? "Saving…" : "Save settings"}</button></div>
            </section>
          )}

          {/* ---------- AUDIT LOG ---------- */}
          {tab === "audit" && isAdmin && (
            <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white"><ClipboardList size={16} /></div><div><h2 className="text-sm font-extrabold">Audit log</h2><p className="text-xs text-[#6b7280]">Every staff action, most recent first (last 200).</p></div></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-[#6b7280]"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Details</th></tr></thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {auditRows.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3 text-xs text-[#6b7280]">{new Date(a.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">{a.actor_email ?? "—"}</td>
                        <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{a.action}</span></td>
                        <td className="px-4 py-3 text-xs">{a.target_type ?? "—"} {a.target_id && <span className="text-[#6b7280]">({String(a.target_id).slice(0, 8)}…)</span>}</td>
                        <td className="max-w-md px-4 py-3"><code className="line-clamp-2 text-[10px] text-[#6b7280]">{JSON.stringify(a.details)}</code></td>
                      </tr>
                    ))}
                    {auditRows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6b7280]">No actions logged yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
