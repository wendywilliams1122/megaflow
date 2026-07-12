import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const [{ data: threads }, { data: cats }] = await Promise.all([
          supabase.from("threads").select("slug, updated_at").order("last_activity_at", { ascending: false }).limit(2000),
          supabase.from("categories").select("slug"),
        ]);

        const staticPaths = ["", "/categories", "/leaderboard", "/best-members", "/marketplace", "/rules", "/about", "/contact", "/support"];
        const urls: string[] = [];
        for (const p of staticPaths) urls.push(`<url><loc>${origin}${p}</loc></url>`);
        for (const c of cats ?? []) urls.push(`<url><loc>${origin}/c/${c.slug}</loc></url>`);
        for (const t of threads ?? []) {
          urls.push(
            `<url><loc>${origin}/t/${t.slug}</loc>${t.updated_at ? `<lastmod>${new Date(t.updated_at).toISOString()}</lastmod>` : ""}</url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" } });
      },
    },
  },
});
