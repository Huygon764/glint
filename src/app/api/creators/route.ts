import { NextResponse } from "next/server";
import {
  badRequest,
  conflict,
  parseJsonBody,
  serverError,
} from "@/lib/api-helpers";
import {
  getCreatorsStore,
  SlugTakenError,
  validateSlug,
  WalletAlreadyHasProfileError,
} from "@/lib/creators";
import { isValidStellarAddress } from "@/lib/stellar";

const DISPLAY_NAME_MAX = 50;
const BIO_MAX = 280;

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
  const body = await parseJsonBody<CreateRequestBody>(request);
  if (!body) return badRequest("Invalid JSON body");

  const slugResult = validateSlug(body.slug ?? "");
  if (!slugResult.ok) return badRequest(slugResult.error);

  if (!isValidStellarAddress(body.walletAddress)) {
    return badRequest("Invalid Stellar wallet address");
  }

  // Display name
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (displayName.length === 0) {
    return badRequest("Display name is required");
  }
  if (displayName.length > DISPLAY_NAME_MAX) {
    return badRequest(
      `Display name must be ${DISPLAY_NAME_MAX} characters or less`,
    );
  }

  // Bio (optional)
  if (body.bio !== undefined && typeof body.bio !== "string") {
    return badRequest("Bio must be a string");
  }
  const bio = body.bio?.trim();
  if (bio !== undefined && bio.length > BIO_MAX) {
    return badRequest(`Bio must be ${BIO_MAX} characters or less`);
  }

  try {
    const creator = await getCreatorsStore().create({
      slug: slugResult.slug,
      walletAddress: body.walletAddress,
      displayName,
      bio: bio || undefined,
    });
    return NextResponse.json(creator, { status: 201 });
  } catch (err) {
    if (
      err instanceof SlugTakenError ||
      err instanceof WalletAlreadyHasProfileError
    ) {
      return conflict(err.message);
    }
    console.error("Failed to create creator:", err);
    return serverError();
  }
}
