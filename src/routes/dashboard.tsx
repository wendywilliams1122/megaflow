import { createFileRoute } from "@tanstack/react-router";
import { RealDashboard } from "@/components/RealDashboard";
import { ReferralPointsCard } from "@/components/ReferralPointsCard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - MegaFlow" },
      { name: "description", content: "Your personal MegaFlow dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <>
      <ReferralPointsCard />
      <RealDashboard />
    </>
  ),
});

