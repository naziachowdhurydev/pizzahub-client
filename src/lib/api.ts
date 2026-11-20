import type { CurrentUserProfile, Product } from "@/types";
import { isUserRole } from "@/lib/roles";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load products");
  const result = await response.json();
  return result.data as Product[];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load product details");
  const result = await response.json();
  return result.data as Product;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokenResult = await (await import("@/lib/auth-client")).authClient.token();
  const token = tokenResult.data?.token;
  if (!token) throw new Error("Please log in to continue.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    cache: "no-store",
    credentials: "include",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Request failed");
  return result.data as T;
}

export async function getCurrentUser(): Promise<CurrentUserProfile> {
  const profile = await apiFetch<CurrentUserProfile>("/users/me");
  if (!isUserRole(profile.user?.role)) {
    throw new Error("Your account has an unsupported role. Please contact support.");
  }
  return profile;
}
