import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { getCreatorsStore, validateSlug } from "@/lib/creators";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Validate slug format first (skip reserved words / malformed)
  const slugResult = validateSlug(slug);
  if (!slugResult.ok) {
    notFound();
  }

  const store = getCreatorsStore();
  const creator = await store.get(slugResult.slug);

  if (!creator) {
    notFound();
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <Link href="/" className="text-xl font-bold">
          Glint
        </Link>
        <ConnectButton />
      </header>

      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{creator.displayName}</h1>
          <p className="text-sm text-gray-500 font-mono">@{creator.slug}</p>
        </div>

        {creator.bio && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {creator.bio}
          </p>
        )}

        <div className="border border-gray-300 dark:border-gray-700 rounded p-6 text-center space-y-3">
          <p className="text-sm text-gray-500">Tipping coming in Phase 4</p>
          <p className="text-xs text-gray-400">
            Wallet:{" "}
            <span className="font-mono">
              {creator.walletAddress.slice(0, 6)}...
              {creator.walletAddress.slice(-6)}
            </span>
          </p>
        </div>
      </section>

      <footer className="mt-16 pt-6 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500">
          Joined {new Date(creator.createdAt).toLocaleDateString()}
        </p>
      </footer>
    </main>
  );
}
