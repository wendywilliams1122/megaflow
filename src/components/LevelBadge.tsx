import { Zap } from "lucide-react";

export function levelFor(points: number | null | undefined): number {
  const p = Math.max(0, points ?? 0);
  return Math.max(1, Math.floor(Math.sqrt(p / 10)) + 1);
}

export function pointsForLevel(level: number): number {
  return Math.pow(Math.max(1, level) - 1, 2) * 10;
}

export function LevelBadge({ points, className = "" }: { points: number | null | undefined; className?: string }) {
  const lvl = levelFor(points);
  const cur = points ?? 0;
  const next = pointsForLevel(lvl + 1);
  const prev = pointsForLevel(lvl);
  const pct = Math.min(100, Math.round(((cur - prev) / Math.max(1, next - prev)) * 100));
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
        <Zap size={10} /> Lv {lvl}
      </span>
      <div className="hidden sm:block">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div className="h-full bg-gradient-to-r from-[#0ea5e9] to-[#6366f1]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-0.5 text-[10px] text-[#6b7280]">{cur} / {next} pts</div>
      </div>
    </div>
  );
}
