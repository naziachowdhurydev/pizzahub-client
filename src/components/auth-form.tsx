"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getCurrentUser } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/roles";
import { Pizza, Mail, Lock, User, ArrowRight } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    let authenticationCompleted = false;

    try {
      if (isRegister) {
        const image = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

        const result = await authClient.signUp.email({
          name,
          email,
          password,
          image,
        });

        if (result.error) {
          throw new Error(result.error.message || "Registration failed");
        }
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
      toast.success(isRegister ? "Account created. Welcome to PizzaHub!" : "Welcome back!");
      router.push(dashboardPathForRole(user.role));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(
        authenticationCompleted
          ? `${isRegister ? "Your account was created" : "You were signed in"}, but we couldn't load your account role: ${message}`
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
            : "Log in to continue enjoying your favourite pizza."}
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
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F26B4F] py-3.5 font-bold text-white shadow-lg shadow-[#F26B4F]/15 transition hover:bg-[#E85C40] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Please wait..." : isRegister ? "Create account" : "Log in"}

          {!busy && <ArrowRight size={18} />}
        </button>
      </form>

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
    </section>
  );
}
