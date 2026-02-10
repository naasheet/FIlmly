type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const store = new Map<string, CacheEntry<any>>()

export function getCache<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function deleteByPrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}
