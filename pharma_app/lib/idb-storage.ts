import { openDB, DBSchema } from 'idb';

interface PharmaDBSchema extends DBSchema {
  operations: {
    key: string;
    value: QueuedOperation;
    indexes: { 'by-timestamp': number };
  };
  cache: {
    key: string;
    value: any;
    indexes: { 'by-expiry': number };
  };
}

export interface QueuedOperation {
  id: string;
  type: 'payment' | 'order' | 'prescription';
  data: any;
  timestamp: number;
  attempts: number;
}

const DB_NAME = 'pharma-ai-db';
const DB_VERSION = 1;

// Initialize the database only in browser environments
const dbPromise = typeof window !== 'undefined' 
  ? openDB<PharmaDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create operations store for offline queue
        const operationsStore = db.createObjectStore('operations', { keyPath: 'id' });
        operationsStore.createIndex('by-timestamp', 'timestamp');
        
        // Create cache store for offline data
        const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
        cacheStore.createIndex('by-expiry', 'expiry');
      },
    })
  : null;

/**
 * Store an operation in the IndexedDB queue
 */
export async function queueOperation(operation: QueuedOperation): Promise<string> {
  if (!dbPromise) {
    console.warn('IndexedDB not available (server-side or unsupported browser)');
    return operation.id;
  }
  
  const db = await dbPromise;
  await db.put('operations', operation);
  return operation.id;
}

/**
 * Get all queued operations
 */
export async function getQueuedOperations(): Promise<QueuedOperation[]> {
  if (!dbPromise) {
    console.warn('IndexedDB not available (server-side or unsupported browser)');
    return [];
  }
  
  const db = await dbPromise;
  return db.getAllFromIndex('operations', 'by-timestamp');
}

/**
 * Remove an operation from the queue
 */
export async function removeOperation(id: string): Promise<void> {
  if (!dbPromise) {
    console.warn('IndexedDB not available (server-side or unsupported browser)');
    return;
  }
  
  const db = await dbPromise;
  await db.delete('operations', id);
}

/**
 * Update an operation in the queue
 */
export async function updateOperation(operation: QueuedOperation): Promise<void> {
  if (!dbPromise) {
    console.warn('IndexedDB not available (server-side or unsupported browser)');
    return;
  }
  
  const db = await dbPromise;
  await db.put('operations', operation);
}

/**
 * Store a data item in the cache
 */
export async function setCacheItem<T>(id: string, data: T, ttlSeconds = 3600): Promise<void> {
  if (!dbPromise) {
    console.warn('IndexedDB not available (server-side or unsupported browser)');
    return;
  }
  
  const db = await dbPromise;
  await db.put('cache', {
    id,
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Get a data item from the cache
 */
export async function getCacheItem<T>(id: string): Promise<T | null> {
  try {
    if (!dbPromise) {
      console.warn('IndexedDB not available (server-side or unsupported browser)');
      return null;
    }
    
    const db = await dbPromise;
    const item = await db.get('cache', id);
    
    if (!item) return null;
    
    // Check if item is expired
    if (item.expiry < Date.now()) {
      await db.delete('cache', id);
      return null;
    }
    
    return item.data as T;
  } catch (error) {
    console.error('Error accessing cache:', error);
    return null;
  }
}

/**
 * Clear expired cache items
 */
export async function clearExpiredCache(): Promise<void> {
  if (!dbPromise) {
    console.warn('IndexedDB not available (server-side or unsupported browser)');
    return;
  }
  
  const db = await dbPromise;
  const tx = db.transaction('cache', 'readwrite');
  const store = tx.objectStore('cache');
  const index = store.index('by-expiry');
  let cursor = await index.openCursor();
  
  const now = Date.now();
  while (cursor) {
    if (cursor.value.expiry < now) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
} 