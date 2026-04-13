import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

export default function Home() {
  return (
    <PageShell maxWidth="5xl">
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8 mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Micropayment tipping on Stellar
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Creators receive USDC tips directly. Zero platform fees, 5-second
            settlement, no chargebacks. Works for humans and AI agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded font-medium hover:opacity-90"
            >
              Become a creator
            </Link>
            <Link
              href="/browse"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Browse creators
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Creator dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="p-6 text-center text-xs text-gray-500">
        Built on Stellar Testnet · x402 payment protocol
      </footer>
    </PageShell>
  );
}
