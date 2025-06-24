/**
 * Data Fetching Module
 * Universal API helpers, caching, and retry logic
 */

export {
  ApiClient,
  createApiClient,
  createNutritionApiClient,
  createEconomicsApiClient,
  type ApiClientConfig,
  type ApiResponse,
  type RetryConfig,
} from './api-client.js';

export {
  CacheManager,
  createMemoryCache,
  createPersistentCache,
  createSessionCache,
  globalCache,
  persistentCache,
  sessionCache,
  type CacheOptions,
  type CacheBackend,
  type CacheEntry,
} from './cache-manager.js';