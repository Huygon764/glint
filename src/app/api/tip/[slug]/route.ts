import type { HTTPRequestContext } from "@x402/core/server";
import { getCreatorsStore, validateSlug } from "@/lib/creators";
import { NextHTTPAdapter } from "@/lib/next-http-adapter";
import { recordTipMessage } from "@/lib/tipjar";
import { getX402HttpServer } from "@/lib/x402-server";

const STELLAR_ADDRESS_REGEX = /^G[A-Z0-9]{55}$/;
const MAX_MESSAGE_LEN = 280;

type TipBody = {
  message?: string;
  from?: string;
  amount?: string;
};

/**
 * POST /api/tip/[slug]
 *
 * x402-protected tip endpoint for a specific creator.
 *
 * Flow:
 *   1. Client sends POST with optional JSON body: { message?, from?, amount? }
 *   2. Without X-PAYMENT → server returns 402 with payment requirements
 *      (price from query `amount`, payTo from creator DB)
 *   3. Client signs payment via Freighter, retries with X-PAYMENT header
 *   4. Facilitator verifies + settles USDC on-chain
 *   5. Server (optionally) records message on TipJar contract — non-blocking
 *   6. Server returns 200 with tip confirmation
 *
 * Message recording:
 *   - Only runs if client sent a `message` AND `from` in the body
 *   - Retries up to 3 times via tipjar client
 *   - If it still fails, we return 200 + `messageRecorded: false`
 *     (USDC transfer already succeeded — we don't want to hide that)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const slugResult = validateSlug(slug);
  if (!slugResult.ok) {
    return Response.json({ error: slugResult.error }, { status: 400 });
  }

  const creator = await getCreatorsStore().get(slugResult.slug);
  if (!creator) {
    return Response.json({ error: "Creator not found" }, { status: 404 });
  }

  // Parse optional body. Safe to call request.json() here — x402 server
  // only needs headers + path, not body.
  let body: TipBody = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as TipBody;
    }
  } catch {
    // No body or invalid JSON — fine, tip can proceed without a message.
  }

  // Validate optional message
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > MAX_MESSAGE_LEN) {
    return Response.json(
      { error: `Message must be ${MAX_MESSAGE_LEN} characters or less` },
      { status: 400 },
    );
  }

  // Validate optional from (tipper address)
  const from =
    typeof body.from === "string" && STELLAR_ADDRESS_REGEX.test(body.from)
      ? body.from
      : undefined;

  const server = await getX402HttpServer();

  const adapter = new NextHTTPAdapter(request);
  const context: HTTPRequestContext = {
    adapter,
    path: adapter.getPath(),
    method: adapter.getMethod(),
    paymentHeader: adapter.getHeader("x-payment"),
  };

  const result = await server.processHTTPRequest(context);

  if (result.type === "payment-error") {
    return new Response(JSON.stringify(result.response.body), {
      status: result.response.status,
      headers: result.response.headers,
    });
  }

  if (result.type === "no-payment-required") {
    return Response.json({ ok: true, paid: false });
  }

  // result.type === "payment-verified"
  // Settle payment on-chain via facilitator
  const settleResult = await server.processSettlement(
    result.paymentPayload,
    result.paymentRequirements,
    result.declaredExtensions,
  );

  if (!settleResult.success) {
    return new Response(JSON.stringify(settleResult.response.body), {
      status: settleResult.response.status,
      headers: settleResult.response.headers,
    });
  }

  // Record the tip on-chain via TipJar — ALWAYS, even if no message.
  // This makes TipJar the single source of truth for tip history (since
  // Horizon's /payments doesn't list Soroban SAC transfers).
  //
  // Non-blocking: if contract call fails after retries, we return 200
  // because USDC transfer already settled via x402. The tip shows as paid
  // but won't appear on the wall until the server recovers.
  let recordedOnChain: boolean | null = null;
  let recordError: string | null = null;

  if (from) {
    // amount comes from query param `amount`; convert decimal USDC → stroops
    const amountRaw = adapter.getQueryParam?.("amount");
    const amountStr = typeof amountRaw === "string" ? amountRaw : "0.01";
    const amountDecimal = Number.parseFloat(amountStr);
    const amountStroops = BigInt(
      Math.round(amountDecimal * 10_000_000), // 7 decimals
    );

    const record = await recordTipMessage(
      from,
      creator.walletAddress,
      amountStroops,
      message, // empty string is fine — means "tip without a message"
    );

    if (record.ok) {
      recordedOnChain = true;
    } else {
      recordedOnChain = false;
      recordError = record.error;
      console.error(`[tip/${creator.slug}] record_tip failed: ${record.error}`);
    }
  }

  const responseBody = {
    ok: true,
    slug: creator.slug,
    recipient: creator.walletAddress,
    paidAt: new Date().toISOString(),
    recordedOnChain,
    ...(recordError ? { recordError } : {}),
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...settleResult.headers,
    },
  });
}
