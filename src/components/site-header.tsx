"use client";

import Link from "next/link";
import { useState } from "react";
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

export function SiteHeader() {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user;
  const isAdmin =
    (user as (typeof user & { role?: string }) | null)?.role === "admin";

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

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-[#F26B4F]"
            >
              <LayoutDashboard size={17} />
              Admin
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="rounded-xl p-2.5 text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingBag size={21} />
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

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="font-semibold text-foreground hover:text-[#F26B4F]"
              >
                Admin Dashboard
              </Link>
            )}

            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <ShoppingBag size={18} />
              Shopping Cart
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
                    My Profile
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
