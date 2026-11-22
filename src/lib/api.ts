import type { CurrentUserProfile, Product } from "@/types";
import { isUserRole } from "@/lib/roles";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load products");
  const result = await response.json();
  return result.data as Product[];
}

async function requestProduct(slug: string, token: string): Promise<Product | null> {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load product details");
  const result = await response.json();
  return result.data as Product;
}

async function getJwtToken(): Promise<string> {
  const tokenResult = await (await import("@/lib/auth-client")).authClient.token();
  const token = tokenResult.data?.token;
  if (!token) throw new Error("Please log in to continue.");
  return token;
}

export async function getAuthenticatedProduct(slug: string): Promise<Product | null> {
  return requestProduct(slug, await getJwtToken());
}

export async function getAuthenticatedProducts(): Promise<Product[]> {
  const token = await getJwtToken();
  const response = await fetch(`${API_URL}/products`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to load products");
  const result = await response.json();
  return result.data as Product[];
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getJwtToken();

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

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export async function uploadProfileImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPG, WEBP or GIF image.");
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const image = await readImageAsDataUrl(file);
  const result = await apiFetch<{ url: string }>("/users/me/image", {
    method: "POST",
    body: JSON.stringify({ image }),
  });
  return result.url;
}

export async function getCurrentUser(): Promise<CurrentUserProfile> {
  const profile = await apiFetch<CurrentUserProfile>("/users/me");
  if (!isUserRole(profile.user?.role)) {
    throw new Error("Your account has an unsupported role. Please contact support.");
  }
  return profile;
}
