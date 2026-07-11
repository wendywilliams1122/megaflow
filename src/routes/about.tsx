import { createFileRoute } from "@tanstack/react-router";
import { Heart, Users, Sparkles, Shield } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — MegaFlow" },
      { name: "description", content: "Learn about MegaFlow — our mission, community values, and the team behind the forum." },
      { property: "og:title", content: "About Us — MegaFlow" },
      { property: "og:description", content: "About the MegaFlow community." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const values = [
    { icon: Users, title: "Community First", text: "Every feature we build is chosen by and for our members." },
    { icon: Sparkles, title: "Quality Discussions", text: "Focused, respectful, and useful — always." },
    { icon: Shield, title: "Safe & Moderated", text: "Clear rules, active staff, and zero tolerance for spam." },
    { icon: Heart, title: "Made With Love", text: "A small team obsessed with member experience." },
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-[#111827]">About MegaFlow</h1>
      <p className="mt-3 max-w-2xl text-[#6b7280]">
        MegaFlow is a community-driven forum where enthusiasts, professionals, and learners share
        knowledge, trade resources, and help each other grow. We combine a modern discussion
        experience with a curated marketplace for community-made products.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {values.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <Icon className="text-[#0ea5e9]" />
            <h3 className="mt-3 font-bold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm text-[#6b7280]">{text}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="text-xl font-extrabold text-[#111827]">Our Story</h2>
        <p className="mt-3 text-sm leading-7 text-[#6b7280]">
          MegaFlow started as a small group of friends looking for a friendlier place to talk shop.
          Today we host thousands of discussions across dozens of categories, moderated by a
          dedicated staff team and powered by an ever-growing community of contributors.
        </p>
      </section>
    </div>
  );
}
