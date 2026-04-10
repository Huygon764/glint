import { ConnectButton } from "@/components/wallet/ConnectButton";
import { SendXlmForm } from "@/components/wallet/SendXlmForm";
import { WalletBalances } from "@/components/wallet/WalletBalances";

/**
 * Wallet connection test page (Phase 1 verification).
 * Kept around for dev debugging. Remove once Phase 4+ are stable.
 */
export default function TestPage() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold">Glint / Test</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Stellar wallet test page (Phase 1)
          </p>
        </div>
        <ConnectButton />
      </header>

      <div className="space-y-6">
        <WalletBalances />
        <SendXlmForm />
      </div>

      <footer className="mt-16 pt-6 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500">
          Network: Stellar Testnet. Install{" "}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Freighter
          </a>{" "}
          and fund your account via{" "}
          <a
            href="https://friendbot.stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Friendbot
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
