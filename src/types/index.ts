export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  image: string;
  sizes: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  vendorId?: string | null;
  ingredients?: string[];
  allergens?: string[];
  preparationTime?: string;
  vendorName?: string;
  vendorPlan?: "free" | "premium";
};

export type UserRole = "customer" | "vendor" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  status?: "active" | "suspended";
  vendorStatus?: "not_applied" | "pending" | "approved" | "rejected";
  vendorAppliedAt?: string;
  vendorApprovedAt?: string;
  plan?: "free" | "premium";
};

export type CurrentUserProfile = {
  user: CurrentUser;
  session: {
    id: string;
    expiresAt: string;
    createdAt: string;
    updatedAt?: string;
  } | null;
};
