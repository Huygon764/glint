import { NextResponse } from "next/server";
import {
  getCreatorsStore,
  NotProfileOwnerError,
  validateSlug,
} from "@/lib/creators";

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
  if (!slugResult.ok) {
    return NextResponse.json({ error: slugResult.error }, { status: 400 });
  }

  const store = getCreatorsStore();
  const creator = await store.get(slugResult.slug);

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

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
  if (!slugResult.ok) {
    return NextResponse.json({ error: slugResult.error }, { status: 400 });
  }

  let body: UpdateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.walletAddress || typeof body.walletAddress !== "string") {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400 },
    );
  }

  // Validate updates
  if (body.displayName !== undefined) {
    if (
      typeof body.displayName !== "string" ||
      body.displayName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Display name cannot be empty" },
        { status: 400 },
      );
    }
    if (body.displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 50 characters or less" },
        { status: 400 },
      );
    }
  }

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
    const updated = await store.update(slugResult.slug, body.walletAddress, {
      displayName: body.displayName?.trim(),
      bio: body.bio?.trim() || undefined,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof NotProfileOwnerError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if ((err as Error).message.includes("not found")) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }
    console.error("Failed to update creator:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
