export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload.data as T;
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

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return true;
}
