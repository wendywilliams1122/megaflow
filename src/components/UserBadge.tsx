type Props = {
  points?: number | null;
  staffBadge?: string | null;
  isBanned?: boolean | null;
  className?: string;
};

type Rank = { label: string; className: string };

function rankFor({ staffBadge, points, isBanned }: Props): Rank {
  if (isBanned) return { label: "Banned", className: "bg-red-100 text-red-700" };
  if (staffBadge === "admin") return { label: "Admin", className: "bg-purple-100 text-purple-700" };
  if (staffBadge === "moderator") return { label: "Moderator", className: "bg-indigo-100 text-indigo-700" };
  const p = points ?? 0;
  if (p >= 1000) return { label: "Legend", className: "bg-amber-100 text-amber-800" };
  if (p >= 500) return { label: "Trusted Contributor", className: "bg-emerald-100 text-emerald-700" };
  if (p >= 100) return { label: "Trusted User", className: "bg-sky-100 text-sky-700" };
  if (p >= 20) return { label: "Member", className: "bg-slate-100 text-slate-700" };
  return { label: "New User", className: "bg-zinc-100 text-zinc-600" };
}

export function UserBadge(props: Props) {
  const r = rankFor(props);
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${r.className} ${props.className ?? ""}`}
    >
      {r.label}
    </span>
  );
}
