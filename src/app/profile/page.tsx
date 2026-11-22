"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { UserRound, ShieldCheck, CalendarDays } from "lucide-react";

type Profile = { user: { id: string; name: string; email: string; image?: string | null; role?: string }; session: { id: string; expiresAt: string; createdAt: string; updatedAt?: string } | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch<Profile>("/users/me").then(setProfile).catch((e: Error) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);
  async function logout() {
    await authClient.signOut();
    toast.success("You have been logged out.");
    window.location.href = "/";
  }
  if (loading) return <main className="mx-auto max-w-4xl px-5 py-20 text-muted-foreground">Loading profile...</main>;
  if (!profile) return <main className="mx-auto max-w-4xl px-5 py-20"><h1 className="text-3xl font-black">Sign in to view your profile</h1><a className="mt-5 inline-block text-orange-400" href="/login">Go to login →</a></main>;
  const { user, session } = profile;
  return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-14">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">Your account</p><h1 className="mt-2 text-4xl font-black">My profile</h1>
    <section className="mt-8 rounded-3xl border border-border bg-card p-7">
      <div className="flex flex-wrap items-center gap-5">
        {user.image ? <img src={user.image} alt={user.name} className="h-20 w-20 rounded-full object-cover"/> : <div className="grid h-20 w-20 place-items-center rounded-full bg-orange-500/15 text-orange-400"><UserRound size={34}/></div>}
        <div><h2 className="text-2xl font-bold">{user.name}</h2><p className="mt-1 text-muted-foreground">{user.email}</p><span className="mt-3 inline-flex rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase text-orange-400">{user.role || "customer"}</span></div>
      </div>
      <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
        <div className="flex gap-3"><ShieldCheck className="text-orange-400"/><div><p className="text-xs text-muted-foreground">Session ID</p><p className="break-all text-sm">{session?.id ?? "No active session"}</p></div></div>
        <div className="flex gap-3"><CalendarDays className="text-orange-400"/><div><p className="text-xs text-muted-foreground">Session expires</p><p className="text-sm">{session ? new Date(session.expiresAt).toLocaleString() : "N/A"}</p></div></div>
      </div>
      <button onClick={logout} className="mt-8 rounded-xl border border-red-500/30 px-5 py-3 font-semibold text-red-300 hover:bg-red-500/10">Log out</button>
    </section>
  </main>;
}
