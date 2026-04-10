import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type CreateCreatorInput,
  type Creator,
  type CreatorsStore,
  NotProfileOwnerError,
  SlugTakenError,
  type UpdateCreatorInput,
  WalletAlreadyHasProfileError,
} from "./types";

type StoreFile = {
  version: 1;
  creators: Creator[];
};

const EMPTY_STORE: StoreFile = { version: 1, creators: [] };

/**
 * Simple JSON file-based store for creator profiles.
 *
 * Suitable for local development and single-container deployments with a
 * persistent volume. Not suitable for multi-instance or serverless (Cloud
 * Run) because the filesystem is ephemeral and reads/writes are not atomic
 * across instances.
 *
 * For Cloud Run deployment, swap this out for a `FirestoreStore` or similar.
 */
export class JSONFileStore implements CreatorsStore {
  constructor(private readonly filePath: string) {}

  async get(slug: string): Promise<Creator | null> {
    const data = await this.load();
    return data.creators.find((c) => c.slug === slug) ?? null;
  }

  async getByWallet(walletAddress: string): Promise<Creator | null> {
    const data = await this.load();
    return data.creators.find((c) => c.walletAddress === walletAddress) ?? null;
  }

  async create(input: CreateCreatorInput): Promise<Creator> {
    const data = await this.load();

    if (data.creators.some((c) => c.slug === input.slug)) {
      throw new SlugTakenError(input.slug);
    }
    if (data.creators.some((c) => c.walletAddress === input.walletAddress)) {
      throw new WalletAlreadyHasProfileError(input.walletAddress);
    }

    const now = new Date().toISOString();
    const creator: Creator = {
      slug: input.slug,
      walletAddress: input.walletAddress,
      displayName: input.displayName,
      bio: input.bio,
      createdAt: now,
      updatedAt: now,
    };

    data.creators.push(creator);
    await this.save(data);
    return creator;
  }

  async update(
    slug: string,
    walletAddress: string,
    updates: UpdateCreatorInput,
  ): Promise<Creator> {
    const data = await this.load();
    const index = data.creators.findIndex((c) => c.slug === slug);
    if (index === -1) {
      throw new Error(`Creator with slug "${slug}" not found`);
    }

    const existing = data.creators[index];
    if (existing.walletAddress !== walletAddress) {
      throw new NotProfileOwnerError();
    }

    const updated: Creator = {
      ...existing,
      ...(updates.displayName !== undefined && {
        displayName: updates.displayName,
      }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
      updatedAt: new Date().toISOString(),
    };

    data.creators[index] = updated;
    await this.save(data);
    return updated;
  }

  async list(): Promise<Creator[]> {
    const data = await this.load();
    return [...data.creators];
  }

  /**
   * Load the store file. Returns empty store if the file doesn't exist.
   */
  private async load(): Promise<StoreFile> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as StoreFile;
      if (parsed.version !== 1) {
        throw new Error(
          `Unsupported store file version: ${parsed.version}. Expected 1.`,
        );
      }
      return parsed;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return { ...EMPTY_STORE };
      }
      throw err;
    }
  }

  /**
   * Persist the store file. Creates the parent directory if missing.
   */
  private async save(data: StoreFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}
