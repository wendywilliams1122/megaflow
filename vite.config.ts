// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // When building outside Lovable (e.g. on Netlify CI), pin the Nitro preset
  // to `netlify` so the output is a ready-to-deploy Netlify site with
  // functions. Inside Lovable's own build, this override is ignored and the
  // Cloudflare preset is used — so the live preview and lovable.app deploy
  // are unaffected.
  nitro: {
    preset: process.env.NETLIFY ? "netlify" : "cloudflare-module",
  },
});
