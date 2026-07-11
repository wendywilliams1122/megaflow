import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SideRail } from "@/components/SideRail";
import {
  Save, KeyRound, LogOut, User as UserIcon, Camera, Pencil, MapPin, Globe,
  Github, Twitter, Linkedin, Mail, ShieldCheck, Sparkles, Eye, ImagePlus, Check,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Edit Profile — MegaFlow" },
      { name: "description", content: "Update your MegaFlow profile — avatar, cover, headline, bio, location and social links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

type ProfileForm = {
  username: string;
  display_name: string;
  avatar_url: string;
  cover_url: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  social_twitter: string;
  social_github: string;
  social_linkedin: string;
};

const EMPTY: ProfileForm = {
  username: "", display_name: "", avatar_url: "", cover_url: "",
  headline: "", bio: "", location: "", website: "",
  social_twitter: "", social_github: "", social_linkedin: "",
};

function SettingsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [initial, setInitial] = useState<ProfileForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [tab, setTab] = useState<"profile" | "security">("profile");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      const p = profile as unknown as Partial<ProfileForm> & { username: string };
      const next: ProfileForm = {
        username: p.username ?? "",
        display_name: p.display_name ?? "",
        avatar_url: p.avatar_url ?? "",
        cover_url: p.cover_url ?? "",
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        location: p.location ?? "",
        website: p.website ?? "",
        social_twitter: p.social_twitter ?? "",
        social_github: p.social_github ?? "",
        social_linkedin: p.social_linkedin ?? "",
      };
      setForm(next);
      setInitial(next);
    }
  }, [profile]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const update = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const completion = useMemo(() => {
    const fields: (keyof ProfileForm)[] = [
      "display_name", "avatar_url", "cover_url", "headline",
      "bio", "location", "website",
    ];
    const filled = fields.filter((k) => form[k]?.trim().length).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    const uname = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (uname.length < 3) return toast.error("Username must be at least 3 characters (a-z, 0-9, _)");
    setSaving(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        username: uname,
        display_name: form.display_name.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        cover_url: form.cover_url.trim() || null,
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        social_twitter: form.social_twitter.trim() || null,
        social_github: form.social_github.trim() || null,
        social_linkedin: form.social_linkedin.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setInitial(form);
    toast.success("Profile updated");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Password updated");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const initials = (form.display_name || form.username || "U").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Edit Profile</h1>
              <p className="text-sm text-[#6b7280]">Manage how you appear to the MegaFlow community.</p>
            </div>
            <div className="flex items-center gap-2">
              {profile && (
                <Link
                  to="/u/$username"
                  params={{ username: profile.username }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                >
                  <Eye size={14} /> View public profile
                </Link>
              )}
              <button
                onClick={() => save()}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} /> {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex items-center gap-1 border-b border-[#e5e7eb]">
            {[
              { k: "profile", label: "Profile", icon: UserIcon },
              { k: "security", label: "Account & Security", icon: ShieldCheck },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === (t.k as typeof tab);
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as typeof tab)}
                  className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border-[#0ea5e9] text-[#0ea5e9]"
                      : "border-transparent text-[#6b7280] hover:text-[#111827]"
                  }`}
                >
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === "profile" && (
            <form onSubmit={save} className="space-y-5">
              {/* Cover + avatar card */}
              <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
                <div className="relative h-40 sm:h-52">
                  {form.cover_url ? (
                    <img src={form.cover_url} alt="Cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[linear-gradient(135deg,#0ea5e9_0%,#0284c7_45%,#0369a1_100%)]" />
                  )}
                  <label className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-[#111827] shadow-sm backdrop-blur hover:bg-white">
                    <ImagePlus size={13} /> Edit cover
                    <input
                      type="url"
                      value={form.cover_url}
                      onChange={(e) => update("cover_url", e.target.value)}
                      placeholder="Paste image URL"
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative px-5 pb-5 sm:px-8">
                  <div className="-mt-14 flex flex-col gap-3 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                    <div className="relative">
                      {form.avatar_url ? (
                        <img
                          src={form.avatar_url}
                          alt=""
                          className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md sm:h-32 sm:w-32"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#0ea5e9] text-3xl font-extrabold text-white shadow-md sm:h-32 sm:w-32">
                          {initials}
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#111827] text-white shadow">
                        <Camera size={13} />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 sm:pl-6 sm:pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-extrabold text-[#111827]">
                          {form.display_name || form.username || "Your name"}
                        </h2>
                        {profile?.staff_badge && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-purple-700">
                            {profile.staff_badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-[#6b7280]">
                        {form.headline || "Add a headline that describes what you do"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b7280]">
                        {form.location && (
                          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {form.location}</span>
                        )}
                        {user?.email && (
                          <span className="inline-flex items-center gap-1"><Mail size={12} /> {user.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Image URL inputs — inline */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Avatar URL"
                      value={form.avatar_url}
                      onChange={(v) => update("avatar_url", v)}
                      placeholder="https://…/avatar.jpg"
                      icon={<Camera size={14} />}
                    />
                    <Field
                      label="Cover image URL"
                      value={form.cover_url}
                      onChange={(v) => update("cover_url", v)}
                      placeholder="https://…/cover.jpg"
                      icon={<ImagePlus size={14} />}
                    />
                  </div>
                </div>
              </section>

              {/* Profile completion */}
              <section className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#0ea5e9]">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-extrabold text-[#111827]">Profile strength</p>
                      <span className="text-sm font-extrabold text-[#0ea5e9]">{completion}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-sky-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#6b7280]">
                      Complete your profile to build trust and connect with the community.
                    </p>
                  </div>
                </div>
              </section>

              {/* Basic info */}
              <Card title="Basic Information" description="This appears on your public profile and posts.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Username"
                    value={form.username}
                    onChange={(v) => update("username", v)}
                    hint="Lowercase letters, numbers, underscores."
                    prefix="@"
                  />
                  <Field
                    label="Display name"
                    value={form.display_name}
                    onChange={(v) => update("display_name", v)}
                    placeholder="Your full name"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Headline"
                      value={form.headline}
                      onChange={(v) => update("headline", v)}
                      placeholder="e.g. Full-stack developer • Course creator • Design enthusiast"
                      maxLength={120}
                      hint={`${form.headline.length}/120`}
                    />
                  </div>
                  <Field
                    label="Location"
                    value={form.location}
                    onChange={(v) => update("location", v)}
                    placeholder="City, Country"
                    icon={<MapPin size={14} />}
                  />
                  <Field
                    label="Website"
                    value={form.website}
                    onChange={(v) => update("website", v)}
                    placeholder="https://yourwebsite.com"
                    icon={<Globe size={14} />}
                  />
                </div>
              </Card>

              {/* About */}
              <Card title="About" description="Introduce yourself. Share your work, interests and expertise.">
                <div className="relative">
                  <textarea
                    rows={6}
                    value={form.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    maxLength={600}
                    placeholder="Tell the community about yourself…"
                    className="w-full resize-y rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-[#9ca3af]">
                    {form.bio.length}/600
                  </span>
                </div>
              </Card>

              {/* Social */}
              <Card title="Social Links" description="Optional — help members connect with you elsewhere.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Twitter / X"
                    value={form.social_twitter}
                    onChange={(v) => update("social_twitter", v)}
                    placeholder="username"
                    icon={<Twitter size={14} />}
                  />
                  <Field
                    label="GitHub"
                    value={form.social_github}
                    onChange={(v) => update("social_github", v)}
                    placeholder="username"
                    icon={<Github size={14} />}
                  />
                  <Field
                    label="LinkedIn"
                    value={form.social_linkedin}
                    onChange={(v) => update("social_linkedin", v)}
                    placeholder="in/username"
                    icon={<Linkedin size={14} />}
                  />
                </div>
              </Card>

              {/* Sticky save bar (mobile-friendly) */}
              {dirty && (
                <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2 text-sm text-[#374151]">
                    <Pencil size={14} className="text-[#0ea5e9]" />
                    <span className="font-semibold">Unsaved changes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(initial)}
                      className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:border-[#0ea5e9]"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
                    >
                      {saving ? "Saving…" : (<><Check size={14} /> Save</>)}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {tab === "security" && (
            <div className="space-y-5">
              <Card title="Email address" description="The email used to sign in to your account.">
                <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <Mail size={16} className="text-[#0ea5e9]" />
                  <span className="text-sm font-semibold text-[#111827]">{user?.email}</span>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">
                    <ShieldCheck size={11} /> Verified
                  </span>
                </div>
              </Card>

              <Card title="Change password" description="Use at least 6 characters. Choose something strong.">
                <form onSubmit={changePassword} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Field
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="••••••••"
                      icon={<KeyRound size={14} />}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-5 py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
                  >
                    <KeyRound size={14} /> {pwSaving ? "Updating…" : "Update password"}
                  </button>
                </form>
              </Card>

              <Card
                title="Sign out"
                description="You'll need to sign back in to access your account."
                tone="danger"
              >
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Reusable pieces ---------- */

function Card({
  title, description, children, tone = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const danger = tone === "danger";
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
        danger ? "border-red-200 bg-red-50" : "border-[#e5e7eb] bg-white"
      }`}
    >
      <div className="mb-4">
        <h3 className={`text-base font-extrabold ${danger ? "text-red-800" : "text-[#111827]"}`}>
          {title}
        </h3>
        {description && (
          <p className={`mt-0.5 text-sm ${danger ? "text-red-700" : "text-[#6b7280]"}`}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label, value, onChange, placeholder, hint, icon, prefix, type = "text", maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  icon?: React.ReactNode;
  prefix?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#6b7280]">
        {label}
      </span>
      <div className="relative">
        {(icon || prefix) && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6b7280]">
            {icon ?? <span className="text-sm font-semibold">{prefix}</span>}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`block w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] py-2.5 pr-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 ${
            icon || prefix ? "pl-9" : "pl-3"
          }`}
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-[#6b7280]">{hint}</span>}
    </label>
  );
}
