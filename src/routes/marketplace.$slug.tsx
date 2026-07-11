import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { SideRail } from "@/components/SideRail";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { addToCart } from "@/lib/cart";
import {
  Package,
  Star,
  ShoppingCart,
  Zap,
  MessageCircle,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

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
  status: string;
};

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const settings = useSiteSettings().data;

  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, description, price_cents, currency, image_url, category, stock, featured, status")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  const displayName = name || profile?.display_name || profile?.username || "";
  const displayContact = contact || user?.email || "";

  const placeOrder = async (method: "buy" | "whatsapp" | "email") => {
    if (!product) return;
    if (!displayName.trim() || !displayContact.trim()) {
      alert("Please enter your name and contact (email or phone).");
      return;
    }
    setBusy(method);
    const { error } = await (supabase as any).from("orders").insert({
      product_id: product.id,
      product_title: product.title,
      product_slug: product.slug,
      unit_price_cents: product.price_cents,
      currency: product.currency,
      quantity: qty,
      buyer_id: user?.id ?? null,
      buyer_name: displayName.trim(),
      buyer_contact: displayContact.trim(),
      method,
      note: note.trim() || null,
    });
    setBusy(null);
    if (error) {
      alert("Could not place order: " + error.message);
      return;
    }
    setDone(method);

    // For whatsapp / email, also open the external channel
    if (method === "whatsapp" && settings?.whatsapp_number) {
      const number = settings.whatsapp_number.replace(/[^0-9]/g, "");
      const text = encodeURIComponent(
        `Hi! I'd like to buy: ${product.title} (x${qty}) — ${formatPrice(product.price_cents * qty, product.currency)}.\nName: ${displayName}\nContact: ${displayContact}${note ? "\nNote: " + note : ""}`,
      );
      window.open(`https://wa.me/${number}?text=${text}`, "_blank");
    }
    if (method === "email" && settings?.contact_email) {
      const subject = encodeURIComponent(`Order: ${product.title} (x${qty})`);
      const body = encodeURIComponent(
        `Hi,\n\nI'd like to buy:\n- ${product.title} (x${qty})\n- Total: ${formatPrice(product.price_cents * qty, product.currency)}\n\nName: ${displayName}\nContact: ${displayContact}\n${note ? "\nNote: " + note : ""}\n\nThanks!`,
      );
      window.location.href = `mailto:${settings.contact_email}?subject=${subject}&body=${body}`;
    }
  };

  const addCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      priceCents: product.price_cents,
      currency: product.currency,
      imageUrl: product.image_url,
    }, qty);
    setDone("cart");
    setTimeout(() => setDone(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <Header />
      <div className="mx-auto flex max-w-[1440px]">
        <SideRail />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/marketplace"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#6b7280] hover:text-[#0ea5e9]"
          >
            <ArrowLeft size={14} /> Back to Marketplace
          </Link>

          {isLoading && <p className="text-sm text-[#6b7280]">Loading product…</p>}

          {!isLoading && !product && (
            <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-[#6b7280]" />
              <h2 className="mb-1 text-lg font-extrabold">Product not found</h2>
              <p className="text-sm text-[#6b7280]">It may have been removed.</p>
            </div>
          )}

          {product && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
              {/* Image */}
              <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#6b7280]">
                      <Package size={60} />
                    </div>
                  )}
                  {product.featured && (
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase text-amber-950">
                      <Star size={12} fill="currentColor" /> Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Details + actions */}
              <div className="space-y-5">
                <div>
                  {product.category && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">
                      {product.category}
                    </span>
                  )}
                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{product.title}</h1>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold tabular-nums text-[#111827]">
                      {formatPrice(product.price_cents, product.currency)}
                    </span>
                    <span className={`text-xs font-bold uppercase ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm leading-relaxed text-[#374151]">{product.description}</p>
                )}

                {/* Buyer info */}
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-extrabold">Your details</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-[#6b7280]">
                      Name
                      <input
                        value={displayName}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280]">
                      Email or phone
                      <input
                        value={displayContact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="you@example.com / +92…"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280] sm:col-span-2">
                      Quantity
                      <input
                        type="number"
                        min={1}
                        max={product.stock || 99}
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                        className="mt-1 w-28 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#6b7280] sm:col-span-2">
                      Note (optional)
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Anything the seller should know…"
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal text-[#111827] focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                  </div>
                </div>

                {done && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                    <CheckCircle2 size={16} />
                    {done === "cart"
                      ? "Added to cart!"
                      : "Request sent — the team will contact you shortly."}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    disabled={busy !== null || product.stock <= 0}
                    onClick={() => placeOrder("buy")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-sky-200 hover:bg-sky-600 disabled:opacity-50"
                  >
                    {busy === "buy" ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    Buy Now
                  </button>
                  <button
                    disabled={product.stock <= 0}
                    onClick={addCart}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#0ea5e9] bg-white px-4 py-3 text-sm font-extrabold text-[#0ea5e9] hover:bg-sky-50 disabled:opacity-50"
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button
                    disabled={busy !== null || !settings?.whatsapp_number}
                    onClick={() => placeOrder("whatsapp")}
                    title={!settings?.whatsapp_number ? "WhatsApp not configured" : ""}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {busy === "whatsapp" ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                    Buy on WhatsApp
                  </button>
                  <button
                    disabled={busy !== null || !settings?.contact_email}
                    onClick={() => placeOrder("email")}
                    title={!settings?.contact_email ? "Email not configured" : ""}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-900 disabled:opacity-50"
                  >
                    {busy === "email" ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    Buy on Email
                  </button>
                </div>

                <p className="text-xs text-[#6b7280]">
                  Every request is sent to the admin panel. Staff will contact you via your provided details.
                </p>

                <div>
                  <button
                    onClick={() => navigate({ to: "/cart" })}
                    className="text-sm font-bold text-[#0ea5e9] hover:underline"
                  >
                    View cart →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/marketplace/$slug")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Product — MegaFlow Marketplace" },
      { name: "description", content: "Buy from the MegaFlow marketplace." },
    ],
  }),
});
