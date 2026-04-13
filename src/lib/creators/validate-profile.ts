import { BIO_MAX, DISPLAY_NAME_MAX } from "./limits";

/**
 * Shared validators for creator profile fields.
 * Used by POST /api/creators (required) and PATCH /api/creators/[slug] (optional).
 */

export type FieldResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Validate a display name.
 *
 * Overloads:
 *   - `{ required: true }` → value must be a non-empty string
 *   - `{ required: false }` → `undefined` passes through unchanged
 */
export function validateDisplayName(
  raw: unknown,
  opts: { required: true },
): FieldResult<string>;
export function validateDisplayName(
  raw: unknown,
  opts: { required: false },
): FieldResult<string | undefined>;
export function validateDisplayName(
  raw: unknown,
  { required }: { required: boolean },
): FieldResult<string | undefined> {
  if (raw === undefined) {
    if (required) return { ok: false, error: "Display name is required" };
    return { ok: true, value: undefined };
  }

  if (typeof raw !== "string") {
    return { ok: false, error: "Display name must be a string" };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    if (required) return { ok: false, error: "Display name is required" };
    return { ok: false, error: "Display name cannot be empty" };
  }
  if (trimmed.length > DISPLAY_NAME_MAX) {
    return {
      ok: false,
      error: `Display name must be ${DISPLAY_NAME_MAX} characters or less`,
    };
  }

  return { ok: true, value: trimmed };
}

/**
 * Validate an optional bio. Empty/whitespace becomes `undefined`.
 */
export function validateBio(raw: unknown): FieldResult<string | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };

  if (typeof raw !== "string") {
    return { ok: false, error: "Bio must be a string" };
  }

  if (raw.length > BIO_MAX) {
    return { ok: false, error: `Bio must be ${BIO_MAX} characters or less` };
  }

  const trimmed = raw.trim();
  return { ok: true, value: trimmed.length > 0 ? trimmed : undefined };
}
