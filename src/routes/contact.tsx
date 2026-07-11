import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — MegaFlow" },
      { name: "description", content: "Get in touch with the MegaFlow team via email, WhatsApp, or our contact form." },
      { property: "og:title", content: "Contact Us — MegaFlow" },
      { property: "og:description", content: "Reach the MegaFlow team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    const email = settings?.contact_email;
    if (email) {
      const body = `From: ${form.name} <${form.email}>%0D%0A%0D%0A${encodeURIComponent(form.message)}`;
      window.location.href = `mailto:${email}?subject=Contact from ${encodeURIComponent(form.name)}&body=${body}`;
    } else {
      toast.success("Message ready. Contact email not configured yet.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-[#111827]">Contact Us</h1>
      <p className="mt-2 text-[#6b7280]">We usually respond within 24 hours.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {settings?.contact_email && (
          <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 hover:border-[#0ea5e9]">
            <Mail className="text-[#0ea5e9]" /> <div><div className="text-xs text-[#6b7280]">Email</div><div className="font-semibold">{settings.contact_email}</div></div>
          </a>
        )}
        {settings?.whatsapp_number && (
          <a href={`https://wa.me/${settings.whatsapp_number.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 hover:border-[#0ea5e9]">
            <MessageCircle className="text-[#0ea5e9]" /> <div><div className="text-xs text-[#6b7280]">WhatsApp</div><div className="font-semibold">{settings.whatsapp_number}</div></div>
          </a>
        )}
        {!settings?.contact_email && !settings?.whatsapp_number && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#e5e7eb] p-4 text-sm text-[#6b7280] sm:col-span-2">
            <Phone /> Contact details will appear once configured in the Admin Panel.
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#111827]">Your Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#111827]">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#111827]">Message</span>
          <textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
        </label>
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
          <Send size={16} /> Send Message
        </button>
      </form>
    </div>
  );
}
