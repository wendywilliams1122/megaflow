import { createFileRoute, Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Megaphone, Target, BarChart3, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/advertisement")({
  head: () => ({
    meta: [
      { title: "Advertise on MegaFlow - Reach Our Community" },
      { name: "description", content: "Promote your product to a highly engaged forum audience. Sponsorships, banner slots, and featured marketplace listings available." },
      { property: "og:title", content: "Advertise on MegaFlow" },
      { property: "og:description", content: "Reach engaged forum members with our ad options." },
    ],
  }),
  component: AdsPage,
});

function AdsPage() {
  const { data: settings } = useSiteSettings();
  const packages = [
    { name: "Sidebar Banner", price: "$99 / month", features: ["Visible on every forum page", "Desktop + mobile", "1 creative swap / month"] },
    { name: "Featured Marketplace Listing", price: "$49 / listing", features: ["Top of Marketplace grid", "\"Featured\" badge", "30-day slot"] },
    { name: "Sponsored Discussion", price: "$149 / week", features: ["Pinned to homepage", "Category-targeted", "Dedicated staff-authored post"] },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <Megaphone className="mt-1 text-[#0ea5e9]" size={28} />
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827]">Advertise on MegaFlow</h1>
          <p className="mt-2 max-w-2xl text-[#6b7280]">Reach thousands of engaged members with placements built for the forum experience.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={Target} label="Highly targeted" value="20+ categories" />
        <Stat icon={BarChart3} label="Monthly active" value="12k+ members" />
        <Stat icon={CheckCircle2} label="Avg. response" value="< 24 hours" />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {packages.map((p) => (
          <div key={p.name} className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-6">
            <h3 className="font-bold text-[#111827]">{p.name}</h3>
            <div className="mt-1 text-2xl font-extrabold text-[#0ea5e9]">{p.price}</div>
            <ul className="mt-4 space-y-2 text-sm text-[#6b7280]">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-[#0ea5e9]" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="text-xl font-extrabold text-[#111827]">Get in touch</h2>
        <p className="mt-2 text-sm text-[#6b7280]">Ready to advertise? Reach out and we&apos;ll send our media kit.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {settings?.contact_email && (
            <a href={`mailto:${settings.contact_email}?subject=Advertising inquiry`} className="rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">Email Us</a>
          )}
          {settings?.whatsapp_number && (
            <a href={`https://wa.me/${settings.whatsapp_number.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9]">WhatsApp</a>
          )}
          <Link to="/contact" className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9]">Contact Form</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <Icon className="text-[#0ea5e9]" />
      <div className="mt-3 text-lg font-extrabold text-[#111827]">{value}</div>
      <div className="text-xs uppercase tracking-wider text-[#6b7280]">{label}</div>
    </div>
  );
}
