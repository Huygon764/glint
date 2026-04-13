"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState, SparkleIcon } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { API_ENDPOINTS, ApiError, apiClient } from "@/lib/api";
import { shortenAddress, stroopsToUsdc } from "@/lib/stellar";
import { TIP_SENT_EVENT, type TipSentDetail } from "@/lib/tip-events";

/** Delay before refetching after a tip event — let on-chain record_tip propagate. */
const REFETCH_DELAY_MS = 1500;

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

type Props = { slug: string };

/**
 * Tipping wall — displays tip messages stored on-chain in the TipJar contract.
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

  // Refetch whenever a tip was just sent to this creator. Slight delay
  // gives the on-chain record_tip call time to settle before we hit
  // the RPC endpoint.
  useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | null = null;
    function onTipSent(e: Event) {
      const detail = (e as CustomEvent<TipSentDetail>).detail;
      if (detail?.slug !== slug) return;
      if (pending) clearTimeout(pending);
      pending = setTimeout(fetchMessages, REFETCH_DELAY_MS);
    }
    window.addEventListener(TIP_SENT_EVENT, onTipSent);
    return () => {
      window.removeEventListener(TIP_SENT_EVENT, onTipSent);
      if (pending) clearTimeout(pending);
    };
  }, [slug, fetchMessages]);

  return (
    <Card padding="lg">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-display text-2xl">Tipping wall</h2>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Every tip recorded on Stellar
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMessages}
          disabled={state.kind === "loading"}
          className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline disabled:opacity-50"
        >
          {state.kind === "loading" ? "Loading…" : "Refresh"}
        </button>
      </div>

      {state.kind === "loading" && (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {state.kind === "error" && (
        <p className="text-sm text-[var(--color-error)]">{state.message}</p>
      )}

      {state.kind === "loaded" && state.messages.length === 0 && (
        <EmptyState
          icon={<SparkleIcon />}
          title="No tips yet"
          description="Be the first — every message gets etched into the Stellar ledger."
          className="border-none bg-transparent p-4"
        />
      )}

      {state.kind === "loaded" && state.messages.length > 0 && (
        <ul className="space-y-4">
          {state.messages.map((msg) => (
            <TipWallItem key={`${msg.from}-${msg.timestamp}`} msg={msg} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function TipWallItem({ msg }: { msg: WallMessage }) {
  const hasNote = msg.note.trim().length > 0;
  const when = formatTimestamp(msg.timestamp);

  return (
    <li className="pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="min-w-0">
          <div className="text-sm text-[var(--color-ink)] font-medium truncate">
            <span className="font-mono">{shortenAddress(msg.from)}</span>
          </div>
          <div className="text-xs text-[var(--color-ink-muted)]">{when}</div>
        </div>
        <div className="font-display text-lg text-[var(--color-accent)] shrink-0">
          +${stroopsToUsdc(msg.amount)}
        </div>
      </div>
      {hasNote && (
        <p className="mt-2 pl-3 border-l-2 border-[var(--color-border)] text-sm text-[var(--color-ink-soft)] whitespace-pre-wrap break-words">
          {msg.note}
        </p>
      )}
    </li>
  );
}

function formatTimestamp(timestamp: string): string {
  const ms = Number(BigInt(timestamp)) * 1000;
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
