/**
 * Universal API Client with retry logic and caching
 * Adaptable for multiple project types (nutrition, economics, etc.)
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  cache?: {
    enabled: boolean;
    ttl: number; // in milliseconds
  };
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
}

export class ApiClient {
  private config: ApiClientConfig;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      cache: { enabled: false, ttl: 300000 }, // 5 minutes default
      ...config,
    };
  }

  /**
   * Generic GET request with caching
   */
  async get<T>(
    endpoint: string,
    options?: {
      params?: Record<string, any>;
      headers?: Record<string, string>;
      cache?: boolean;
      cacheTtl?: number;
    }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);
    const cacheKey = `GET:${url}`;

    // Check cache first
    if (options?.cache !== false && this.config.cache?.enabled) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await this.executeWithRetry(() =>
      this.makeRequest('GET', url, undefined, options?.headers)
    );

    // Cache successful responses
    if (
      options?.cache !== false &&
      this.config.cache?.enabled &&
      response.status >= 200 &&
      response.status < 300
    ) {
      this.setCachedResponse(
        cacheKey,
        response,
        options?.cacheTtl || this.config.cache.ttl
      );
    }

    return response;
  }

  /**
   * Generic POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.executeWithRetry(() =>
      this.makeRequest('POST', url, data, options?.headers)
    );
  }

  /**
   * Generic PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.executeWithRetry(() =>
      this.makeRequest('PUT', url, data, options?.headers)
    );
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.executeWithRetry(() =>
      this.makeRequest('DELETE', url, undefined, options?.headers)
    );
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    request: () => Promise<ApiResponse<T>>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    const config: RetryConfig = {
      attempts: this.config.retryAttempts || 3,
      delay: this.config.retryDelay || 1000,
      backoff: 'exponential',
      retryCondition: (error) => error.status >= 500 || error.code === 'NETWORK_ERROR',
      ...retryConfig,
    };

    let lastError: any;

    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        return await request();
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors or if retry condition fails
        if (
          attempt === config.attempts ||
          (config.retryCondition && !config.retryCondition(error))
        ) {
          break;
        }

        // Calculate delay
        const delay =
          config.backoff === 'exponential'
            ? config.delay * Math.pow(2, attempt - 1)
            : config.delay * attempt;

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Make HTTP request
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        };
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw {
          code: 'TIMEOUT_ERROR',
          message: 'Request timeout',
          status: 408,
        };
      }

      if (!error.status) {
        throw {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          originalError: error,
        };
      }

      throw error;
    }
  }

  /**
   * Build URL with parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Get cached response
   */
  private getCachedResponse(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cached response
   */
  private setCachedResponse(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory for creating API clients
 */
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};

/**
 * Predefined API clients for common use cases
 */
export const createNutritionApiClient = (baseUrl: string, apiKey?: string) =>
  createApiClient({
    baseUrl,
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
    cache: { enabled: true, ttl: 300000 }, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000,
  });

export const createEconomicsApiClient = (baseUrl: string, apiKey?: string) =>
  createApiClient({
    baseUrl,
    headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
    cache: { enabled: true, ttl: 600000 }, // 10 minutes for economics data
    retryAttempts: 2,
    retryDelay: 2000,
  });