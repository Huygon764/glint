import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

/**
 * Stellar network configuration for Glint.
 * Currently testnet-only. Can be made configurable in a later phase.
 */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

/**
 * USDC classic asset issuer on Stellar testnet.
 * Source: Circle official docs
 * https://www.circle.com/en/multi-chain-usdc/stellar
 */
export const USDC_ASSET_CODE = "USDC";
export const USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const USDC_ASSET = new Asset(USDC_ASSET_CODE, USDC_ISSUER);

/**
 * Singleton Horizon server instance.
 * Safe to reuse across the app — all methods are stateless.
 */
let _server: Horizon.Server | null = null;
export function getServer(): Horizon.Server {
  if (!_server) {
    _server = new Horizon.Server(HORIZON_URL);
  }
  return _server;
}

/**
 * Extract XLM and USDC balances from a loaded account.
 * Returns null for balances that don't exist (no trustline, no native balance).
 */
export type AccountBalances = {
  xlm: string | null;
  usdc: string | null;
  hasUsdcTrustline: boolean;
};

export function parseBalances(
  account: Horizon.AccountResponse,
): AccountBalances {
  let xlm: string | null = null;
  let usdc: string | null = null;
  let hasUsdcTrustline = false;

  for (const balance of account.balances) {
    if (balance.asset_type === "native") {
      xlm = balance.balance;
    } else if (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === USDC_ASSET_CODE &&
      balance.asset_issuer === USDC_ISSUER
    ) {
      usdc = balance.balance;
      hasUsdcTrustline = true;
    }
  }

  return { xlm, usdc, hasUsdcTrustline };
}

/**
 * Load account balances for an address.
 * Returns zero balances if the account hasn't been funded yet (404 from Horizon).
 */
export async function loadBalances(address: string): Promise<AccountBalances> {
  try {
    const account = await getServer().loadAccount(address);
    return parseBalances(account);
  } catch (err) {
    // Horizon returns 404 for unfunded accounts
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return { xlm: "0", usdc: null, hasUsdcTrustline: false };
    }
    throw err;
  }
}

/**
 * Build an unsigned payment transaction (XLM).
 * Caller is responsible for signing and submitting via Freighter + Horizon.
 */
export async function buildXlmPaymentTx(
  sourceAddress: string,
  destination: string,
  amount: string,
): Promise<string> {
  const server = getServer();
  const source = await server.loadAccount(sourceAddress);

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(180)
    .build();

  return tx.toXDR();
}

/**
 * Submit a signed transaction XDR to Horizon.
 * Returns the transaction hash on success.
 */
export async function submitSignedTx(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await getServer().submitTransaction(tx);
  return result.hash;
}
