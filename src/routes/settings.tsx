import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SideRail } from "@/components/SideRail";
import { Footer } from "@/components/Footer";
import { Save, KeyRound, LogOut, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — MegaFlow" },
      { name: "description", content: "Update your MegaFlow profile, display name, avatar, and password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", display_name: "", avatar_url: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username ?? "",
        display_name: profile.display_name ?? "",
        avatar_url: profile.avatar_url ?? "",
        bio: (profile as unknown as { bio?: string }).bio ?? "",
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const uname = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (uname.length < 3) return toast.error("Username must be at least 3 characters (a-z, 0-9, _)");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: uname,
        display_name: form.display_name.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        bio: form.bio.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
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

  return (
    <div className="mx-auto flex max-w-[1440px] pt-16">
      <SideRail />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <UserIcon className="text-[#0ea5e9]" />
            <h1 className="text-2xl font-extrabold text-[#111827]">Account Settings</h1>
          </div>

          <form onSubmit={save} className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6">
            <div className="flex items-center gap-4">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0ea5e9] text-xl font-extrabold text-white">
                  {(form.username || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-sm text-[#6b7280]">{user?.email}</div>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#111827]">Username</span>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
              <span className="mt-1 block text-xs text-[#6b7280]">Lowercase letters, numbers, and underscores.</span>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#111827]">Display Name</span>
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#111827]">Avatar URL</span>
              <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#111827]">Bio</span>
              <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
            </label>

            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0ea5e9] px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60">
              <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>

          <form onSubmit={changePassword} className="mt-6 space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="text-[#0ea5e9]" size={20} />
              <h2 className="text-lg font-extrabold text-[#111827]">Change Password</h2>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#111827]">New Password</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 focus:border-[#0ea5e9] focus:outline-none" />
            </label>
            <button type="submit" disabled={pwSaving} className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-bold text-[#111827] hover:border-[#0ea5e9] disabled:opacity-60">
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-extrabold text-red-800">Sign out</h2>
            <p className="mt-1 text-sm text-red-700">You&apos;ll need to sign back in to access your account.</p>
            <button onClick={signOut} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
