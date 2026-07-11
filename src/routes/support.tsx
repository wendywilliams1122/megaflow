import { createFileRoute } from "@tanstack/react-router";
import { SupportPanel } from "@/components/generated/SupportPanel";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support - MegaFlow" },
      { name: "description", content: "Support tickets and help center for MegaFlow." },
    ],
  }),
  component: SupportPanel,
});
