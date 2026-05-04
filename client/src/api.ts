const TOKEN_KEY = "ttm_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type ApiError = { error: string };

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json: jsonBody, ...fetchOpts } = options;
  const headers: HeadersInit = { ...(fetchOpts.headers as HeadersInit) };
  const token = getToken();
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined = fetchOpts.body ?? undefined;
  if (jsonBody !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
    body = JSON.stringify(jsonBody);
  }
  const res = await fetch(path, { ...fetchOpts, headers, body });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const msg = typeof data === "object" && data && "error" in data ? String((data as ApiError).error) : res.statusText;
    throw new Error(msg);
  }
  return data as T;
}
