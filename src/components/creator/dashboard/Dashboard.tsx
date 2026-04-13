"use client";

import Link from "next/link";
import { useWalletStore } from "@/stores/wallet";
import { EditProfileForm } from "./EditProfileForm";
import { TippingLinkCard } from "./TippingLinkCard";
import { useCreatorProfile } from "./useCreatorProfile";

/**
 * Creator dashboard — orchestrates load/save state for the connected
 * wallet's profile. All rendering and mutation is delegated to child
 * components.
 */
export function Dashboard() {
  const address = useWalletStore((s) => s.address);
  const { state, updateProfile } = useCreatorProfile(address);

  if (!address) {
    return (
      <div className="border border-gray-300 dark:border-gray-700 rounded p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to see your dashboard.
        </p>
      </div>
    );
  }

  if (state.kind === "idle" || state.kind === "loading") {
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

  const { creator } = state;

  return (
    <div className="space-y-6">
      <TippingLinkCard slug={creator.slug} />
      <EditProfileForm
        creator={creator}
        onSave={async (updates) => updateProfile(creator.slug, updates)}
      />
    </div>
  );
}
