import Link from "next/link";
import { Dashboard } from "@/components/creator/dashboard";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <Link href="/" className="text-xl font-bold">
          Glint
        </Link>
        <ConnectButton />
      </header>

      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Manage your profile and see your tips.
      </p>

      <Dashboard />
    </main>
  );
}
