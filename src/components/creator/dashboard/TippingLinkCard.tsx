"use client";

import Link from "next/link";

type Props = {
  slug: string;
};

export function TippingLinkCard({ slug }: Props) {
  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Your tipping link</h2>
        <Link
          href={`/${slug}`}
          className="text-sm text-blue-600 dark:text-blue-400 underline"
        >
          View public page
        </Link>
      </div>
      <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
        /{slug}
      </div>
    </div>
  );
}
