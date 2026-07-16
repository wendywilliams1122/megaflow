import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  reputation: number;
  points?: number;
  trust_score?: number;
  warnings?: number;
  referral_code?: string | null;
  ban_reason?: string | null;
  is_banned?: boolean;
  username_customized?: boolean;
};


export type AppRole = "admin" | "moderator" | "user";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = (userId: string) => {
    (async () => {
      const [{ data: p }, { data: mod }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, reputation, points, trust_score, referral_code, is_banned, force_reauth_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("profile_moderation")
          .select("ban_reason, warnings")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (p) {
        // Admin-triggered force sign-out
        const forceAt = (p as any).force_reauth_at ? Date.parse((p as any).force_reauth_at) : 0;
        const { data: { session: cur } } = await supabase.auth.getSession();
        const sessAt = cur?.user?.created_at ? Date.parse(cur.user.created_at) : Date.now();
        // Use last sign-in when available
        const signedInAt = (cur as any)?.user?.last_sign_in_at ? Date.parse((cur as any).user.last_sign_in_at) : sessAt;
        if (forceAt && forceAt > signedInAt) {
          await supabase.auth.signOut();
          setProfile(null);
          return;
        }
        setProfile({ ...(p as Profile), ban_reason: mod?.ban_reason ?? null, warnings: mod?.warnings ?? 0 });
      } else {
        setProfile(null);
      }
    })();
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => setRoles((data ?? []).map((r) => r.role as AppRole)));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
        if (evt === "SIGNED_IN") {
          setTimeout(async () => {
            let ip: string | null = null;
            try { ip = (await (await fetch("https://api.ipify.org?format=json")).json()).ip ?? null; } catch { /* ignore */ }
            const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
            try { await (supabase as any).rpc("log_session_device", { _ip: ip, _user_agent: ua }); } catch { /* ignore */ }
          }, 0);
        }
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadUserData(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isModerator = roles.includes("moderator") || isAdmin;

  return { session, user, profile, roles, isAdmin, isModerator, loading };
}
