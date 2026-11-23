"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/skeletons";
import { getCurrentUser } from "@/lib/api";
import { dashboardPathForRole, isRouteAllowedForRole, safeRelativePath } from "@/lib/roles";

export default function GoogleAuthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function resolveDestination() {
      try {
        const { user } = await getCurrentUser();
        if (!active) return;

        const requestedNext = safeRelativePath(
          new URLSearchParams(window.location.search).get("next"),
        );
        const pathname = requestedNext?.split("?")[0] ?? "";
        const target =
          requestedNext && isRouteAllowedForRole(pathname, user.role)
            ? requestedNext
            : dashboardPathForRole(user.role);

        toast.success("Signed in with Google.");
        router.replace(target);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Could not finish Google sign-in.");
        router.replace("/login");
      }
    }

    void resolveDestination();
    return () => {
      active = false;
    };
  }, [router]);

  return <DashboardSkeleton label="Finishing Google sign-in..." />;
}
