"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import type { Creator } from "@/lib/creators";
import { useWalletStore } from "@/stores/wallet";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "no-profile" }
  | { kind: "loaded"; creator: Creator }
  | { kind: "error"; message: string };

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function Dashboard() {
  const address = useWalletStore((s) => s.address);
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: "idle" });

  // Load creator profile by wallet address
  useEffect(() => {
    if (!address) {
      setState({ kind: "idle" });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    (async () => {
      try {
        const byWalletRes = await fetch(
          `/api/creators/by-wallet?address=${encodeURIComponent(address)}`,
        );

        if (cancelled) return;

        if (byWalletRes.status === 404) {
          setState({ kind: "no-profile" });
          return;
        }

        if (!byWalletRes.ok) {
          const err = await byWalletRes.json().catch(() => ({}));
          setState({
            kind: "error",
            message: err.error ?? "Failed to load profile",
          });
          return;
        }

        const creator: Creator = await byWalletRes.json();
        setState({ kind: "loaded", creator });
        setDisplayName(creator.displayName);
        setBio(creator.bio ?? "");
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
  }, [address]);

  if (!address) {
    return (
      <div className="border border-gray-300 dark:border-gray-700 rounded p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to see your dashboard.
        </p>
      </div>
    );
  }

  if (state.kind === "loading" || state.kind === "idle") {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (state.kind === "error") {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Error: {state.message}
      </div>
    );
  }

  if (state.kind === "no-profile") {
    return (
      <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You don't have a profile yet.
        </p>
        <Link
          href="/create"
          className="inline-block px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-medium hover:opacity-90"
        >
          Create profile
        </Link>
      </div>
    );
  }

  const creator = state.creator;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!address || state.kind !== "loaded") return;

    setSaveStatus({ kind: "saving" });

    try {
      const response = await fetch(`/api/creators/${creator.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveStatus({
          kind: "error",
          message: data.error ?? `Update failed (${response.status})`,
        });
        return;
      }

      setState({ kind: "loaded", creator: data });
      setSaveStatus({ kind: "saved" });
      setTimeout(() => setSaveStatus({ kind: "idle" }), 2000);
    } catch (err) {
      setSaveStatus({
        kind: "error",
        message: (err as Error).message ?? "Network error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your tipping link</h2>
          <Link
            href={`/${creator.slug}`}
            className="text-sm text-blue-600 dark:text-blue-400 underline"
          >
            View public page
          </Link>
        </div>
        <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
          /{creator.slug}
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4"
      >
        <h2 className="font-semibold">Edit profile</h2>

        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium mb-1"
          >
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{bio.length}/280</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saveStatus.kind === "saving"}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {saveStatus.kind === "saving" ? "Saving..." : "Save changes"}
          </button>
          {saveStatus.kind === "saved" && (
            <span className="text-sm text-green-600 dark:text-green-400">
              Saved
            </span>
          )}
          {saveStatus.kind === "error" && (
            <span className="text-sm text-red-600 dark:text-red-400">
              {saveStatus.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
