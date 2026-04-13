"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { Creator } from "@/lib/creators";
import { type FormStatus, isBusy } from "@/lib/form-status";

const DISPLAY_NAME_MAX = 50;
const BIO_MAX = 280;

type Props = {
  creator: Creator;
  onSave: (updates: {
    displayName: string;
    bio?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
};

/**
 * Edit form for a creator profile. Pre-fills from `creator`, delegates
 * saving to the parent via `onSave`.
 */
export function EditProfileForm({ creator, onSave }: Props) {
  const [displayName, setDisplayName] = useState(creator.displayName);
  const [bio, setBio] = useState(creator.bio ?? "");
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: "busy", label: "Saving..." });
    const result = await onSave({ displayName, bio });
    if (result.ok) {
      setStatus({ kind: "success", data: undefined });
      toast.success("Profile updated");
      setTimeout(() => setStatus({ kind: "idle" }), 2000);
    } else {
      setStatus({ kind: "error", message: result.error });
      toast.error(result.error);
    }
  }

  const saving = isBusy(status);

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-300 dark:border-gray-700 rounded p-6 space-y-4"
    >
      <h2 className="font-semibold">Edit profile</h2>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={DISPLAY_NAME_MAX}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 font-medium"
        >
          {status.kind === "busy" ? status.label : "Save changes"}
        </button>
        {status.kind === "success" && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved
          </span>
        )}
        {status.kind === "error" && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {status.message}
          </span>
        )}
      </div>
    </form>
  );
}
