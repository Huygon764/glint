import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";

/**
 * Shared site header — brand link on the left, wallet connect button on the right.
 * Used by every page via {@link PageShell}.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between mb-10">
      <Link href="/" className="text-xl font-bold">
        Glint
      </Link>
      <ConnectButton />
    </header>
  );
}
