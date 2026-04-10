"use client";

import { useState } from "react";
import { signTxWithFreighter } from "@/lib/freighter";
import { buildXlmPaymentTx, submitSignedTx } from "@/lib/stellar";
import { useWalletStore } from "@/stores/wallet";

type Status =
  | { kind: "idle" }
  | { kind: "building" }
  | { kind: "signing" }
  | { kind: "submitting" }
  | { kind: "success"; hash: string }
  | { kind: "error"; message: string };

export function SendXlmForm() {
  const address = useWalletStore((s) => s.address);
  const refreshBalances = useWalletStore((s) => s.refreshBalances);

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (!address) return null;

  const isBusy =
    status.kind === "building" ||
    status.kind === "signing" ||
    status.kind === "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;

    try {
      setStatus({ kind: "building" });
      const unsignedXdr = await buildXlmPaymentTx(
        address,
        destination.trim(),
        amount,
      );

      setStatus({ kind: "signing" });
      const signResult = await signTxWithFreighter(unsignedXdr, address);
      if (!signResult.ok) {
        setStatus({ kind: "error", message: signResult.error });
        return;
      }

      setStatus({ kind: "submitting" });
      const hash = await submitSignedTx(signResult.value);

      setStatus({ kind: "success", hash });
      refreshBalances();
    } catch (err) {
      setStatus({
        kind: "error",
        message: (err as Error).message ?? "Unknown error",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-300 dark:border-gray-700 rounded p-4 space-y-3 max-w-md"
    >
      <h3 className="font-semibold">Send XLM (test)</h3>
      <p className="text-xs text-gray-500">
        Proves end-to-end Stellar transaction flow.
      </p>

      <div>
        <label
          htmlFor="destination"
          className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
        >
          Destination address
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="G..."
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 font-mono text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
        >
          Amount (XLM)
        </label>
        <input
          id="amount"
          type="number"
          step="0.0000001"
          min="0.0000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 font-mono text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isBusy || !destination}
        className="w-full px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 text-sm font-medium"
      >
        {status.kind === "building" && "Building..."}
        {status.kind === "signing" && "Waiting for Freighter..."}
        {status.kind === "submitting" && "Submitting to network..."}
        {(status.kind === "idle" ||
          status.kind === "success" ||
          status.kind === "error") &&
          "Send"}
      </button>

      {status.kind === "success" && (
        <div className="text-xs text-green-700 dark:text-green-400 break-all">
          <div>Success!</div>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${status.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {status.hash}
          </a>
        </div>
      )}

      {status.kind === "error" && (
        <div className="text-xs text-red-600 dark:text-red-400 break-words">
          {status.message}
        </div>
      )}
    </form>
  );
}
