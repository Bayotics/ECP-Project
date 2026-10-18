export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

function reportInvalidSession(response: Response) {
  if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("ecp:session-invalid"));
}

async function parseResponse<T>(response: Response): Promise<T> {
  reportInvalidSession(response);
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload.data as T;
}

/**
 * Like `apiRequest`, but hands back the whole envelope rather than just
 * `data`. For the few routes that return a flag alongside the record, such
 * as registration reporting whether the verification email went out.
 */
export async function apiRequestEnvelope<T, E = Record<string, unknown>>(
  input: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T> & E> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => null)) as (ApiEnvelope<T> & E) | null;
  reportInvalidSession(response);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }
  return payload;
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

export async function apiDelete(input: string, init?: RequestInit): Promise<boolean> {
  const response = await fetch(input, {
    ...init,
    method: "DELETE",
    cache: "no-store",
  });
  reportInvalidSession(response);

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return true;
}
