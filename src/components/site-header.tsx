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
  Settings,
  ChevronDown,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/roles";
import { useCurrentUser } from "@/lib/use-current-user";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const displayName = currentUser?.name ?? user?.name;
  const displayImage = currentUser ? currentUser.image : user?.image;

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

    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    };
  }, [currentUserLoading, isPending, user, userId, userRole]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
  ];

  const handleLogout = async () => {
    await authClient.signOut();
    setOpen(false);
    toast.success("You have been logged out.");
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

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

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
            <span className="hidden text-sm text-muted-foreground md:inline">Loading...</span>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Open profile menu"
                className="group flex min-h-11 items-center gap-2 rounded-full border border-border bg-muted py-1 pl-1 pr-2 transition hover:border-[#F26B4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26B4F]/40 sm:pr-3"
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    className="h-8 w-8 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F26B4F]/10">
                    <UserCircle className="h-7 w-7 text-[#F26B4F]" aria-hidden="true" />
                  </span>
                )}
                <span className="hidden max-w-28 truncate text-sm font-semibold text-foreground sm:block">
                  {displayName}
                </span>
                <ChevronDown
                  className="hidden h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180 sm:block"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="max-w-[calc(100vw-2rem)] p-2"
                style={{ width: "17rem", minWidth: 0 }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          className="h-10 w-10 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F26B4F]/10 text-[#F26B4F]">
                          <UserCircle className="h-6 w-6" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </p>
                        {user.email ? (
                          <p className="truncate text-xs font-normal text-muted-foreground">
                            {user.email}
                          </p>
                        ) : null}
                        {userRole ? (
                          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-[#F26B4F]">
                            {userRole}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  Account
                </p>
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <Settings aria-hidden="true" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/cart" />}>
                  <ShoppingBag aria-hidden="true" />
                  My Cart
                  {userRole === "customer" && cartCount > 0 ? (
                    <span className="ml-auto rounded-full bg-[#F26B4F]/15 px-2 py-0.5 text-[10px] font-bold text-[#F26B4F]">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </DropdownMenuItem>

                {(dashboardHref || isAdmin) && (
                  <>
                    <DropdownMenuSeparator />
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      Workspace
                    </p>
                    {dashboardHref && !isAdmin ? (
                      <DropdownMenuItem render={<Link href={dashboardHref} />}>
                        <LayoutDashboard aria-hidden="true" />
                        {dashboardLabel}
                      </DropdownMenuItem>
                    ) : null}
                    {isAdmin ? (
                      <>
                        <DropdownMenuItem render={<Link href="/dashboard/admin" />}>
                          <LayoutDashboard aria-hidden="true" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/dashboard/vendor" />}>
                          <LayoutDashboard aria-hidden="true" />
                          Vendor View
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut aria-hidden="true" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
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
            </div>
          )}

          <button
            className="rounded-lg p-2 text-foreground transition hover:bg-accent md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
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

            {!isPending && !user ? (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
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
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
