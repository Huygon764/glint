import {
  HTTPFacilitatorClient,
  type RoutesConfig,
  x402HTTPResourceServer,
  x402ResourceServer,
} from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";

/**
 * Environment configuration for x402 server.
 * All values come from env vars — no secrets hardcoded.
 */
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator";

const STELLAR_NETWORK =
  (process.env.X402_STELLAR_NETWORK as "stellar:testnet" | "stellar:pubnet") ??
  "stellar:testnet";

const TEST_RECIPIENT_ADDRESS = process.env.X402_TEST_RECIPIENT_ADDRESS ?? "";

/**
 * Build the framework-agnostic x402 resource server.
 * Reused across all x402-protected API routes.
 */
function buildResourceServer(): x402ResourceServer {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  return new x402ResourceServer(facilitatorClient).register(
    STELLAR_NETWORK,
    new ExactStellarScheme(),
  );
}

/**
 * Route configuration for the Phase 2 test endpoint.
 * Uses a fixed recipient from env — Phase 3 will parameterize per creator.
 */
function buildTestRoutes(): RoutesConfig {
  if (!TEST_RECIPIENT_ADDRESS) {
    throw new Error(
      "X402_TEST_RECIPIENT_ADDRESS is required in .env.local for the x402 test route",
    );
  }

  return {
    "POST /api/tip/test": {
      accepts: [
        {
          scheme: "exact",
          price: "0.01",
          network: STELLAR_NETWORK,
          payTo: TEST_RECIPIENT_ADDRESS,
        },
      ],
      description: "Test tip (Phase 2 verification)",
      mimeType: "application/json",
    },
  };
}

/**
 * Lazily initialize and cache the HTTP resource server.
 * `.initialize()` fetches facilitator /supported — do this once per process.
 */
let _httpServerPromise: Promise<x402HTTPResourceServer> | null = null;

export async function getX402HttpServer(): Promise<x402HTTPResourceServer> {
  if (!_httpServerPromise) {
    _httpServerPromise = (async () => {
      const resourceServer = buildResourceServer();
      const httpServer = new x402HTTPResourceServer(
        resourceServer,
        buildTestRoutes(),
      );
      await httpServer.initialize();
      return httpServer;
    })();
  }
  return _httpServerPromise;
}
