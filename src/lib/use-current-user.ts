"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getCurrentUser } from "@/lib/api";
import type { CurrentUser } from "@/types";

type UserLoadResult = {
  sessionUserId: string;
  reloadKey: number;
  user?: CurrentUser;
  error?: Error;
};

export function useCurrentUser() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const sessionUserId = session?.user.id;
  const [loadResult, setLoadResult] = useState<UserLoadResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (sessionPending || !sessionUserId) return;

    let active = true;
    getCurrentUser()
      .then(({ user }) => {
        if (active) setLoadResult({ sessionUserId, reloadKey, user });
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadResult({
            sessionUserId,
            reloadKey,
            error:
              cause instanceof Error
                ? cause
                : new Error("Could not load your account role."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey, sessionPending, sessionUserId]);

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!sessionUserId) return;
    window.addEventListener("focus", retry);
    return () => window.removeEventListener("focus", retry);
  }, [retry, sessionUserId]);

  const currentResult =
    loadResult &&
    loadResult.sessionUserId === sessionUserId &&
    loadResult.reloadKey === reloadKey
      ? loadResult
      : null;

  return {
    user: sessionUserId ? currentResult?.user ?? null : null,
    loading: sessionPending || (!!sessionUserId && !currentResult),
    error: currentResult?.error ?? null,
    retry,
  };
}
