import { createFileRoute } from "@tanstack/react-router";
import { CategoriesExplorer } from "@/components/generated/CategoriesExplorer";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — MegaFlow" },
      { name: "description", content: "Browse every discussion area on MegaFlow." },
      { property: "og:title", content: "Categories — MegaFlow" },
      { property: "og:description", content: "Browse every discussion area on MegaFlow." },
    ],
  }),
  component: CategoriesExplorer,
});
