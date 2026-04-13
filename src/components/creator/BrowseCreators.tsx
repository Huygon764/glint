"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, UserIcon } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Creator } from "@/lib/creators";

type State =
  | { kind: "loading" }
  | { kind: "loaded"; creators: Creator[]; total: number }
  | { kind: "error"; message: string };

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Browse + search creators. Client component that hits /api/creators.
 *
 * - Typing in the search box debounces 250ms before refetching
 * - Loading state shows skeleton cards
 * - Empty state (no results) shows a friendly message
 */
export function BrowseCreators() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [state, setState] = useState<State>({ kind: "loading" });

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(handle);
  }, [search]);

  const fetchCreators = useCallback(async (q: string) => {
    setState({ kind: "loading" });
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("limit", "50");

      const res = await fetch(`/api/creators?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setState({
        kind: "loaded",
        creators: data.creators ?? [],
        total: data.total ?? 0,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: (err as Error).message ?? "Failed to load creators",
      });
    }
  }, []);

  useEffect(() => {
    fetchCreators(debouncedSearch);
  }, [debouncedSearch, fetchCreators]);

  return (
    <div className="space-y-6">
      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or handle..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
        />
      </div>

      {state.kind === "loading" && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="border border-gray-300 dark:border-gray-700 rounded p-4 space-y-3"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </li>
          ))}
        </ul>
      )}

      {state.kind === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      {state.kind === "loaded" && state.creators.length === 0 && (
        <EmptyState
          icon={<UserIcon />}
          title={
            debouncedSearch
              ? `No creators match "${debouncedSearch}"`
              : "No creators yet"
          }
          description={
            debouncedSearch
              ? "Try a different search term."
              : "Be the first — create a profile and start receiving tips."
          }
          action={
            !debouncedSearch && (
              <Link
                href="/create"
                className="inline-block px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-medium hover:opacity-90"
              >
                Create profile
              </Link>
            )
          }
        />
      )}

      {state.kind === "loaded" && state.creators.length > 0 && (
        <>
          <p className="text-xs text-gray-500">
            {state.total} creator{state.total === 1 ? "" : "s"}
            {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {state.creators.map((creator) => (
              <li key={creator.slug}>
                <Link
                  href={`/${creator.slug}`}
                  className="block border border-gray-300 dark:border-gray-700 rounded p-4 space-y-2 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-base">
                      {creator.displayName}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      @{creator.slug}
                    </p>
                  </div>
                  {creator.bio && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Joined{" "}
                    {new Date(creator.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
