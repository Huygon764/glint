"use client";

import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { type FormEvent, useState } from "react";
import { type FormStatus, isBusy } from "@/lib/form-status";
import { createFreighterSigner } from "@/lib/freighter";
import { useWalletStore } from "@/stores/wallet";

const PRESET_AMOUNTS = ["0.10", "0.50", "1.00", "5.00"];

type Props = {
  slug: string;
  displayName: string;
};

export function TipForm({ slug, displayName }: Props) {
  const address = useWalletStore((s) => s.address);
  const hasUsdcTrustline = useWalletStore((s) => s.hasUsdcTrustline);
  const refreshBalances = useWalletStore((s) => s.refreshBalances);

  const [selectedAmount, setSelectedAmount] = useState("0.50");
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus<string>>({ kind: "idle" });

  if (!address) {
    return (
      <div className="border border-gray-300 dark:border-gray-700 rounded p-6 text-center space-y-3">
        <p className="text-sm">Connect your wallet to send a tip.</p>
        <p className="text-xs text-gray-500">
          Uses Freighter + USDC on Stellar Testnet.
        </p>
      </div>
    );
  }

  if (!hasUsdcTrustline) {
    return (
      <div className="border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 rounded p-6 space-y-3">
        <p className="text-sm font-medium">USDC trustline required</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Your wallet needs a USDC trustline to send tips. Open Freighter →
          Manage Assets → Add USDC, then refresh balances.
        </p>
        <button
          type="button"
          onClick={refreshBalances}
          className="text-xs text-blue-600 dark:text-blue-400 underline"
        >
          Refresh balance
        </button>
      </div>
    );
  }

  const finalAmount =
    customAmount.trim() !== "" ? customAmount.trim() : selectedAmount;

  const busy = isBusy(status);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address) return;

    const parsed = Number.parseFloat(finalAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setStatus({ kind: "error", message: "Enter a valid amount" });
      return;
    }

    try {
      setStatus({ kind: "busy", label: "Waiting for Freighter..." });

      const signer = createFreighterSigner(address);
      const client = new x402Client().register(
        "stellar:*",
        new ExactStellarScheme(signer),
      );
      const fetchWithPayment = wrapFetchWithPayment(fetch, client);

      setStatus({ kind: "busy", label: "Processing payment..." });

      const url = `/api/tip/${encodeURIComponent(slug)}?amount=${encodeURIComponent(finalAmount)}`;
      const body = JSON.stringify({
        message: message.trim() || undefined,
        from: address,
      });
      const response = await fetchWithPayment(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const text = await response.text();

      if (!response.ok) {
        setStatus({
          kind: "error",
          message: `Tip failed (${response.status}): ${text}`,
        });
        return;
      }

      setStatus({ kind: "success", data: text });
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
      className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-5"
    >
      <div>
        <h2 className="font-semibold mb-1">Send a tip to {displayName}</h2>
        <p className="text-xs text-gray-500">
          USDC on Stellar Testnet · zero platform fee · ~5 second settlement
        </p>
      </div>

      <div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Amount (USDC)
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PRESET_AMOUNTS.map((amt) => {
            const active = customAmount.trim() === "" && selectedAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                disabled={busy}
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount("");
                }}
                className={`px-3 py-2 rounded text-sm border disabled:opacity-50 ${
                  active
                    ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                    : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                ${amt}
              </button>
            );
          })}
        </div>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max="1000"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Custom amount..."
          disabled={busy}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 font-mono text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
        >
          Message <span className="text-gray-400">(optional, on-chain)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a note on the tipping wall..."
          maxLength={280}
          rows={2}
          disabled={busy}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm resize-none disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">{message.length}/280</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full px-4 py-3 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 font-medium"
      >
        {status.kind === "busy" ? status.label : `Tip $${finalAmount} USDC`}
      </button>

      {status.kind === "success" && (
        <div className="text-xs text-green-700 dark:text-green-400 space-y-1">
          <div className="font-semibold">Tip sent 🎉</div>
          <div className="font-mono break-all">{status.data}</div>
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
