/**
 * Print the server wallet address derived from TEST_MNEMONIC + SERVER_ACCOUNT_INDEX.
 * Use this to verify + fund the account before running deploy-tipjar.ts.
 *
 * Usage:
 *   pnpm tsx scripts/show-server-address.ts
 */

import { Keypair } from "@stellar/stellar-sdk";
import { mnemonicToSeed, validateMnemonic } from "bip39";
import { config as loadDotenv } from "dotenv";
import { derivePath } from "ed25519-hd-key";

loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

async function main() {
  const mnemonic = process.env.TEST_MNEMONIC;
  if (!mnemonic) {
    console.error("✗ Missing TEST_MNEMONIC in .env.local");
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
  const kp = Keypair.fromRawEd25519Seed(key);

  console.log(`Account index : ${accountIndex}`);
  console.log(`Public key    : ${kp.publicKey()}`);
  console.log();
  console.log("Fund this account on testnet:");
  console.log(`  https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
}

main().catch((err) => {
  console.error("✗ Error:", err);
  process.exit(1);
});
