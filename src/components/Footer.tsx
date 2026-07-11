import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Heart, Mail, MessageCircle, Send, ShieldCheck, Sparkles } from "lucide-react";

type Col = { title: string; links: { label: string; to: string }[] };

const columns: Col[] = [
  {
    title: "Community",
    links: [
      { label: "Discussions", to: "/" },
      { label: "Categories", to: "/categories" },
      { label: "Best Members", to: "/best-members" },
      { label: "Marketplace", to: "/marketplace" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Forum Rules", to: "/rules" },
      { label: "Support", to: "/support" },
      { label: "Advertisement", to: "/advertisement" },
      { label: "About Us", to: "/about" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", to: "/auth" },
      { label: "My Dashboard", to: "/dashboard" },
      { label: "Account Settings", to: "/settings" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  const { data: settings } = useSiteSettings();

  return (
    <footer className="mt-14 border-t border-[#e5e7eb] bg-gradient-to-b from-white to-[#f6f7f8]">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0ea5e9] text-white shadow-sm shadow-sky-200">
                <Heart size={17} fill="currentColor" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-[#111827]">MegaFlow</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#6b7280]">
              A community forum for makers, learners, and creators — share courses, tools, freebies
              and grow together.
            </p>

            <ul className="mt-5 space-y-2 text-sm">
              {settings?.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 text-[#374151] hover:text-[#0ea5e9]">
                    <Mail size={15} className="text-[#0ea5e9]" /> {settings.contact_email}
                  </a>
                </li>
              )}
              {settings?.whatsapp_number && (
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsapp_number.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[#374151] hover:text-[#0ea5e9]"
                  >
                    <MessageCircle size={15} className="text-[#0ea5e9]" /> {settings.whatsapp_number}
                  </a>
                </li>
              )}
            </ul>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck size={13} /> Trusted community since {year}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0ea5e9]">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-[#374151] transition-colors hover:text-[#0ea5e9]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-sky-100 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0ea5e9]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#111827]">Stay in the flow</p>
              <p className="text-xs text-[#6b7280]">Get weekly picks — top threads, resources & new drops.</p>
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-4 flex items-center gap-2 sm:mt-0 sm:w-96"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="min-w-0 flex-1 rounded-lg border border-[#e5e7eb] bg-[#f6f7f8] px-3 py-2.5 text-sm focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600"
            >
              <Send size={14} /> Subscribe
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col-reverse items-start justify-between gap-3 border-t border-[#e5e7eb] pt-6 text-xs text-[#6b7280] sm:flex-row sm:items-center">
          <p>© {year} MegaFlow. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold">
            <Link to="/rules" className="hover:text-[#0ea5e9]">Rules</Link>
            <Link to="/about" className="hover:text-[#0ea5e9]">About</Link>
            <Link to="/contact" className="hover:text-[#0ea5e9]">Contact</Link>
            <Link to="/advertisement" className="hover:text-[#0ea5e9]">Advertise</Link>
            <Link to="/support" className="hover:text-[#0ea5e9]">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
