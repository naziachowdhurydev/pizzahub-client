"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { apiFetch, getCurrentUser } from "@/lib/api";
import { normalizeOptionalImageUrl } from "@/lib/image-url";
import { dashboardPathForRole } from "@/lib/roles";
import { useCurrentUser } from "@/lib/use-current-user";
import { Pizza, Mail, Lock, User, ArrowRight } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.08v2.58A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.5H3.08a10 10 0 0 0 0 9l3.33-2.58Z" />
      <path fill="#EA4335" d="M12 6.05c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.5l3.33 2.58C7.2 7.8 9.4 6.05 12 6.05Z" />
    </svg>
  );
}

function isRouteAllowedForRole(pathname: string, role: "customer" | "vendor" | "admin"): boolean {
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
      pathname === "/cart" ||
      pathname.startsWith("/cart") ||
      pathname === "/checkout" ||
      pathname.startsWith("/checkout") ||
      pathname === "/payment" ||
      pathname.startsWith("/payment")
    );
  }
  return false;
}

export function AuthForm({
  mode,
  callbackUrl,
}: {
  mode: "login" | "register";
  callbackUrl?: string;
}) {
  const router = useRouter();
  const { user: alreadyLoggedInUser, loading: sessionLoading } = useCurrentUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [signupRole, setSignupRole] = useState<"customer" | "vendor">("customer");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const isRegister = mode === "register";

  // If user is already logged in, redirect them away from login/register to their dashboard
  useEffect(() => {
    if (!sessionLoading && alreadyLoggedInUser) {
      router.replace(dashboardPathForRole(alreadyLoggedInUser.role));
    }
  }, [alreadyLoggedInUser, sessionLoading, router]);

  async function signInWithGoogle() {
    if (googleBusy || busy) return;
    setGoogleBusy(true);
    try {
      const origin = window.location.origin;
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${origin}/profile`,
        newUserCallbackURL: `${origin}/profile`,
        errorCallbackURL: `${origin}${isRegister ? "/register" : "/login"}`,
      });

      if (result?.error) {
        throw new Error(result.error.message || "Google sign-in failed.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not continue with Google.",
      );
    } finally {
      setGoogleBusy(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    let authenticationCompleted = false;
    let accountCreated = false;

    try {
      if (isRegister) {
        const customImage = normalizeOptionalImageUrl(imageUrl);
        const image =
          customImage ??
          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

        const result = await authClient.signUp.email({
          name,
          email,
          password,
          image,
        });

        if (result.error) {
          throw new Error(result.error.message || "Registration failed");
        }
        accountCreated = true;
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          throw new Error(result.error.message || "Login failed");
        }
      }

      authenticationCompleted = true;
      const { user } = await getCurrentUser();
      if (isRegister && signupRole === "vendor") {
        try {
          await apiFetch("/vendors/apply", {
            method: "POST",
            body: JSON.stringify({ storeName, description: storeDescription }),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Vendor application failed.";
          toast.error(`Your account was created as a customer, but we couldn't submit the vendor application: ${message}`);
          router.push(dashboardPathForRole(user.role));
          router.refresh();
          return;
        }
        toast.success("Account created. Your vendor application is pending review.");
      } else {
        toast.success(isRegister ? "Account created. Welcome to PizzaHub!" : "Welcome back!");
      }

      // Check whether destination callbackUrl is permitted for user's actual database role
      let targetUrl = dashboardPathForRole(user.role);
      if (
        !isRegister &&
        callbackUrl &&
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//") &&
        !callbackUrl.includes("\\")
      ) {
        const urlPath = callbackUrl.split("?")[0];
        if (isRouteAllowedForRole(urlPath, user.role)) {
          targetUrl = callbackUrl;
        }
      }

      router.push(targetUrl);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(
        accountCreated && signupRole === "vendor"
          ? `Your account was created as a customer, but we couldn't submit the vendor application: ${message}`
          : accountCreated
            ? `Your account was created, but we couldn't load its role: ${message}`
            : authenticationCompleted
              ? `You were signed in, but we couldn't load your account role: ${message}`
              : message,
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15";

  return (
    <section className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-card-foreground shadow-xl sm:p-9">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#F26B4F] text-white shadow-lg shadow-[#F26B4F]/20">
          <Pizza size={30} />
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F26B4F]">
          PizzaHub Account
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {isRegister ? "Create your account" : "Welcome back!"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isRegister
            ? "Join PizzaHub and order your favourite slices."
            : "Log in and we’ll take you to the dashboard assigned to your account."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {isRegister && (
          <label className="block text-sm font-semibold">
            Full name
            <div className="relative">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Enter your name"
              />
            </div>
          </label>
        )}

        {isRegister && (
          <label className="block text-sm font-semibold">
            Profile image URL <span className="font-normal text-muted-foreground">(optional)</span>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15"
              placeholder="https://example.com/avatar.jpg"
            />
          </label>
        )}

        {isRegister && (
          <>
            <label className="block text-sm font-semibold">
              I’m here as
              <select
                value={signupRole}
                onChange={(event) =>
                  setSignupRole(event.currentTarget.value === "vendor" ? "vendor" : "customer")
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15"
              >
                <option value="customer">A pizza lover (Customer)</option>
                <option value="vendor">A pizzeria owner (Vendor applicant)</option>
              </select>
            </label>
            {signupRole === "vendor" && (
              <div className="grid gap-4 rounded-2xl border border-[#F26B4F]/20 bg-[#F26B4F]/5 p-4">
                <label className="block text-sm font-semibold">
                  Store name
                  <input
                    required
                    maxLength={100}
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal text-foreground outline-none focus:border-[#F26B4F]"
                    placeholder="Your pizzeria name"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  About your store
                  <textarea
                    required
                    maxLength={1000}
                    rows={3}
                    value={storeDescription}
                    onChange={(event) => setStoreDescription(event.target.value)}
                    className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-normal text-foreground outline-none focus:border-[#F26B4F]"
                    placeholder="Tell us what you make"
                  />
                </label>
                <p className="text-xs leading-5 text-muted-foreground">
                  Your account stays a customer account until an admin approves your vendor application.
                </p>
              </div>
            )}
          </>
        )}

        <label className="block text-sm font-semibold">
          Email address
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="block text-sm font-semibold">
          Password
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={busy || googleBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F26B4F] py-3.5 font-bold text-white shadow-lg shadow-[#F26B4F]/15 transition hover:bg-[#E85C40] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Please wait..." : isRegister ? "Create account" : "Log in"}

          {!busy && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={busy || googleBusy}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3.5 font-bold text-foreground transition hover:border-[#F26B4F] hover:text-[#F26B4F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {googleBusy
            ? "Connecting..."
            : isRegister
              ? "Sign up with Google"
              : "Continue with Google"}
        </button>
      </div>

      <div className="my-6 border-t border-border" />

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "New to PizzaHub?"}{" "}
        <Link
          className="font-bold text-[#F26B4F] transition hover:text-[#E85C40]"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Log in" : "Create account"}
        </Link>
      </p>
      {isRegister && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Admin access is reserved and cannot be created through public registration.
        </p>
      )}
    </section>
  );
}
