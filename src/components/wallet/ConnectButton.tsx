"use client";

import { Button } from "@/components/ui/Button";
import { shortenAddress } from "@/lib/stellar";
import { useWalletStore } from "@/stores/wallet";

export function ConnectButton() {
  const address = useWalletStore((s) => s.address);
  const isConnecting = useWalletStore((s) => s.isConnecting);
  const error = useWalletStore((s) => s.error);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  if (address) {
    return (
      <button
        type="button"
        onClick={disconnect}
        title="Click to disconnect"
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] transition-colors text-sm"
      >
        <span
          className="w-2 h-2 rounded-full bg-[var(--color-success)]"
          aria-hidden="true"
        />
        <span className="font-mono">{shortenAddress(address)}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        variant="primary"
        size="md"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </Button>
      {error && (
        <span className="text-[var(--color-error)] text-xs max-w-xs text-right">
          {error}
        </span>
      )}
    </div>
  );
}
