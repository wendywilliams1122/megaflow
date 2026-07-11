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
};


export type AppRole = "admin" | "moderator" | "user";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = (userId: string) => {
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, reputation, is_banned")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => setRoles((data ?? []).map((r) => r.role as AppRole)));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
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
