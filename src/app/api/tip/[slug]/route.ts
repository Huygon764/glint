import type { HTTPRequestContext } from "@x402/core/server";
import { getCreatorsStore, validateSlug } from "@/lib/creators";
import { NextHTTPAdapter } from "@/lib/next-http-adapter";
import { getX402HttpServer } from "@/lib/x402-server";

/**
 * POST /api/tip/[slug]
 *
 * x402-protected tip endpoint for a specific creator.
 *
 * Flow:
 *   1. Request without X-PAYMENT → 402 with requirements
 *      (price = query param `amount`, payTo = creator's wallet from DB)
 *   2. Client signs auth entry via Freighter
 *   3. Client retries with X-PAYMENT header
 *   4. Facilitator verifies + settles on-chain
 *   5. Server returns 200 with tip confirmation
 *
 * The recipient address is resolved dynamically from the slug by the
 * x402 server's `DynamicPayTo` callback (see lib/x402-server.ts).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Validate slug format before touching the x402 server
  const slugResult = validateSlug(slug);
  if (!slugResult.ok) {
    return Response.json({ error: slugResult.error }, { status: 400 });
  }

  // Pre-check creator exists — gives a clearer 404 than the x402 error path
  const creator = await getCreatorsStore().get(slugResult.slug);
  if (!creator) {
    return Response.json({ error: "Creator not found" }, { status: 404 });
  }

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
    // Route is payment-gated — this branch shouldn't fire.
    return Response.json({ ok: true, paid: false });
  }

  // result.type === "payment-verified"
  const responseBody = {
    ok: true,
    slug: creator.slug,
    recipient: creator.walletAddress,
    paidAt: new Date().toISOString(),
  };

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

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...settleResult.headers,
    },
  });
}
