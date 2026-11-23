import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

function SkeletonStatus({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="w-full">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkeletonStatus label="Loading products...">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <Skeleton className="h-44 w-full rounded-none sm:h-56" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonStatus>
  );
}

export function ListSkeleton({
  rows = 3,
  label = "Loading items...",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <SkeletonStatus label={label}>
      <div className="mt-6 grid gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="w-full space-y-3 sm:w-2/3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonStatus>
  );
}

export function DashboardSkeleton({ label = "Loading dashboard..." }: { label?: string }) {
  return (
    <SkeletonStatus label={label}>
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-10 w-72 max-w-full" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="h-fit rounded-2xl border border-border bg-card p-3">
            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonStatus>
  );
}

export function CartSkeleton({ label = "Loading your cart..." }: { label?: string }) {
  return (
    <SkeletonStatus label={label}>
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-56 max-w-full" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
                <div className="w-full space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-fit rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-32" />
            <div className="mt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="mt-8 h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonStatus>
  );
}

export function CheckoutSkeleton({ label = "Loading checkout..." }: { label?: string }) {
  return (
    <SkeletonStatus label={label}>
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-10 w-64 max-w-full" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6">
            <Skeleton className="h-6 w-36" />
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
            <Skeleton className="mt-4 h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonStatus>
  );
}

export function ProfileSkeleton() {
  return (
    <SkeletonStatus label="Loading profile...">
      <div className="mx-auto max-w-4xl px-5 py-20">
        <Skeleton className="h-10 w-64 max-w-full" />
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonStatus>
  );
}
