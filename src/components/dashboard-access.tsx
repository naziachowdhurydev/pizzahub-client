"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-5 text-muted-foreground">
        Loading your dashboard...
      </main>
    );
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
          <p className="mt-3 text-muted-foreground">Your dashboard is available after you log in.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (user.role !== role) {
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
