"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/hooks/useToast";

/* One way to run an admin write, so every form in the portal fails the same
 * way.
 *
 * The problem this replaces: the admin pages wrapped their saves in
 * `try { … } finally { setSaving(false) }` with no `catch`. The API layer
 * throws with the server's own message, so a rejected save became an
 * unhandled promise rejection: the modal stayed open, the spinner stopped,
 * and the administrator was shown nothing at all. A validation message as
 * specific as "Registration link must be a full URL" was being thrown away.
 *
 * `run` catches, shows the server's message in a toast, and reports whether
 * it worked so the caller knows whether to close the modal. The modal is
 * deliberately left open on failure: closing it would discard everything
 * the administrator had typed.
 */

/** Pulls something readable out of whatever was thrown. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Something went wrong. Please try again.";
}

export type AdminActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function useAdminAction() {
  const { success, error: errorToast } = useToast();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options: {
        /** Shown on success. Omit for an action that speaks for itself. */
        success?: string;
        /** Title on the error toast, e.g. "Could not save the event". */
        errorTitle?: string;
      } = {},
    ): Promise<AdminActionResult<T>> => {
      setPending(true);
      try {
        const data = await action();
        if (options.success) success(options.success);
        return { ok: true, data };
      } catch (caught) {
        const message = errorMessage(caught);
        errorToast(message, options.errorTitle);
        /* Kept for the browser console: the toast carries the message, but a
           stack is what tells you where it came from. */
        console.error(options.errorTitle ?? "Admin action failed", caught);
        return { ok: false, error: message };
      } finally {
        setPending(false);
      }
    },
    [success, errorToast],
  );

  return { run, pending };
}
