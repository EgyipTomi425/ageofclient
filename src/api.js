const API_BASE = '/age3ofserver/api';
const REQUEST_CACHE = new Map();

function buildCacheKey(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  return `${method}:${path}`;
}

export async function apiRequest(path, options = {}, cacheOptions = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const shouldCache = cacheOptions.enabled !== false && method === 'GET';
  const cacheKey = buildCacheKey(path, options);

  if (shouldCache && REQUEST_CACHE.has(cacheKey)) {
    const cached = REQUEST_CACHE.get(cacheKey);
    if (!cached.expiredAt || cached.expiredAt > Date.now()) {
      return cached.value;
    }
    REQUEST_CACHE.delete(cacheKey);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);

  if (shouldCache) {
    REQUEST_CACHE.set(cacheKey, {
      value: data,
      expiredAt: Date.now() + (cacheOptions.ttlMs ?? 15000),
    });
  }

  return data;
}

export { API_BASE };
