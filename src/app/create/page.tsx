import { CreateProfileForm } from "@/components/creator/CreateProfileForm";
import { PageShell } from "@/components/layout/PageShell";

export default function CreatePage() {
  return (
    <PageShell maxWidth="xl">
      <h1 className="text-3xl font-bold mb-2">Create your profile</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Connect your wallet, pick a unique handle, and share your tipping link.
      </p>

      <CreateProfileForm />
    </PageShell>
  );
}
