"use client";

import { useCallback, useEffect, useState } from "react";

type WallMessage = {
  from: string;
  amount: string;
  note: string;
  timestamp: string;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; messages: WallMessage[] }
  | { kind: "error"; message: string };

type Props = {
  slug: string;
};

/**
 * Tipping wall — displays tip messages stored on-chain in the TipJar contract.
 * Fetched via the server-side /api/tip-messages/[slug] endpoint which reads
 * the contract state through Soroban RPC.
 */
export function TipWall({ slug }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  const fetchMessages = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/tip-messages/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const messages: WallMessage[] = data.messages ?? [];
      // Newest first
      messages.sort((a, b) =>
        Number(BigInt(b.timestamp) - BigInt(a.timestamp)),
      );
      setState({ kind: "loaded", messages });
    } catch (err) {
      setState({
        kind: "error",
        message: (err as Error).message ?? "Failed to load wall",
      });
    }
  }, [slug]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  function formatAmount(stroops: string): string {
    // USDC is 7 decimals on Stellar SAC
    const big = BigInt(stroops);
    const divisor = BigInt(10_000_000);
    const whole = big / divisor;
    const frac = big % divisor;
    const fracStr = frac.toString().padStart(7, "0").replace(/0+$/, "");
    return fracStr.length > 0 ? `${whole}.${fracStr}` : whole.toString();
  }

  function formatTimestamp(timestamp: string): string {
    const ms = Number(BigInt(timestamp)) * 1000;
    return new Date(ms).toLocaleString();
  }

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Tipping wall</h2>
          <p className="text-xs text-gray-500">All tips recorded on-chain</p>
        </div>
        <button
          type="button"
          onClick={fetchMessages}
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

      {state.kind === "loaded" && state.messages.length === 0 && (
        <p className="text-xs text-gray-500">
          No tips yet. Be the first to send one.
        </p>
      )}

      {state.kind === "loaded" && state.messages.length > 0 && (
        <ul className="space-y-3">
          {state.messages.map((msg) => {
            const hasNote = msg.note.trim().length > 0;
            return (
              <li
                key={`${msg.from}-${msg.timestamp}`}
                className={
                  hasNote
                    ? "border border-gray-200 dark:border-gray-800 rounded p-3 space-y-1"
                    : "py-2"
                }
              >
                {hasNote && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.note}
                  </p>
                )}
                <div className="text-xs text-gray-500 flex items-center justify-between gap-2">
                  <span>
                    <span className="font-mono">
                      {msg.from.slice(0, 4)}...{msg.from.slice(-4)}
                    </span>{" "}
                    tipped{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      +{formatAmount(msg.amount)} USDC
                    </span>
                  </span>
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
