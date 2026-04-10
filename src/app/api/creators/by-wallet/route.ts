import { NextResponse } from "next/server";
import { getCreatorsStore } from "@/lib/creators";

const STELLAR_ADDRESS_REGEX = /^G[A-Z0-9]{55}$/;

/**
 * GET /api/creators/by-wallet?address=G...
 * Lookup a creator by wallet address.
 *
 * Used by the dashboard to find the current user's profile based on their
 * connected wallet.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address query parameter is required" },
      { status: 400 },
    );
  }

  if (!STELLAR_ADDRESS_REGEX.test(address)) {
    return NextResponse.json(
      { error: "Invalid Stellar wallet address" },
      { status: 400 },
    );
  }

  const store = getCreatorsStore();
  const creator = await store.getByWallet(address);

  if (!creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(creator);
}
