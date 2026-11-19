"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

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
    try {
      if (isRegister) {
        const image = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          image,
        });
        if (result.error)
          throw new Error(result.error.message || "Registration failed");
        toast.success("Account created. Welcome to PizzaHub!");
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error)
          throw new Error(result.error.message || "Login failed");
        toast.success("Welcome back!");
      }
      router.push("/profile");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#191919] p-7 shadow-2xl shadow-black/30 sm:p-9">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
          PizzaHub account
        </p>
        <h1 className="mt-2 text-3xl font-black">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          {isRegister
            ? "Sign up to order your favourite slices."
            : "Log in to continue to your account."}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        {isRegister && (
          <label className="block text-sm font-semibold">
            Full name
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Your name"
            />
          </label>
        )}
        <label className="block text-sm font-semibold">
          Email address
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 outline-none focus:border-orange-500"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 outline-none focus:border-orange-500"
            placeholder="At least 8 characters"
          />
        </label>
        <button
          disabled={busy}
          className="w-full rounded-xl bg-orange-500 py-3.5 font-black text-black transition hover:bg-orange-400 disabled:opacity-60"
        >
          {busy ? "Please wait..." : isRegister ? "Create account" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-400">
        {isRegister ? "Already have an account?" : "New to PizzaHub?"}{" "}
        <Link
          className="font-bold text-orange-400 hover:text-orange-300"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Log in" : "Create account"}
        </Link>
      </p>
    </section>
  );
}
