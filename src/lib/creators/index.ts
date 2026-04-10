import { resolve } from "node:path";
import { JSONFileStore } from "./json-file-store";
import type { CreatorsStore } from "./types";

/**
 * Returns the active creators store singleton.
 *
 * Currently always returns a `JSONFileStore` pointing at `CREATORS_STORE_PATH`
 * (default `.data/creators.json`). In Phase 5 this will switch to a Firestore
 * implementation when `STORE_TYPE=firestore`.
 */
let _store: CreatorsStore | null = null;

export function getCreatorsStore(): CreatorsStore {
  if (!_store) {
    const storePath = resolve(
      process.env.CREATORS_STORE_PATH ?? ".data/creators.json",
    );
    _store = new JSONFileStore(storePath);
  }
  return _store;
}

export { validateSlug } from "./slug";
export * from "./types";
