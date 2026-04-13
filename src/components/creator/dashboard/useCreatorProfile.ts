"use client";

import { useCallback, useEffect, useState } from "react";
import type { Creator } from "@/lib/creators";

export type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "no-profile" }
  | { kind: "loaded"; creator: Creator }
  | { kind: "error"; message: string };

/**
 * Custom hook that loads the current wallet's creator profile and
 * exposes an update callback.
 *
 * Returns:
 *   - state: the current load state (idle / loading / no-profile / loaded / error)
 *   - updateProfile: call with partial fields to PATCH the profile
 *
 * When `walletAddress` is null the hook returns the idle state and does nothing.
 * Changing `walletAddress` reloads the profile.
 */
export function useCreatorProfile(walletAddress: string | null) {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  // Load profile whenever the connected wallet changes.
  useEffect(() => {
    if (!walletAddress) {
      setState({ kind: "idle" });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    (async () => {
      try {
        const res = await fetch(
          `/api/creators/by-wallet?address=${encodeURIComponent(walletAddress)}`,
        );
        if (cancelled) return;

        if (res.status === 404) {
          setState({ kind: "no-profile" });
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setState({
            kind: "error",
            message: err.error ?? "Failed to load profile",
          });
          return;
        }

        const creator: Creator = await res.json();
        setState({ kind: "loaded", creator });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: (err as Error).message ?? "Network error",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  /**
   * PATCH the profile. Returns the updated creator on success, or an error
   * string on failure. The hook's state is updated automatically on success.
   */
  const updateProfile = useCallback(
    async (
      slug: string,
      updates: { displayName: string; bio?: string },
    ): Promise<
      { ok: true; creator: Creator } | { ok: false; error: string }
    > => {
      if (!walletAddress) {
        return { ok: false, error: "Wallet not connected" };
      }
      try {
        const res = await fetch(`/api/creators/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            displayName: updates.displayName.trim(),
            bio: updates.bio?.trim() || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return {
            ok: false,
            error: data.error ?? `Update failed (${res.status})`,
          };
        }

        setState({ kind: "loaded", creator: data });
        return { ok: true, creator: data };
      } catch (err) {
        return {
          ok: false,
          error: (err as Error).message ?? "Network error",
        };
      }
    },
    [walletAddress],
  );

  return { state, updateProfile };
}
