import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { SideRail } from "@/components/SideRail";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { addToCart } from "@/lib/cart";
import { ShoppingBag, Package, Star, Search, SlidersHorizontal, ShoppingCart, Check } from "lucide-react";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  featured: boolean;
};

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [inStock, setInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [added, setAdded] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, description, price_cents, currency, image_url, category, stock, featured")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const maxAvailable = useMemo(
    () => Math.max(0, ...products.map((p) => Math.ceil(p.price_cents / 100))),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (inStock && p.stock <= 0) return false;
      if (maxPrice > 0 && p.price_cents / 100 > maxPrice) return false;
      if (q.trim()) {
        const hay = `${p.title} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price_cents - b.price_cents); break;
      case "price-desc": list = [...list].sort((a, b) => b.price_cents - a.price_cents); break;
      case "name": list = [...list].sort((a, b) => a.title.localeCompare(b.title)); break;
      case "newest": /* already newest first */ break;
      case "featured": list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }
    return list;
  }, [products, category, inStock, maxPrice, q, sort]);

  const quickAdd = (p: Product) => {
    addToCart({
      productId: p.id,
      title: p.title,
      slug: p.slug,
      priceCents: p.price_cents,
      currency: p.currency,
      imageUrl: p.image_url,
    }, 1);
    setAdded(p.id);
    setTimeout(() => setAdded((s) => (s === p.id ? null : s)), 1400);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <Header />
      <div className="mx-auto flex max-w-[1440px]">
        <SideRail />
        <main className="min-w-0 flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0ea5e9] text-white">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Marketplace</h1>
                <p className="text-sm text-[#6b7280]">Curated products from the MegaFlow team.</p>
              </div>
            </div>
            <Link
              to="/cart"
              className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
            >
              <ShoppingCart size={16} /> View cart
            </Link>
          </header>

          {/* Filter bar */}
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative flex-1 min-w-[200px]">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6b7280]">
                  <Search size={16} />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  className="block w-full rounded-lg border border-[#e5e7eb] bg-[#f6f7f8] py-2 pl-9 pr-3 text-sm focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name (A–Z)</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-bold text-[#6b7280]">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e5e7eb]"
                />
                In stock only
              </label>
            </div>

            {maxAvailable > 0 && (
              <div className="mt-3 flex items-center gap-3 border-t border-[#e5e7eb] pt-3">
                <SlidersHorizontal size={14} className="text-[#6b7280]" />
                <span className="text-xs font-bold text-[#6b7280]">Max price</span>
                <input
                  type="range"
                  min={0}
                  max={maxAvailable}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="flex-1 accent-[#0ea5e9]"
                />
                <span className="w-24 text-right text-sm font-extrabold tabular-nums">
                  {maxPrice === 0 ? "Any" : `≤ $${maxPrice}`}
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-3">
              <p className="text-xs font-bold text-[#6b7280]">
                {filtered.length} of {products.length} products
              </p>
              {(q || category !== "all" || inStock || maxPrice > 0 || sort !== "featured") && (
                <button
                  onClick={() => { setQ(""); setCategory("all"); setInStock(false); setMaxPrice(0); setSort("featured"); }}
                  className="text-xs font-bold text-[#0ea5e9] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          </section>

          {isLoading && <p className="text-sm text-[#6b7280]">Loading products…</p>}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-[#6b7280]" />
              <h2 className="mb-1 text-lg font-extrabold">No products match</h2>
              <p className="text-sm text-[#6b7280]">Try adjusting the filters.</p>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm transition hover:border-[#0ea5e9] hover:shadow-md"
              >
                <Link to="/marketplace/$slug" params={{ slug: p.slug }} className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#6b7280]">
                      <Package size={36} />
                    </div>
                  )}
                  {p.featured && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-950">
                      <Star size={10} fill="currentColor" /> Featured
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {p.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9]">
                      {p.category}
                    </span>
                  )}
                  <Link
                    to="/marketplace/$slug"
                    params={{ slug: p.slug }}
                    className="line-clamp-2 text-sm font-extrabold text-[#111827] hover:text-[#0ea5e9]"
                  >
                    {p.title}
                  </Link>
                  {p.description && (
                    <p className="line-clamp-2 text-xs text-[#6b7280]">{p.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-extrabold tabular-nums text-[#111827]">
                      {formatPrice(p.price_cents, p.currency)}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        p.stock > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {p.stock > 0 ? `${p.stock} in stock` : "Sold out"}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Link
                      to="/marketplace/$slug"
                      params={{ slug: p.slug }}
                      className="rounded-lg bg-[#0ea5e9] px-2 py-2 text-center text-xs font-extrabold text-white hover:bg-sky-600"
                    >
                      Buy
                    </Link>
                    <button
                      disabled={p.stock <= 0}
                      onClick={() => quickAdd(p)}
                      className="flex items-center justify-center gap-1 rounded-lg border-2 border-[#0ea5e9] px-2 py-2 text-xs font-extrabold text-[#0ea5e9] hover:bg-sky-50 disabled:opacity-40"
                    >
                      {added === p.id ? <><Check size={12} /> Added</> : <><ShoppingCart size={12} /> Cart</>}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export const Route = createFileRoute("/marketplace/")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Marketplace — MegaFlow" },
      { name: "description", content: "Curated products from the MegaFlow team." },
    ],
  }),
});
