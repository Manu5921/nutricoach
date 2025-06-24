/**
 * Advanced Cache Manager with multiple storage backends
 * Supports in-memory, localStorage, sessionStorage, and Redis-like interfaces
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  storage?: 'memory' | 'localStorage' | 'sessionStorage' | 'custom';
  serialize?: boolean; // Whether to serialize complex objects
}

export interface CacheBackend {
  get(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
  clear(): void;
  keys(): string[];
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Memory Cache Backend
 */
class MemoryCacheBackend implements CacheBackend {
  private storage = new Map<string, string>();

  get(key: string): string | null {
    return this.storage.get(key) || null;
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

/**
 * LocalStorage Cache Backend
 */
class LocalStorageCacheBackend implements CacheBackend {
  private prefix: string;

  constructor(prefix = 'cache:') {
    this.prefix = prefix;
  }

  get(key: string): string | null {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch {
      // Storage full or disabled
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // Storage disabled
    }
  }

  clear(): void {
    try {
      const keys = this.keys();
      keys.forEach(key => this.delete(key.replace(this.prefix, '')));
    } catch {
      // Storage disabled
    }
  }

  keys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
}

/**
 * SessionStorage Cache Backend
 */
class SessionStorageCacheBackend implements CacheBackend {
  private prefix: string;

  constructor(prefix = 'cache:') {
    this.prefix = prefix;
  }

  get(key: string): string | null {
    try {
      return sessionStorage.getItem(this.prefix + key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      sessionStorage.setItem(this.prefix + key, value);
    } catch {
      // Storage full or disabled
    }
  }

  delete(key: string): void {
    try {
      sessionStorage.removeItem(this.prefix + key);
    } catch {
      // Storage disabled
    }
  }

  clear(): void {
    try {
      const keys = this.keys();
      keys.forEach(key => this.delete(key.replace(this.prefix, '')));
    } catch {
      // Storage disabled
    }
  }

  keys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
}

/**
 * Advanced Cache Manager
 */
export class CacheManager<T = any> {
  private backend: CacheBackend;
  private options: Required<CacheOptions>;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 300000, // 5 minutes default
      maxSize: 1000,
      storage: 'memory',
      serialize: true,
      ...options,
    };

    this.backend = this.createBackend();
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const rawEntry = this.backend.get(key);
    if (!rawEntry) {
      this.stats.misses++;
      return null;
    }

    try {
      const entry: CacheEntry<T> = JSON.parse(rawEntry);
      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access stats
      entry.accessCount++;
      entry.lastAccessed = now;
      this.backend.set(key, JSON.stringify(entry));

      this.stats.hits++;
      return entry.data;
    } catch {
      // Invalid entry, delete it
      this.delete(key);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check max size and evict if necessary
    this.evictIfNecessary();

    this.backend.set(key, JSON.stringify(entry));
    this.stats.sets++;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.backend.delete(key);
    this.stats.deletes++;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.backend.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.size(),
    };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.backend.keys().length;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return this.backend.keys();
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const keys = this.keys();
    let prunedCount = 0;

    keys.forEach(key => {
      const rawEntry = this.backend.get(key);
      if (rawEntry) {
        try {
          const entry: CacheEntry = JSON.parse(rawEntry);
          if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            prunedCount++;
          }
        } catch {
          this.delete(key);
          prunedCount++;
        }
      }
    });

    return prunedCount;
  }

  /**
   * Get or set pattern - returns cached value or sets and returns new value
   */
  async getOrSet<K = T>(
    key: string,
    factory: () => Promise<K> | K,
    ttl?: number
  ): Promise<K> {
    const cached = this.get(key) as K;
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value as any, ttl);
    return value;
  }

  /**
   * Create appropriate backend based on options
   */
  private createBackend(): CacheBackend {
    switch (this.options.storage) {
      case 'localStorage':
        return new LocalStorageCacheBackend();
      case 'sessionStorage':
        return new SessionStorageCacheBackend();
      case 'memory':
      default:
        return new MemoryCacheBackend();
    }
  }

  /**
   * Evict entries if cache is at max size
   */
  private evictIfNecessary(): void {
    const currentSize = this.size();
    if (currentSize >= this.options.maxSize) {
      // Use LRU eviction strategy
      const entries = this.keys()
        .map(key => {
          const rawEntry = this.backend.get(key);
          if (rawEntry) {
            try {
              const entry: CacheEntry = JSON.parse(rawEntry);
              return { key, ...entry };
            } catch {
              return null;
            }
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.lastAccessed - b!.lastAccessed);

      // Remove oldest 10% of entries
      const toRemove = Math.ceil(entries.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        if (entries[i]) {
          this.delete(entries[i]!.key);
        }
      }
    }
  }
}

/**
 * Factory functions for common cache configurations
 */
export const createMemoryCache = <T = any>(options?: Partial<CacheOptions>) =>
  new CacheManager<T>({ storage: 'memory', ...options });

export const createPersistentCache = <T = any>(options?: Partial<CacheOptions>) =>
  new CacheManager<T>({ storage: 'localStorage', ...options });

export const createSessionCache = <T = any>(options?: Partial<CacheOptions>) =>
  new CacheManager<T>({ storage: 'sessionStorage', ...options });

/**
 * Global cache instances for common use cases
 */
export const globalCache = createMemoryCache({ maxSize: 500, ttl: 300000 });
export const persistentCache = createPersistentCache({ maxSize: 200, ttl: 3600000 });
export const sessionCache = createSessionCache({ maxSize: 100, ttl: 1800000 });