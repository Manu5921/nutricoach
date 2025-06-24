import ky from 'ky';
import { z } from 'zod';
import type { ApiResponse, PaginatedResponse } from '@nutricoach/shared-types';

// Configuration
interface DataFetchingConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
}

const defaultConfig: DataFetchingConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retries: 3,
};

// API Client avec retry et cache
export class ApiClient {
  private client: typeof ky;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(config: Partial<DataFetchingConfig> = {}) {
    const finalConfig = { ...defaultConfig, ...config };
    
    this.client = ky.create({
      prefixUrl: finalConfig.baseUrl,
      timeout: finalConfig.timeout,
      retry: finalConfig.retries,
      headers: {
        'Content-Type': 'application/json',
        ...finalConfig.headers,
      },
      hooks: {
        beforeRequest: [
          (request) => {
            console.log(`🔄 API Request: ${request.method} ${request.url}`);
          }
        ],
        afterResponse: [
          (_request, _options, response) => {
            console.log(`✅ API Response: ${response.status} ${response.url}`);
          }
        ],
        beforeError: [
          (error) => {
            console.error(`❌ API Error: ${error.message}`);
            return error;
          }
        ]
      }
    });
  }

  // GET avec cache optionnel
  async get<T>(url: string, options?: { cache?: boolean; schema?: z.ZodSchema<T> }): Promise<T> {
    const cacheKey = `GET:${url}`;
    
    // Vérifier le cache
    if (options?.cache) {
      const cached = this.getCached<T>(cacheKey);
      if (cached) return cached;
    }

    const response = await this.client.get(url).json<T>();
    
    // Valider avec Zod si schéma fourni
    if (options?.schema) {
      const validated = options.schema.parse(response);
      if (options.cache) this.setCache(cacheKey, validated);
      return validated;
    }

    if (options?.cache) this.setCache(cacheKey, response);
    return response;
  }

  // POST avec validation
  async post<T, R = T>(
    url: string, 
    data: T, 
    options?: { schema?: z.ZodSchema<R> }
  ): Promise<R> {
    const response = await this.client.post(url, { json: data }).json<R>();
    
    if (options?.schema) {
      return options.schema.parse(response);
    }
    
    return response;
  }

  // PUT avec validation
  async put<T, R = T>(
    url: string, 
    data: T, 
    options?: { schema?: z.ZodSchema<R> }
  ): Promise<R> {
    const response = await this.client.put(url, { json: data }).json<R>();
    
    if (options?.schema) {
      return options.schema.parse(response);
    }
    
    return response;
  }

  // DELETE
  async delete<T>(url: string, options?: { schema?: z.ZodSchema<T> }): Promise<T> {
    const response = await this.client.delete(url).json<T>();
    
    if (options?.schema) {
      return options.schema.parse(response);
    }
    
    return response;
  }

  // Gestion du cache
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Nettoyer le cache
  clearCache(): void {
    this.cache.clear();
  }

  // Statistiques du cache
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instance globale
export const apiClient = new ApiClient();

// Helper pour les réponses paginées
export async function fetchPaginated<T>(
  url: string,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<PaginatedResponse<T>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const finalUrl = queryString ? `${url}?${queryString}` : url;

  return apiClient.get<PaginatedResponse<T>>(finalUrl, { cache: true });
}

// Helper pour les uploads de fichiers
export async function uploadFile(
  file: File,
  endpoint: string = '/upload'
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${defaultConfig.baseUrl}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

// Types d'export
export type { DataFetchingConfig, ApiResponse, PaginatedResponse };