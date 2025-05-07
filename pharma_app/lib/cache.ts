import NodeCache from 'node-cache';

// Debug flag for development
const DEBUG = process.env.NODE_ENV !== 'production';

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
});

// Flag to determine if code is running on server
const isServer = typeof window === 'undefined';

/**
 * Get a value from cache or fetch it using the provided function
 * @param key Cache key
 * @param fetchFn Function to fetch the value if not in cache
 * @param ttl Time to live in seconds (optional)
 * @returns The cached or freshly fetched value
 */
export async function getOrFetchCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check if value exists in cache
  const cachedValue = cache.get<T>(key);
  
  if (cachedValue !== undefined) {
    if (DEBUG && isServer) console.log(`[CACHE] Hit: ${key}`);
    return cachedValue;
  }
  
  if (DEBUG && isServer) console.log(`[CACHE] Miss: ${key}`);
  
  try {
    // Fetch fresh data
    const freshData = await fetchFn();
    
    // Store in cache with optional TTL
    if (ttl !== undefined) {
      cache.set(key, freshData, ttl);
    } else {
      cache.set(key, freshData);
    }
    
    return freshData;
  } catch (error) {
    if (isServer) console.error(`[CACHE] Error fetching data for key ${key}:`, error);
    throw error;
  }
}

/**
 * Manually set a cached value with optional TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (optional)
 */
export function setCached<T>(key: string, value: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
  
  if (DEBUG && isServer) console.log(`[CACHE] Set: ${key}`);
}

/**
 * Invalidate a specific cache key
 * @param key Cache key to invalidate
 */
export function invalidateCache(key: string): void {
  cache.del(key);
  if (DEBUG && isServer) console.log(`[CACHE] Invalidated: ${key}`);
}

/**
 * Invalidate all keys matching a pattern
 * @param pattern RegExp pattern to match keys
 */
export function invalidateCachePattern(pattern: RegExp): void {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => pattern.test(key));
  
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
    if (DEBUG && isServer) console.log(`[CACHE] Invalidated ${matchingKeys.length} keys matching ${pattern}`);
  }
}

/**
 * Invalidate all cache
 */
export function invalidateAllCache(): void {
  cache.flushAll();
  if (DEBUG && isServer) console.log(`[CACHE] Flushed all cache`);
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
}

// Export the cache instance for direct access if needed
export default cache; 