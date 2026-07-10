import { Heart } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[#e5e7eb] bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0ea5e9] text-white">
            <Heart size={16} fill="currentColor" />
          </div>
          <p className="text-sm font-semibold text-[#111827]">MegaFlow</p>
        </div>
        <p className="text-sm text-[#6b7280]">© {year} MegaFlow. All rights reserved.</p>
      </div>
    </footer>
  );
}
