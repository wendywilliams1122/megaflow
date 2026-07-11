import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  brand_name: string;
  whatsapp_number: string | null;
  contact_email: string | null;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("brand_name, whatsapp_number, contact_email")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return (
        data ?? { brand_name: "MegaFlow", whatsapp_number: null, contact_email: null }
      );
    },
    staleTime: 60_000,
  });
}
