import { NextResponse } from "next/server";
import {
  badRequest,
  forbidden,
  notFound,
  parseJsonBody,
  serverError,
} from "@/lib/api-helpers";
import {
  getCreatorsStore,
  NotProfileOwnerError,
  validateSlug,
} from "@/lib/creators";

const DISPLAY_NAME_MAX = 50;
const BIO_MAX = 280;

type UpdateRequestBody = {
  walletAddress?: string;
  displayName?: string;
  bio?: string;
};

/**
 * GET /api/creators/[slug]
 * Fetch a creator profile by slug.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const slugResult = validateSlug(slug);
  if (!slugResult.ok) return badRequest(slugResult.error);

  const creator = await getCreatorsStore().get(slugResult.slug);
  if (!creator) return notFound("Creator not found");

  return NextResponse.json(creator);
}

/**
 * PATCH /api/creators/[slug]
 * Update a creator profile. Caller must include their walletAddress in the
 * body; it must match the profile's owner.
 *
 * Body: { walletAddress, displayName?, bio? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const slugResult = validateSlug(slug);
  if (!slugResult.ok) return badRequest(slugResult.error);

  const body = await parseJsonBody<UpdateRequestBody>(request);
  if (!body) return badRequest("Invalid JSON body");

  if (!body.walletAddress || typeof body.walletAddress !== "string") {
    return badRequest("walletAddress is required");
  }

  // Display name (optional update)
  let displayName: string | undefined;
  if (body.displayName !== undefined) {
    if (
      typeof body.displayName !== "string" ||
      body.displayName.trim().length === 0
    ) {
      return badRequest("Display name cannot be empty");
    }
    if (body.displayName.length > DISPLAY_NAME_MAX) {
      return badRequest(
        `Display name must be ${DISPLAY_NAME_MAX} characters or less`,
      );
    }
    displayName = body.displayName.trim();
  }

  // Bio (optional update)
  let bio: string | undefined;
  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") {
      return badRequest("Bio must be a string");
    }
    if (body.bio.length > BIO_MAX) {
      return badRequest(`Bio must be ${BIO_MAX} characters or less`);
    }
    bio = body.bio.trim() || undefined;
  }

  try {
    const updated = await getCreatorsStore().update(
      slugResult.slug,
      body.walletAddress,
      { displayName, bio },
    );
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof NotProfileOwnerError) {
      return forbidden(err.message);
    }
    if ((err as Error).message.includes("not found")) {
      return notFound("Creator not found");
    }
    console.error("Failed to update creator:", err);
    return serverError();
  }
}
