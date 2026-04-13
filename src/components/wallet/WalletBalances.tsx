"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useWalletStore } from "@/stores/wallet";

export function WalletBalances() {
  const address = useWalletStore((s) => s.address);
  const xlmBalance = useWalletStore((s) => s.xlmBalance);
  const usdcBalance = useWalletStore((s) => s.usdcBalance);
  const hasUsdcTrustline = useWalletStore((s) => s.hasUsdcTrustline);
  const isLoadingBalances = useWalletStore((s) => s.isLoadingBalances);
  const refreshBalances = useWalletStore((s) => s.refreshBalances);

  if (!address) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded p-4 space-y-3 max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Balances</h3>
        <button
          type="button"
          onClick={refreshBalances}
          disabled={isLoadingBalances}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {isLoadingBalances ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-600 dark:text-gray-400">XLM</span>
        {xlmBalance === null && isLoadingBalances ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="font-mono text-sm">{xlmBalance ?? "—"}</span>
        )}
      </div>

      <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-600 dark:text-gray-400">USDC</span>
        {usdcBalance === null && isLoadingBalances ? (
          <Skeleton className="h-4 w-20" />
        ) : hasUsdcTrustline ? (
          <span className="font-mono text-sm">{usdcBalance ?? "0"}</span>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            No trustline
          </span>
        )}
      </div>

      {!hasUsdcTrustline && xlmBalance !== null && xlmBalance !== "0" && (
        <p className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
          You need a USDC trustline to receive tips. Set up in Freighter or
          another Stellar wallet.
        </p>
      )}
    </div>
  );
}
