"use client";

import Link from "next/link";
import { EmptyState, UserIcon, WalletIcon } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
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
      <EmptyState
        icon={<WalletIcon />}
        title="Wallet not connected"
        description="Connect your Freighter wallet to see your dashboard, tipping link, and edit your profile."
      />
    );
  }

  if (state.kind === "idle" || state.kind === "loading") {
    return (
      <div className="space-y-6">
        <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
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
      <EmptyState
        icon={<UserIcon />}
        title="No profile yet"
        description="Pick a handle, add a display name, and start receiving USDC tips in seconds."
        action={
          <Link
            href="/create"
            className="inline-block px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-medium hover:opacity-90"
          >
            Create profile
          </Link>
        }
      />
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
