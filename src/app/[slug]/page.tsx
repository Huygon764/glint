import { notFound } from "next/navigation";
import { ShareButton } from "@/components/creator/ShareButton";
import { TipForm } from "@/components/creator/TipForm";
import { TipWall } from "@/components/creator/TipWall";
import { PageShell } from "@/components/layout/PageShell";
import { getCreatorsStore, validateSlug } from "@/lib/creators";
import { shortenAddress } from "@/lib/stellar";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
    <PageShell>
      <section className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{creator.displayName}</h1>
            <p className="text-sm text-gray-500 font-mono">@{creator.slug}</p>
          </div>
          <ShareButton slug={creator.slug} />
        </div>

        {creator.bio && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {creator.bio}
          </p>
        )}

        <TipForm slug={creator.slug} displayName={creator.displayName} />

        <TipWall slug={creator.slug} />
      </section>

      <footer className="mt-16 pt-6 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500">
          Joined {new Date(creator.createdAt).toLocaleDateString()} ·{" "}
          <span className="font-mono">
            {shortenAddress(creator.walletAddress, 6, 6)}
          </span>
        </p>
      </footer>
    </PageShell>
  );
}
