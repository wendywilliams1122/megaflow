import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { Search, Shield, FileText, LogIn, LogOut, Menu, Plus, ShoppingBag, ShoppingCart, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SideNav } from "@/components/SideNav";
import { NotificationBell } from "@/components/NotificationBell";
import megaflowLogo from "@/assets/megaflow-logo.png";



export function Header() {
  const { user, profile, isAdmin, isModerator } = useAuth();
  const { count: cartCount, hydrated: cartHydrated } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);


  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate({ to: "/", search: q ? { q } : { q: undefined } });
  };


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:hidden" aria-label="Open navigation">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto bg-white p-5 sm:w-[340px]">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle className="text-base font-extrabold text-[#111827]">Menu</SheetTitle>
              </SheetHeader>
              <SideNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center rounded-lg" aria-label="MegaFlow home">
            <img src={megaflowLogo} alt="MegaFlow" className="h-11 w-auto object-contain sm:h-12" />
          </Link>
        </div>

        <form onSubmit={onSearch} className="hidden flex-1 justify-center md:flex">
          <label className="relative w-full max-w-xl">
            <span className="sr-only">Search discussions</span>
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6b7280]">
              <Search size={18} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6b7280] hover:border-sky-200 focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              placeholder="Search discussions…"
            />
          </label>
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link to="/rules" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:flex">
            <Shield size={16} /> <span>Rules</span>
          </Link>
          <Link to="/categories" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:flex">
            <FileText size={16} /> <span>Categories</span>
          </Link>
          <Link to="/marketplace" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f6f7f8] hover:text-[#111827] lg:flex">
            <ShoppingBag size={16} /> <span>Marketplace</span>
          </Link>
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
            aria-label="Cart"
          >
            <ShoppingCart size={16} />
            {cartHydrated && cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0ea5e9] px-1 text-[10px] font-extrabold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {user && <NotificationBell />}
          {isModerator && (
            <Link to="/admin" className="hidden items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-sm font-bold text-red-700 hover:bg-red-100 lg:flex">
              <Shield size={16} /> <span>{isAdmin ? "Admin" : "Staff"}</span>
            </Link>
          )}

          {user ? (
            <>
              <Link
                to="/new"
                className="flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 sm:px-4"
              >
                <Plus size={16} /> <span className="hidden sm:inline">New</span>
              </Link>
              {profile && (
                <Link
                  to="/u/$username"
                  params={{ username: profile.username }}
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm font-semibold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0ea5e9] text-[10px] font-extrabold text-white">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{profile.username}</span>
                </Link>
              )}
              <button
                onClick={signOut}
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#0ea5e9] hover:text-[#0ea5e9]"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="flex h-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#111827] hover:border-[#0ea5e9] hover:text-[#0ea5e9] sm:px-4"
              >
                <LogIn size={16} className="sm:hidden" />
                <span className="hidden sm:inline">Log In</span>
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-lg bg-[#0ea5e9] px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-100 hover:bg-sky-600 sm:px-4"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      {user && profile && profile.username_customized === false && (
        <div className="border-t border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-2 px-4 py-2 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-700" />
              <span className="font-semibold">
                Bhai pehlay apna username fix karro — abhi <span className="font-extrabold">@{profile.username}</span> auto-generated hai.
              </span>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-amber-700"
            >
              Set username
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
