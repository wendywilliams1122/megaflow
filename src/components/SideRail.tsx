import { SideNav } from "./SideNav";

export function SideRail() {
  return (
    <aside className="hidden w-[260px] flex-shrink-0 border-r border-[#e5e7eb] bg-white lg:block">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain px-5 py-6">
        <SideNav />
      </div>
    </aside>
  );
}
