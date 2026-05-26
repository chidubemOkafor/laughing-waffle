type Entry = { data: unknown; expiresAt: number };

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<Response>>();

export type CachedFetchOptions = RequestInit & { ttl?: number };

export async function cachedFetch(url: string, options: CachedFetchOptions = {}): Promise<Response> {
  const { ttl = 60_000, ...init } = options;

  // Only cache GET-equivalent calls (no body / no mutating method)
  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return fetch(url, init);
  }

  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expiresAt > now) {
    return new Response(JSON.stringify(hit.data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Deduplicate concurrent requests for the same URL
  let req = inflight.get(url);
  if (!req) {
    req = fetch(url, init);
    inflight.set(url, req);
    req.finally(() => inflight.delete(url));
  }

  const res = await req;

  if (res.ok) {
    try {
      const clone = res.clone();
      const data = await clone.json();
      cache.set(url, { data, expiresAt: Date.now() + ttl });
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch {
      // non-JSON response — just return original, don't cache
    }
  }

  return res;
}

export function invalidateCache(pattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}
