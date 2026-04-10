"use client";

import { useCallback, useEffect, useState } from "react";
import { USDC_ASSET_CODE, USDC_ISSUER } from "@/lib/stellar";

type TipEntry = {
  id: string;
  amount: string;
  from: string;
  createdAt: string;
  transactionHash: string;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; tips: TipEntry[] }
  | { kind: "error"; message: string };

type Props = {
  walletAddress: string;
};

/**
 * Display recent USDC tips received by a creator.
 *
 * Queries the Horizon API directly for USDC payments to the creator's wallet.
 * This is a simple implementation — Soroban contract invocations (from x402
 * facilitator settlement) appear here because the facilitator uses the SAC
 * `transfer` host function which surfaces as a payment-like operation.
 *
 * Phase 5/6 may replace this with an indexed database or Soroban events.
 */
export function TipHistory({ walletAddress }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  const fetchTips = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const horizonUrl =
        process.env.NEXT_PUBLIC_HORIZON_URL ??
        "https://horizon-testnet.stellar.org";

      // Fetch recent payments for the account.
      // Horizon returns `payment` + `path_payment_strict_*` ops.
      // Filter client-side to USDC only.
      const url = `${horizonUrl}/accounts/${walletAddress}/payments?order=desc&limit=20`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Horizon returned ${res.status}`);
      }
      const data = await res.json();
      const records: unknown[] = data?._embedded?.records ?? [];

      const tips: TipEntry[] = [];
      for (const raw of records) {
        const op = raw as {
          id: string;
          type: string;
          asset_type?: string;
          asset_code?: string;
          asset_issuer?: string;
          amount?: string;
          from?: string;
          to?: string;
          created_at: string;
          transaction_hash: string;
        };

        // Only incoming USDC payments
        if (op.to !== walletAddress) continue;
        if (
          op.asset_type !== "credit_alphanum4" &&
          op.asset_type !== "credit_alphanum12"
        ) {
          continue;
        }
        if (
          op.asset_code !== USDC_ASSET_CODE ||
          op.asset_issuer !== USDC_ISSUER
        ) {
          continue;
        }

        tips.push({
          id: op.id,
          amount: op.amount ?? "0",
          from: op.from ?? "unknown",
          createdAt: op.created_at,
          transactionHash: op.transaction_hash,
        });
      }

      setState({ kind: "loaded", tips });
    } catch (err) {
      setState({
        kind: "error",
        message: (err as Error).message ?? "Failed to load tips",
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Recent tips</h2>
        <button
          type="button"
          onClick={fetchTips}
          disabled={state.kind === "loading"}
          className="text-xs text-blue-600 dark:text-blue-400 underline disabled:opacity-50"
        >
          {state.kind === "loading" ? "Loading..." : "Refresh"}
        </button>
      </div>

      {state.kind === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      {state.kind === "loaded" && state.tips.length === 0 && (
        <p className="text-xs text-gray-500">
          No tips yet. Share this page to start receiving tips.
        </p>
      )}

      {state.kind === "loaded" && state.tips.length > 0 && (
        <ul className="space-y-2">
          {state.tips.map((tip) => (
            <li
              key={tip.id}
              className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-b-0 last:pb-0"
            >
              <div>
                <div className="font-mono">+{tip.amount} USDC</div>
                <div className="text-xs text-gray-500">
                  from {tip.from.slice(0, 4)}...{tip.from.slice(-4)} ·{" "}
                  {new Date(tip.createdAt).toLocaleString()}
                </div>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${tip.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 underline"
              >
                tx
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
