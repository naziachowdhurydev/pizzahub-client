"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Pizza,
  Menu,
  X,
  UserCircle,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/roles";
import { useCurrentUser } from "@/lib/use-current-user";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";
import { toast } from "sonner";

type CartSummary = {
  itemCount: number;
};

export function SiteHeader() {
  const { data: session, isPending } = authClient.useSession();
  const { user: currentUser, loading: currentUserLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const user = session?.user;
  const userRole = currentUser?.role;
  const isAdmin = userRole === "admin";
  const dashboardHref = userRole ? dashboardPathForRole(userRole) : undefined;
  const dashboardLabel = userRole
    ? `${userRole[0].toUpperCase()}${userRole.slice(1)} Dashboard`
    : "Dashboard";
  const userId = (user as (typeof user & { id?: string }) | null)?.id;

  useEffect(() => {
    let active = true;
    if (isPending || currentUserLoading || !user || userRole !== "customer") return;

    async function refreshCartCount() {
      try {
        const cart = await apiFetch<CartSummary>("/cart");
        if (active) setCartCount(cart.itemCount);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Could not refresh your cart.",
          );
        }
      }
    }

    const handleCartUpdate = () => void refreshCartCount();
    void refreshCartCount();
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    window.addEventListener("focus", handleCartUpdate);

    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
      window.removeEventListener("focus", handleCartUpdate);
    };
  }, [currentUserLoading, isPending, user, userId, userRole]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
  ];

  const handleLogout = async () => {
    await authClient.signOut();
    setOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F26B4F] text-white shadow-sm">
            <Pizza size={25} />
          </span>

          <span className="text-xl font-black tracking-tight text-foreground">
            PIZZA<span className="text-[#F26B4F]">HUB</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground transition hover:text-[#F26B4F]"
            >
              {link.label}
            </Link>
          ))}

          {user && dashboardHref && !isAdmin && (
            <Link
              href={dashboardHref}
              className="text-sm font-semibold text-muted-foreground transition hover:text-[#F26B4F]"
            >
              {dashboardLabel}
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                href="/dashboard/admin"
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-[#F26B4F]"
              >
                <LayoutDashboard size={17} />
                Admin Dashboard
              </Link>
              <Link
                href="/dashboard/vendor"
                className="text-sm font-semibold text-muted-foreground transition hover:text-[#F26B4F]"
              >
                Vendor View
              </Link>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="relative rounded-xl p-2.5 text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingBag size={21} />
            {user && userRole === "customer" && cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#F26B4F] px-1 text-[10px] font-black text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {isPending ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-border bg-muted py-1.5 pl-1.5 pr-4 transition hover:border-[#F26B4F]"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    className="h-8 w-8 rounded-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <UserCircle className="h-8 w-8 text-[#F26B4F]" />
                )}

                <span className="text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                {userRole && (
                  <span className="rounded-full bg-[#F26B4F]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#F26B4F]">
                    {userRole}
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-foreground transition hover:text-[#F26B4F]"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-[#F26B4F] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#D95338]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-foreground transition hover:bg-accent md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-border bg-background px-5 py-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-4">
            <ThemeToggle />
            {links.map((link) => (
              <Link
                onClick={() => setOpen(false)}
                key={link.href}
                href={link.href}
                className="font-semibold text-foreground transition hover:text-[#F26B4F]"
              >
                {link.label}
              </Link>
            ))}

            {user && dashboardHref && !isAdmin && (
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="font-semibold text-foreground hover:text-[#F26B4F]"
              >
                {dashboardLabel}
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/dashboard/admin"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-foreground hover:text-[#F26B4F]"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/dashboard/vendor"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-foreground hover:text-[#F26B4F]"
                >
                  Vendor View
                </Link>
              </>
            )}

            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <ShoppingBag size={18} />
              Shopping Cart{user && userRole === "customer" && cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>

            <div className="border-t border-border pt-4">
              {isPending ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : user ? (
                <div className="flex flex-col gap-4">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="font-semibold text-foreground"
                  >
                    My Profile{userRole ? ` · ${userRole}` : ""}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 font-semibold text-red-600"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="font-semibold text-foreground"
                  >
                    Log in
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="w-fit rounded-xl bg-[#F26B4F] px-5 py-2.5 font-bold text-white"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
