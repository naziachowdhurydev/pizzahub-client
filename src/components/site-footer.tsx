import Link from "next/link";
import { Pizza } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-[#E5E3DC] bg-[#F8F7F3] text-[#172B4D]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-10 sm:flex-row sm:items-center md:px-8">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-black text-[#172B4D]"
          >
            <Pizza className="text-[#F26B4F]" />
            PIZZA
            <span className="text-[#F26B4F]">HUB</span>
          </Link>

          <p className="mt-2 text-sm text-[#64748B]">
            Good times are pizza times.
          </p>
        </div>

        <p className="text-sm text-[#64748B]">
          © {new Date().getFullYear()} PizzaHub. Demo project.
        </p>
      </div>
    </footer>
  );
}
