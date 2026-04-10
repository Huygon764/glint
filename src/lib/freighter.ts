import {
  getAddress,
  isAllowed,
  isConnected,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "./stellar";

/**
 * Result type for Freighter operations.
 * Freighter API v6 returns `{ data..., error? }` instead of throwing.
 * We normalize to a tagged union for easier handling in UI.
 */
export type FreighterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Check if Freighter extension is installed AND this dApp is allowed.
 * Used for silent auto-reconnect on mount.
 */
export async function checkPreviouslyAllowed(): Promise<
  FreighterResult<string | null>
> {
  const conn = await isConnected();
  if (conn.error) return { ok: false, error: conn.error.message };
  if (!conn.isConnected) return { ok: true, value: null };

  const allowed = await isAllowed();
  if (allowed.error) return { ok: false, error: allowed.error.message };
  if (!allowed.isAllowed) return { ok: true, value: null };

  const addr = await getAddress();
  if (addr.error) return { ok: false, error: addr.error.message };
  if (!addr.address) return { ok: true, value: null };

  return { ok: true, value: addr.address };
}

/**
 * Full connect flow: check installed, prompt allow, return address.
 */
export async function connectFreighter(): Promise<FreighterResult<string>> {
  const conn = await isConnected();
  if (conn.error) return { ok: false, error: conn.error.message };
  if (!conn.isConnected) {
    return {
      ok: false,
      error: "Freighter extension not installed. Install from freighter.app",
    };
  }

  const allowed = await isAllowed();
  if (allowed.error) return { ok: false, error: allowed.error.message };

  if (!allowed.isAllowed) {
    const granted = await setAllowed();
    if (granted.error) {
      return { ok: false, error: granted.error.message };
    }
    if (!granted.isAllowed) {
      return { ok: false, error: "Connection rejected by user" };
    }
  }

  const addr = await getAddress();
  if (addr.error) return { ok: false, error: addr.error.message };
  if (!addr.address) {
    return { ok: false, error: "No address returned from Freighter" };
  }

  return { ok: true, value: addr.address };
}

/**
 * Sign a transaction XDR via Freighter.
 */
export async function signTxWithFreighter(
  unsignedXdr: string,
  signerAddress: string,
): Promise<FreighterResult<string>> {
  const signed = await signTransaction(unsignedXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signerAddress,
  });
  if (signed.error) return { ok: false, error: signed.error.message };
  return { ok: true, value: signed.signedTxXdr };
}
