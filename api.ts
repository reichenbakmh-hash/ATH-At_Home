import type { ApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiRequestError extends Error {
  status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.status = error.status;
    this.name = "ApiRequestError";
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiRequestError({
      message: body?.message ?? "La requête a échoué.",
      status: response.status
    });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export const api = {
  get: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>(path, { method: "GET" }),
  post: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>(path, { method: "DELETE" })
};
