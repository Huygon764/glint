"use client";

import { useWalletStore } from "@/stores/wallet";

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ConnectButton() {
  const address = useWalletStore((s) => s.address);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const error = useWalletStore((s) => s.error);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded">
          {shortAddress(address)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="px-4 py-1.5 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 text-sm font-medium"
      >
        {isConnecting ? "Connecting..." : "Connect Freighter"}
      </button>
      {error && (
        <span className="text-red-600 dark:text-red-400 text-xs mt-1 max-w-xs">
          {error}
        </span>
      )}
    </div>
  );
}
