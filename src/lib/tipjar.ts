import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  type xdr,
} from "@stellar/stellar-sdk";
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";

/**
 * TipJar contract client (server-side).
 *
 * Responsibilities:
 *   - Derive the server Stellar keypair from TEST_MNEMONIC + SERVER_ACCOUNT_INDEX
 *   - Call TipJar.record_tip() after a successful x402 settlement
 *   - Call TipJar.get_tips() to read the tipping wall
 *
 * This client is server-only. It uses the server's own secret key to sign
 * contract invocations, as per the Phase 6 design decision (the server is
 * the sole authorized writer of tip messages).
 */

const NETWORK_PASSPHRASE = Networks.TESTNET;
const DEFAULT_RPC_URL = "https://soroban-testnet.stellar.org";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Lazy-loaded server keypair. Derived once, cached for the process lifetime.
 */
let _serverKeypair: Keypair | null = null;

async function getServerKeypair(): Promise<Keypair> {
  if (_serverKeypair) return _serverKeypair;

  const mnemonic = process.env.TEST_MNEMONIC;
  if (!mnemonic) {
    throw new Error(
      "TEST_MNEMONIC is not set. The server needs a mnemonic to derive its signing key.",
    );
  }
  const accountIndex = Number.parseInt(
    process.env.SERVER_ACCOUNT_INDEX ?? "2",
    10,
  );

  const seed = await mnemonicToSeed(mnemonic);
  const { key } = derivePath(
    `m/44'/148'/${accountIndex}'`,
    seed.toString("hex"),
  );
  _serverKeypair = Keypair.fromRawEd25519Seed(key);
  return _serverKeypair;
}

function getRpcClient(): rpc.Server {
  const url = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? DEFAULT_RPC_URL;
  return new rpc.Server(url);
}

function getContractId(): string {
  const id = process.env.TIPJAR_CONTRACT_ID;
  if (!id) {
    throw new Error("TIPJAR_CONTRACT_ID is not set in env");
  }
  return id;
}

/**
 * Represents a tip message as returned by the contract.
 * Matches the Rust `TipMessage` struct.
 */
export type TipMessage = {
  from: string;
  amount: bigint;
  note: string;
  timestamp: bigint;
};

type SendResult = { ok: true; hash: string } | { ok: false; error: string };

/**
 * Invoke a contract function and wait for the result.
 * Handles simulate → sign → send → poll.
 */
async function invoke(fn: string, args: xdr.ScVal[]): Promise<SendResult> {
  const kp = await getServerKeypair();
  const rpcServer = getRpcClient();
  const contractId = getContractId();

  try {
    const sourceAccount = await rpcServer.getAccount(kp.publicKey());
    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(fn, ...args))
      .setTimeout(60)
      .build();

    // simulate + assemble footprint + auth + resource fee
    const prepared = await rpcServer.prepareTransaction(tx);
    prepared.sign(kp);

    const sendRes = await rpcServer.sendTransaction(prepared);
    if (sendRes.status !== "PENDING") {
      return {
        ok: false,
        error: `send failed: ${sendRes.status} ${JSON.stringify(
          sendRes.errorResult ?? {},
        )}`,
      };
    }

    // Poll for completion
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1000));
      const getRes = await rpcServer.getTransaction(sendRes.hash);
      if (getRes.status === "NOT_FOUND") continue;
      if (getRes.status === "SUCCESS") {
        return { ok: true, hash: sendRes.hash };
      }
      if (getRes.status === "FAILED") {
        return {
          ok: false,
          error: `tx failed: ${JSON.stringify(getRes.resultXdr ?? {})}`,
        };
      }
    }
    return { ok: false, error: "tx polling timed out" };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message ?? "unknown error",
    };
  }
}

/**
 * Record a tip message on-chain via the TipJar contract.
 *
 * Retries up to {@link MAX_RETRIES} times with a fixed delay on failure.
 * Returns `{ ok: true }` if any attempt succeeds, `{ ok: false }` if all
 * attempts fail. Callers should NOT fail the whole tip flow on a false
 * return — just log it and return a 200 with warning to the user. The
 * underlying USDC transfer has already settled via x402.
 */
export async function recordTipMessage(
  from: string,
  to: string,
  amount: bigint,
  note: string,
): Promise<SendResult> {
  const args = [
    new Address(from).toScVal(),
    new Address(to).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
    nativeToScVal(note, { type: "string" }),
  ];

  let lastError = "unknown";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await invoke("record_tip", args);
    if (result.ok) return result;

    lastError = result.error;
    console.warn(
      `[tipjar] record_tip attempt ${attempt}/${MAX_RETRIES} failed: ${result.error}`,
    );

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  return {
    ok: false,
    error: `record_tip failed after ${MAX_RETRIES} attempts: ${lastError}`,
  };
}

/**
 * Read all tip messages for a creator from the TipJar contract.
 *
 * This is a read-only call (simulation only, no transaction submission),
 * so it's fast and free. Returns messages in insertion order (oldest first).
 */
export async function getTipMessages(to: string): Promise<TipMessage[]> {
  const rpcServer = getRpcClient();
  const contractId = getContractId();
  const contract = new Contract(contractId);

  // For read-only calls we need a source account to simulate against.
  // We use the server keypair (no signing needed, just for account sequence).
  const kp = await getServerKeypair();
  const sourceAccount = await rpcServer.getAccount(kp.publicKey());

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_tips", new Address(to).toScVal()))
    .setTimeout(30)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`get_tips simulation failed: ${sim.error}`);
  }
  if (!rpc.Api.isSimulationSuccess(sim)) {
    return [];
  }

  const retval = sim.result?.retval;
  if (!retval) return [];

  const raw = scValToNative(retval) as Array<{
    from: string;
    amount: bigint;
    note: string;
    timestamp: bigint;
  }>;

  return raw.map((r) => ({
    from: r.from,
    amount: r.amount,
    note: r.note,
    timestamp: r.timestamp,
  }));
}
