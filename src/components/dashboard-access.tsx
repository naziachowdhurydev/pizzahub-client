"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/skeletons";
import { dashboardPathForRole } from "@/lib/roles";
import { useCurrentUser } from "@/lib/use-current-user";

type DashboardRole = "customer" | "vendor" | "admin";

export function DashboardAccess({
  role,
  children,
}: {
  role: DashboardRole;
  children: ReactNode;
}) {
  const { user, loading, error, retry } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const callbackUrl = encodeURIComponent(pathname);
      router.replace(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <DashboardSkeleton label="Verifying your dashboard access..." />;
  }

  if (error) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">We couldn’t verify your account</h1>
          <p role="alert" className="mt-3 text-muted-foreground">{error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-6 rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">Sign in to continue</h1>
          <p className="mt-3 text-muted-foreground">Redirecting to login...</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="mt-6 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white"
          >
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (
    role === "vendor" &&
    user.role === "vendor" &&
    user.vendorStatus !== "approved"
  ) {
    const applicationStatus = user.vendorStatus ?? "not_applied";
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">Vendor approval required</h1>
          <p className="mt-3 text-muted-foreground">
            Your vendor application is {applicationStatus.replaceAll("_", " ")}.
            Order management becomes available after an administrator approves your account.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl border border-border px-5 py-3 font-semibold"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const hasAccess = user.role === role || (role === "vendor" && user.role === "admin");
  if (!hasAccess) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">This dashboard isn’t available to your account</h1>
          <p className="mt-3 text-muted-foreground">
            Your account role is {user.role}. Contact an administrator if this is incorrect.
          </p>
          <Link
            href={dashboardPathForRole(user.role)}
            className="mt-6 inline-flex rounded-xl border border-border px-5 py-3 font-semibold"
          >
            Go to my dashboard
          </Link>
        </div>
      </main>
    );
  }

  return children;
}
