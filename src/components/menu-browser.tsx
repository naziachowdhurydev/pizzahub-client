"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/types";
import { ProductGrid } from "@/components/product-grid";

type SortOption = "featured" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function MenuBrowser({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return ["all", ...values];
  }, [products]);

  const filtered = useMemo(() => {
    const needle = normalize(search);
    const items = products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      if (!matchesCategory) return false;
      if (!needle) return true;
      const haystack = [product.name, product.description, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    items.sort((a, b) => {
      switch (sort) {
        case "price_asc":
          return a.price - b.price || a.name.localeCompare(b.name);
        case "price_desc":
          return b.price - a.price || a.name.localeCompare(b.name);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "featured":
        default: {
          const rankA = (a.vendorPlan === "premium" ? 3 : 0) + (a.isFeatured ? 1 : 0);
          const rankB = (b.vendorPlan === "premium" ? 3 : 0) + (b.isFeatured ? 1 : 0);
          return rankB - rankA || a.name.localeCompare(b.name);
        }
      }
    });

    return items;
  }, [products, search, sort, category]);

  const hasActiveFilters = search.trim() !== "" || sort !== "featured" || category !== "all";

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pizzas by name, description, or category..."
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/20"
              aria-label="Search menu items"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative sm:min-w-44">
              <span className="sr-only">Filter by category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/20"
              >
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value === "all" ? "All categories" : value}
                  </option>
                ))}
              </select>
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </label>

            <label className="relative sm:min-w-52">
              <span className="sr-only">Sort menu items</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            <span className="font-semibold text-foreground">{products.length}</span> items
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSort("featured");
                setCategory("all");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-[#F26B4F] transition hover:bg-[#F26B4F]/10"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {filtered.length > 0 ? (
          <ProductGrid products={filtered} />
        ) : (
          <p className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            No pizzas match your search. Try a different keyword or clear filters.
          </p>
        )}
      </div>
    </div>
  );
}
