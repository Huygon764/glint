import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Liveness probe for Cloud Run + GitHub Actions deploy health check.
 * Always returns 200 as long as the Next.js server is up — does NOT
 * check downstream dependencies (Firestore, Horizon, x402 facilitator)
 * because a failing dependency shouldn't cause Cloud Run to restart
 * the container.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "glint",
    timestamp: new Date().toISOString(),
  });
}
