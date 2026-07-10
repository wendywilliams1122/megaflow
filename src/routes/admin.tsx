import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/generated/AdminPanel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — MegaFlow" },
      { name: "description", content: "Administration dashboard for MegaFlow." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});
