import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Waves, Plus, LogOut, User as UserIcon } from "lucide-react";

export function Header() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <Waves className="h-4 w-4" />
          </span>
          <span className="brand-text">ShareFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New thread
              </Link>
              {profile && (
                <Link
                  to="/u/$username"
                  params={{ username: profile.username }}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm hover:bg-accent"
                >
                  <div className="brand-gradient flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{profile.username}</span>
                </Link>
              )}
              <button
                onClick={signOut}
                title="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <UserIcon className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
