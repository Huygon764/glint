/**
 * Deploy the TipJar Soroban contract to Stellar testnet.
 *
 * Flow:
 *   1. Derive the server's Stellar keypair from TEST_MNEMONIC + SERVER_ACCOUNT_INDEX
 *   2. Read the compiled WASM from contracts/tipjar/target/wasm32v1-none/release
 *   3. Deploy via the Stellar CLI (simpler than manual rpc calls for deploy)
 *   4. Initialize the contract with `init(admin=server)`
 *   5. Print the contract ID — user should paste into .env.local as TIPJAR_CONTRACT_ID
 *
 * Prerequisites:
 *   - `stellar contract build` already ran (tipjar.wasm exists)
 *   - `.env.local` has TEST_MNEMONIC + SERVER_ACCOUNT_INDEX
 *   - Server account is funded with XLM (use Friendbot)
 *
 * Usage:
 *   pnpm tsx scripts/deploy-tipjar.ts
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair } from "@stellar/stellar-sdk";
import { mnemonicToSeed, validateMnemonic } from "bip39";
import { config as loadDotenv } from "dotenv";
import { derivePath } from "ed25519-hd-key";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

const WASM_PATH = resolve(
  "contracts/tipjar/target/wasm32v1-none/release/tipjar.wasm",
);

const NETWORK = "testnet";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const RPC_URL = "https://soroban-testnet.stellar.org";

async function main() {
  console.log("=== Deploy TipJar ===\n");

  // 1. Check WASM exists
  if (!existsSync(WASM_PATH)) {
    console.error(`✗ WASM not found at ${WASM_PATH}`);
    console.error("  Run: cd contracts/tipjar && stellar contract build");
    process.exit(1);
  }
  console.log(`✓ Found WASM: ${WASM_PATH}`);

  // 2. Derive server keypair from mnemonic
  const mnemonic = process.env.TEST_MNEMONIC;
  if (!mnemonic) {
    console.error("✗ TEST_MNEMONIC is missing in .env.local");
    process.exit(1);
  }
  if (!validateMnemonic(mnemonic)) {
    console.error("✗ TEST_MNEMONIC is not a valid BIP-39 mnemonic");
    process.exit(1);
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
  const serverKp = Keypair.fromRawEd25519Seed(key);
  const serverAddress = serverKp.publicKey();
  const serverSecret = serverKp.secret();

  console.log(`✓ Server account index: ${accountIndex}`);
  console.log(`✓ Server address     : ${serverAddress}`);
  console.log();

  // 3. Ensure a Stellar CLI identity exists for this account
  const identityName = `glint-server-${accountIndex}`;
  try {
    execSync(`stellar keys show ${identityName} 2>/dev/null`, {
      stdio: "pipe",
    });
    console.log(`✓ CLI identity '${identityName}' already exists`);
  } catch {
    console.log(`→ Creating CLI identity '${identityName}'...`);
    execSync(`stellar keys add ${identityName} --secret-key`, {
      input: serverSecret,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`✓ Identity created`);
  }

  // 4. Deploy the contract
  console.log("\n→ Deploying contract...");
  const deployCmd = `stellar contract deploy \
    --wasm ${WASM_PATH} \
    --source-account ${identityName} \
    --network ${NETWORK} \
    --rpc-url ${RPC_URL} \
    --network-passphrase "${NETWORK_PASSPHRASE}"`;

  const contractId = execSync(deployCmd, { encoding: "utf-8" })
    .trim()
    .split("\n")
    .filter((line) => line.startsWith("C"))
    .pop();

  if (!contractId) {
    console.error("✗ Could not parse contract ID from deploy output");
    process.exit(1);
  }

  console.log(`✓ Deployed: ${contractId}`);

  // 5. Initialize with admin = server address
  console.log("\n→ Initializing contract...");
  const initCmd = `stellar contract invoke \
    --id ${contractId} \
    --source-account ${identityName} \
    --network ${NETWORK} \
    --rpc-url ${RPC_URL} \
    --network-passphrase "${NETWORK_PASSPHRASE}" \
    -- init --admin ${serverAddress}`;

  try {
    execSync(initCmd, { stdio: "inherit" });
    console.log("✓ Initialized");
  } catch {
    console.log("(init may have already run — checking admin...)");
  }

  // 6. Verify admin
  const adminCmd = `stellar contract invoke \
    --id ${contractId} \
    --source-account ${identityName} \
    --network ${NETWORK} \
    --rpc-url ${RPC_URL} \
    --network-passphrase "${NETWORK_PASSPHRASE}" \
    -- admin`;
  const adminOut = execSync(adminCmd, { encoding: "utf-8" }).trim();
  console.log(`✓ Admin: ${adminOut}`);

  console.log("\n=== Deploy complete ===");
  console.log("\nAdd to .env.local:");
  console.log(`  TIPJAR_CONTRACT_ID=${contractId}`);
  console.log(`  SERVER_ACCOUNT_INDEX=${accountIndex}`);
}

main().catch((err) => {
  console.error("\n✗ Deploy failed:", err);
  process.exit(1);
});
