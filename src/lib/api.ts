import type { Product } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load products");
  const result = await response.json();
  return result.data as Product[];
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
