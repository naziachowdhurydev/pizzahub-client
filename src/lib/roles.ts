import type { UserRole } from "@/types";

export function isUserRole(role: unknown): role is UserRole {
  return role === "customer" || role === "vendor" || role === "admin";
}

export function dashboardPathForRole(role: unknown): string {
  if (!isUserRole(role)) {
    throw new Error("Your account has an unsupported role. Please contact support.");
  }

  return `/dashboard/${role}`;
}

/** Only allow same-origin relative paths; block protocol-relative and encoded tricks. */
export function safeRelativePath(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || trimmed.includes("://")) return null;
  return trimmed;
}

export function isRouteAllowedForRole(pathname: string, role: UserRole): boolean {
  if (pathname === "/" || pathname.startsWith("/menu") || pathname.startsWith("/profile")) {
    return true;
  }
  if (role === "admin") {
    return true;
  }
  if (role === "vendor") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")) {
      return false;
    }
    return pathname.startsWith("/dashboard/vendor");
  }
  if (role === "customer") {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/vendor")
    ) {
      return false;
    }
    return (
      pathname.startsWith("/dashboard/customer") ||
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/payment")
    );
  }
  return false;
}
