import { getAuthToken } from "@/services";

const XANO_BASE_URL = "https://xbut-eryu-hhsg.f2.xano.io/api:bwh6Xc5O";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

type XanoFetchOptions = Omit<RequestInit, "body"> & {
  body?: JsonValue | FormData | null;
};

export async function xanoFetch<T>(path: string, options: XanoFetchOptions = {}): Promise<T> {
  const { body, headers: headersInit, ...requestOptions } = options;
  const headers = new Headers(headersInit);

  if (!headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${XANO_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
    body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Xano request failed (${response.status}) ${requestOptions.method || "GET"} ${path}: ${responseText || response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Xano request returned non-JSON payload for ${path}: ${text}`);
  }

  return (await response.json()) as T;
}

export { XANO_BASE_URL };
