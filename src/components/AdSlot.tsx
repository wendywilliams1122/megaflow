import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

export type AdRow = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  placement: string;
};

export function useAds(placement: "home" | "thread") {
  return useQuery({
    queryKey: ["ads", placement],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("advertisements")
        .select("id, title, image_url, link_url, placement")
        .eq("is_active", true)
        .in("placement", [placement, "both"])
        .order("sort_order", { ascending: true });
      return (data ?? []) as AdRow[];
    },
    staleTime: 60_000,
  });
}

export function AdCard({ ad }: { ad: AdRow }) {
  const inner = (
    <div className="group overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-1.5 border-b border-amber-100 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
        <Megaphone size={12} /> Sponsored
      </div>
      <img
        src={ad.image_url}
        alt={ad.title || "Advertisement"}
        className="block w-full object-cover transition-transform group-hover:scale-[1.01]"
        loading="lazy"
      />
      {ad.title && (
        <div className="px-4 py-2 text-sm font-bold text-[#111827]">{ad.title}</div>
      )}
    </div>
  );
  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
