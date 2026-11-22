"use client";

import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { normalizeOptionalImageUrl } from "@/lib/image-url";
import { notifyUserUpdated } from "@/lib/user-events";
import { toast } from "sonner";
import { CalendarDays, Save, ShieldCheck, UserRound } from "lucide-react";
import type { CurrentUserProfile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    apiFetch<CurrentUserProfile>("/users/me")
      .then((data) => {
        setProfile(data);
        setName(data.user.name ?? "");
        setImageUrl(data.user.image ?? "");
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        throw new Error("Name must be at least 2 characters.");
      }

      const image = normalizeOptionalImageUrl(imageUrl);
      const result = await authClient.updateUser({ name: trimmedName, image });
      if (result?.error) {
        throw new Error(result.error.message || "Could not update your profile.");
      }

      const refreshed = await apiFetch<CurrentUserProfile>("/users/me");
      setProfile(refreshed);
      setImageUrl(refreshed.user.image ?? "");
      notifyUserUpdated();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update your profile.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function logout() {
    await authClient.signOut();
    toast.success("You have been logged out.");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-muted-foreground">
        Loading profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        <h1 className="text-3xl font-black">Sign in to view your profile</h1>
        <a className="mt-5 inline-block text-orange-400" href="/login">
          Go to login →
        </a>
      </main>
    );
  }

  const { user, session } = profile;

  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-14">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
        Your account
      </p>
      <h1 className="mt-2 text-4xl font-black">My profile</h1>

      <section className="mt-8 rounded-3xl border border-border bg-card p-7">
        <div className="flex flex-wrap items-center gap-5">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-orange-500/15 text-orange-400">
              <UserRound size={34} />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
            <span className="mt-3 inline-flex rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase text-orange-400">
              {user.role || "customer"}
            </span>
          </div>
        </div>

        <form
          onSubmit={(event) => void updateProfile(event)}
          className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"
        >
          <label className="block text-sm font-semibold sm:col-span-2">
            Full name
            <input
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal text-foreground outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15"
              placeholder="Your name"
            />
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Image URL{" "}
            <span className="font-normal text-muted-foreground">
              (optional — leave blank to remove your photo)
            </span>
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal text-foreground outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15"
              placeholder="https://example.com/avatar.jpg"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white transition hover:bg-[#D95338] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>

        <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div className="flex gap-3">
            <ShieldCheck className="text-orange-400" />
            <div>
              <p className="text-xs text-muted-foreground">Session ID</p>
              <p className="break-all text-sm">{session?.id ?? "No active session"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CalendarDays className="text-orange-400" />
            <div>
              <p className="text-xs text-muted-foreground">Session expires</p>
              <p className="text-sm">
                {session ? new Date(session.expiresAt).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-8 rounded-xl border border-red-500/30 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          Log out
        </button>
      </section>
    </main>
  );
}
