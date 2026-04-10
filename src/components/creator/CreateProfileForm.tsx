"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Creator } from "@/lib/creators";
import { useWalletStore } from "@/stores/wallet";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; creator: Creator }
  | { kind: "error"; message: string };

export function CreateProfileForm() {
  const router = useRouter();
  const address = useWalletStore((s) => s.address);

  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (!address) {
    return (
      <div className="border border-gray-300 dark:border-gray-700 rounded p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your Freighter wallet to create a profile.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address) return;

    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          walletAddress: address,
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? `Request failed (${response.status})`,
        });
        return;
      }

      setStatus({ kind: "success", creator: data });
      setTimeout(() => {
        router.push(`/${data.slug}`);
      }, 1500);
    } catch (err) {
      setStatus({
        kind: "error",
        message: (err as Error).message ?? "Network error",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded p-6 space-y-3">
        <h2 className="font-semibold">Profile created</h2>
        <p className="text-sm">
          Your tipping link:{" "}
          <Link
            href={`/${status.creator.slug}`}
            className="font-mono underline"
          >
            /{status.creator.slug}
          </Link>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Redirecting...
        </p>
      </div>
    );
  }

  const isSubmitting = status.kind === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1">
          Handle <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">glint.app/</span>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="alice"
            required
            pattern="[a-z0-9_-]{3,20}"
            title="3-20 lowercase letters, digits, dashes or underscores"
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 font-mono text-sm disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          3-20 characters. Lowercase letters, digits, dashes, underscores.
        </p>
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
          Display name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Alice"
          required
          maxLength={50}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm disabled:opacity-50"
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
          placeholder="What you do, why people should tip you..."
          maxLength={280}
          rows={3}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{bio.length}/280</p>
      </div>

      <div className="pt-2">
        <div className="text-xs text-gray-500 mb-3">
          Wallet:{" "}
          <span className="font-mono">
            {address.slice(0, 6)}...{address.slice(-6)}
          </span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 font-medium"
        >
          {isSubmitting ? "Creating..." : "Create profile"}
        </button>
      </div>

      {status.kind === "error" && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {status.message}
        </div>
      )}
    </form>
  );
}
