import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DisclaimerModal } from "@/components/DisclaimerModal";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-[#0ea5e9]">404</h1>
        <p className="mt-2 text-[#6b7280]">Page not found</p>
        <a href="/" className="mt-4 inline-block text-sm font-bold text-[#0ea5e9] hover:underline">
          ← Back to MegaFlow
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MegaFlow — Community forum for makers, learners & creators" },
      {
        name: "description",
        content:
          "MegaFlow is a community forum for courses, tutorials, tools, freebies, and discussions. Share resources and grow together.",
      },
      { property: "og:title", content: "MegaFlow — Community forum for makers, learners & creators" },
      { property: "og:description", content: "MegaFlow is a community forum for courses, tutorials, tools, freebies, and discussions. Share resources and grow together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MegaFlow — Community forum for makers, learners & creators" },
      { name: "twitter:description", content: "MegaFlow is a community forum for courses, tutorials, tools, freebies, and discussions. Share resources and grow together." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ef97cbb-94b7-43c3-8122-6cf1f2b1d204/id-preview-2c5aab30--d9c2d13b-cef5-4339-a608-e6211bd7f592.lovable.app-1783772064020.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ef97cbb-94b7-43c3-8122-6cf1f2b1d204/id-preview-2c5aab30--d9c2d13b-cef5-4339-a608-e6211bd7f592.lovable.app-1783772064020.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex-1 pt-16">
          <Outlet />
        </div>
        <Footer />
      </div>
      <DisclaimerModal />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
