import { createFileRoute } from "@tanstack/react-router";
import { UserDashboard } from "@/components/generated/UserDashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MegaFlow" },
      { name: "description", content: "Your personal MegaFlow dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UserDashboard,
});
