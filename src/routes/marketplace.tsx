import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { SideRail } from "@/components/SideRail";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Package, Star } from "lucide-react";

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

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

function MarketplacePage() {
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

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <Header />
      <div className="mx-auto flex max-w-[1440px] pt-16">
        <SideRail />
        <main className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0ea5e9] text-white">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Marketplace</h1>
              <p className="text-sm text-[#6b7280]">Curated products from the MegaFlow team.</p>
            </div>
          </header>

          {isLoading && <p className="text-sm text-[#6b7280]">Loading products…</p>}

          {!isLoading && products.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-[#6b7280]" />
              <h2 className="mb-1 text-lg font-extrabold">No products yet</h2>
              <p className="text-sm text-[#6b7280]">Staff will add products here soon.</p>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm transition hover:border-[#0ea5e9] hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
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
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {p.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9]">
                      {p.category}
                    </span>
                  )}
                  <h3 className="line-clamp-2 text-sm font-extrabold text-[#111827]">{p.title}</h3>
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

export const Route = createFileRoute("/marketplace")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Marketplace — MegaFlow" },
      { name: "description", content: "Curated products from the MegaFlow team." },
    ],
  }),
});
