"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, SparkleIcon } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { API_ENDPOINTS, ApiError, apiClient } from "@/lib/api";
import { shortenAddress, stroopsToUsdc } from "@/lib/stellar";

type WallMessage = {
  from: string;
  amount: string;
  note: string;
  timestamp: string;
};

type State =
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
  const [state, setState] = useState<State>({ kind: "loading" });

  const fetchMessages = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const { data } = await apiClient.get<{ messages: WallMessage[] }>(
        API_ENDPOINTS.tipMessages(slug),
      );
      const messages: WallMessage[] = data.messages ?? [];
      // Newest first
      messages.sort((a, b) =>
        Number(BigInt(b.timestamp) - BigInt(a.timestamp)),
      );
      setState({ kind: "loaded", messages });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : ((err as Error).message ?? "Failed to load wall");
      setState({ kind: "error", message });
    }
  }, [slug]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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

      {state.kind === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {state.kind === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      {state.kind === "loaded" && state.messages.length === 0 && (
        <EmptyState
          icon={<SparkleIcon />}
          title="No tips yet"
          description="Be the first to send one. Tips and messages are stored on-chain."
          className="border-none p-4"
        />
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
                      {shortenAddress(msg.from)}
                    </span>{" "}
                    tipped{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      +{stroopsToUsdc(msg.amount)} USDC
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
