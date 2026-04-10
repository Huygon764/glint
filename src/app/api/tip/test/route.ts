import type { HTTPRequestContext } from "@x402/core/server";
import { NextHTTPAdapter } from "@/lib/next-http-adapter";
import { getX402HttpServer } from "@/lib/x402-server";

/**
 * Phase 2 test endpoint — verifies x402 payment flow end-to-end.
 *
 * Flow:
 *   1. Client POSTs without X-PAYMENT → returns 402 with payment requirements.
 *   2. Client signs a payment and retries with X-PAYMENT header.
 *   3. Server verifies via Coinbase facilitator.
 *   4. Server runs business logic (just echo for now).
 *   5. Server settles on-chain via facilitator.
 *   6. Server returns 200 with X-PAYMENT-RESPONSE header.
 */
export async function POST(request: Request) {
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
    // Route is configured to require payment — this branch shouldn't hit,
    // but return a safe default.
    return Response.json({ ok: true, paid: false });
  }

  // result.type === "payment-verified"
  // Business logic: for Phase 2 this is just an echo.
  const responseBody = {
    ok: true,
    message: "Tip received",
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
