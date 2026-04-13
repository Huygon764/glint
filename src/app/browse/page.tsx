import { BrowseCreators } from "@/components/creator/BrowseCreators";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Browse creators · Glint",
};

export default function BrowsePage() {
  return (
    <PageShell maxWidth="3xl">
      <h1 className="text-3xl font-bold mb-2">Browse creators</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Discover creators on Glint and send them a tip.
      </p>

      <BrowseCreators />
    </PageShell>
  );
}
