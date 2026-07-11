import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { SideRail } from "@/components/SideRail";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { supabase } from "@/integrations/supabase/client";
import { cartTotalCents, clearCart, removeFromCart, updateQty } from "@/lib/cart";
import { ShoppingCart, Trash2, Loader2, CheckCircle2, ArrowLeft, Package } from "lucide-react";

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

function CartPage() {
  const { items, hydrated } = useCart();
  const { user, profile } = useAuth();
  const settings = useSiteSettings().data;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const displayName = name || profile?.display_name || profile?.username || "";
  const displayContact = contact || user?.email || "";
  const currency = items[0]?.currency ?? "USD";
  const total = cartTotalCents(items);

  const checkout = async () => {
    if (!displayName.trim() || !displayContact.trim()) {
      alert("Please enter your name and contact (email or phone).");
      return;
    }
    if (items.length === 0) return;
    setBusy(true);
    const rows = items.map((i) => ({
      product_id: i.productId,
      product_title: i.title,
      product_slug: i.slug,
      unit_price_cents: i.priceCents,
      currency: i.currency,
      quantity: i.qty,
      buyer_id: user?.id ?? null,
      buyer_name: displayName.trim(),
      buyer_contact: displayContact.trim(),
      method: "cart",
      note: note.trim() || null,
    }));
    const { error } = await (supabase as any).from("orders").insert(rows);
    setBusy(false);
    if (error) {
      alert("Checkout failed: " + error.message);
      return;
    }
    clearCart();
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#111827]">
      <Header />
      <div className="mx-auto flex max-w-[1440px]">
        <SideRail />
        <main className="min-w-0 flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6b7280] hover:text-[#0ea5e9]"
          >
            <ArrowLeft size={14} /> Continue shopping
          </Link>

          <header className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0ea5e9] text-white">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Your Cart</h1>
              <p className="text-sm text-[#6b7280]">Review items and submit your order request.</p>
            </div>
          </header>

          {done ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-600" />
              <h2 className="mb-1 text-lg font-extrabold text-emerald-800">Order request sent!</h2>
              <p className="mb-4 text-sm text-emerald-700">
                Staff will contact you shortly via the details you provided.
              </p>
              <Link
                to="/marketplace"
                className="inline-block rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
              >
                Back to Marketplace
              </Link>
            </div>
          ) : !hydrated ? (
            <p className="text-sm text-[#6b7280]">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-12 text-center">
              <ShoppingCart size={40} className="mx-auto mb-3 text-[#6b7280]" />
              <h2 className="mb-1 text-lg font-extrabold">Your cart is empty</h2>
              <p className="mb-4 text-sm text-[#6b7280]">Browse the marketplace to add products.</p>
              <Link
                to="/marketplace"
                className="inline-block rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
              >
                Go to Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
              <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
                <ul className="divide-y divide-[#e5e7eb]">
                  {items.map((i) => (
                    <li key={i.productId} className="flex items-center gap-4 p-4">
                      <Link
                        to="/marketplace/$slug"
                        params={{ slug: i.slug }}
                        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
                      >
                        {i.imageUrl ? (
                          <img src={i.imageUrl} alt={i.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#6b7280]">
                            <Package size={22} />
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/marketplace/$slug"
                          params={{ slug: i.slug }}
                          className="line-clamp-1 font-extrabold text-[#111827] hover:text-[#0ea5e9]"
                        >
                          {i.title}
                        </Link>
                        <p className="text-xs text-[#6b7280]">{formatPrice(i.priceCents, i.currency)} each</p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.productId, Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-center text-sm"
                      />
                      <p className="w-24 text-right font-extrabold tabular-nums">
                        {formatPrice(i.priceCents * i.qty, i.currency)}
                      </p>
                      <button
                        onClick={() => removeFromCart(i.productId)}
                        className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <aside className="space-y-4">
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-extrabold">Order summary</h3>
                  <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-3">
                    <span className="text-sm font-bold text-[#6b7280]">Total</span>
                    <span className="text-2xl font-extrabold tabular-nums">{formatPrice(total, currency)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-extrabold">Your details</h3>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#6b7280]">
                      Name
                      <input
                        value={displayName}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="block text-xs font-bold text-[#6b7280]">
                      Email or phone
                      <input
                        value={displayContact}
                        onChange={(e) => setContact(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="block text-xs font-bold text-[#6b7280]">
                      Note (optional)
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-normal focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <button
                      disabled={busy}
                      onClick={checkout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea5e9] px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-sky-200 hover:bg-sky-600 disabled:opacity-50"
                    >
                      {busy && <Loader2 size={16} className="animate-spin" />}
                      Place Order Request
                    </button>
                    {(settings?.whatsapp_number || settings?.contact_email) && (
                      <p className="text-center text-[11px] text-[#6b7280]">
                        Prefer chat? Reach us on{" "}
                        {settings.whatsapp_number && <span className="font-bold">WhatsApp {settings.whatsapp_number}</span>}
                        {settings.whatsapp_number && settings.contact_email && " · "}
                        {settings.contact_email && <span className="font-bold">{settings.contact_email}</span>}
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Cart - MegaFlow Marketplace" },
      { name: "description", content: "Review your marketplace order." },
    ],
  }),
});
