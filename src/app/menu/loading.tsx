import { ProductGridSkeleton } from "@/components/skeletons";

export default function MenuLoading() {
  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-14 md:px-8">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-10 w-56 rounded bg-muted" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-muted" />
      </div>
      <div className="mt-9">
        <ProductGridSkeleton />
      </div>
    </main>
  );
}
