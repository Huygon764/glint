import Link from "next/link";
import { CreateProfileForm } from "@/components/creator/CreateProfileForm";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function CreatePage() {
  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <Link href="/" className="text-xl font-bold">
          Glint
        </Link>
        <ConnectButton />
      </header>

      <h1 className="text-3xl font-bold mb-2">Create your profile</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Connect your wallet, pick a unique handle, and share your tipping link.
      </p>

      <CreateProfileForm />
    </main>
  );
}
