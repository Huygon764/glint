import { NextResponse } from "next/server";
import {
  getCreatorsStore,
  SlugTakenError,
  validateSlug,
  WalletAlreadyHasProfileError,
} from "@/lib/creators";

const STELLAR_ADDRESS_REGEX = /^G[A-Z0-9]{55}$/;

type CreateRequestBody = {
  slug?: string;
  walletAddress?: string;
  displayName?: string;
  bio?: string;
};

/**
 * POST /api/creators
 * Create a new creator profile.
 *
 * Body: { slug, walletAddress, displayName, bio? }
 *
 * Note: walletAddress is trusted from the client. In a POC this is acceptable
 * because only the wallet owner can later sign transactions from that address.
 * For production, require a signed message (SEP-10 auth).
 */
export async function POST(request: Request) {
  let body: CreateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate slug
  const slugResult = validateSlug(body.slug ?? "");
  if (!slugResult.ok) {
    return NextResponse.json({ error: slugResult.error }, { status: 400 });
  }

  // Validate wallet address format
  if (
    !body.walletAddress ||
    typeof body.walletAddress !== "string" ||
    !STELLAR_ADDRESS_REGEX.test(body.walletAddress)
  ) {
    return NextResponse.json(
      { error: "Invalid Stellar wallet address" },
      { status: 400 },
    );
  }

  // Validate display name
  if (
    !body.displayName ||
    typeof body.displayName !== "string" ||
    body.displayName.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Display name is required" },
      { status: 400 },
    );
  }
  if (body.displayName.length > 50) {
    return NextResponse.json(
      { error: "Display name must be 50 characters or less" },
      { status: 400 },
    );
  }

  // Validate bio (optional)
  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") {
      return NextResponse.json(
        { error: "Bio must be a string" },
        { status: 400 },
      );
    }
    if (body.bio.length > 280) {
      return NextResponse.json(
        { error: "Bio must be 280 characters or less" },
        { status: 400 },
      );
    }
  }

  try {
    const store = getCreatorsStore();
    const creator = await store.create({
      slug: slugResult.slug,
      walletAddress: body.walletAddress,
      displayName: body.displayName.trim(),
      bio: body.bio?.trim() || undefined,
    });
    return NextResponse.json(creator, { status: 201 });
  } catch (err) {
    if (err instanceof SlugTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof WalletAlreadyHasProfileError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create creator:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
