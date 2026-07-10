import { createFileRoute } from "@tanstack/react-router";
import { ForumRulesPage } from "@/components/generated/ForumRulesPage";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Forum Rules — MegaFlow" },
      { name: "description", content: "Community guidelines and posting rules for MegaFlow." },
      { property: "og:title", content: "Forum Rules — MegaFlow" },
      { property: "og:description", content: "Community guidelines and posting rules for MegaFlow." },
    ],
  }),
  component: ForumRulesPage,
});
