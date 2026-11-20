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
