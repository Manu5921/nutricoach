/**
 * Universal Supabase Client
 * Configurable database client for different environments
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    realtime?: {
      params?: Record<string, string>;
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}

export interface DatabaseClientOptions {
  environment?: 'development' | 'staging' | 'production' | 'test';
  useServiceRole?: boolean;
  enableRealtime?: boolean;
  enableAuth?: boolean;
}

/**
 * Universal Database Client Factory
 */
export class DatabaseClientFactory {
  private static instances = new Map<string, SupabaseClient>();

  /**
   * Create or get existing Supabase client
   */
  static createClient(
    config: DatabaseConfig,
    options: DatabaseClientOptions = {}
  ): SupabaseClient {
    const {
      environment = 'development',
      useServiceRole = false,
      enableRealtime = true,
      enableAuth = true,
    } = options;

    const key = useServiceRole ? config.serviceRoleKey! : config.anonKey;
    const instanceKey = `${config.url}-${key}-${environment}`;

    // Return existing instance if available
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    // Create new client
    const clientOptions = {
      auth: {
        autoRefreshToken: enableAuth,
        persistSession: enableAuth && environment !== 'test',
        detectSessionInUrl: enableAuth && environment !== 'test',
        ...config.options?.auth,
      },
      realtime: enableRealtime ? {
        params: {
          eventsPerSecond: environment === 'production' ? '10' : '100',
          ...config.options?.realtime?.params,
        },
      } : undefined,
      global: {
        headers: {
          'x-application-name': 'nutricoach',
          'x-environment': environment,
          ...config.options?.global?.headers,
        },
      },
    };

    const client = createClient(config.url, key, clientOptions);

    // Cache the instance
    this.instances.set(instanceKey, client);

    return client;
  }

  /**
   * Create client for server-side operations
   */
  static createServerClient(config: DatabaseConfig): SupabaseClient {
    if (!config.serviceRoleKey) {
      throw new Error('Service role key is required for server client');
    }

    return this.createClient(config, {
      useServiceRole: true,
      enableAuth: false,
      enableRealtime: false,
    });
  }

  /**
   * Create client for testing
   */
  static createTestClient(config: DatabaseConfig): SupabaseClient {
    return this.createClient(config, {
      environment: 'test',
      enableAuth: false,
      enableRealtime: false,
    });
  }

  /**
   * Clear all cached instances
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

/**
 * Database health check utilities
 */
export class DatabaseHealth {
  /**
   * Check database connectivity
   */
  static async checkConnectivity(client: SupabaseClient): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      const { error } = await client.from('_health_check').select('*').limit(1);
      const latency = Date.now() - start;

      if (error && !error.message.includes('does not exist')) {
        return { connected: false, error: error.message };
      }

      return { connected: true, latency };
    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Check authentication service
   */
  static async checkAuth(client: SupabaseClient): Promise<{
    available: boolean;
    error?: string;
  }> {
    try {
      // Try to get session without throwing
      const { data, error } = await client.auth.getSession();
      
      if (error) {
        return { available: false, error: error.message };
      }

      return { available: true };
    } catch (error: any) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Check realtime service
   */
  static async checkRealtime(client: SupabaseClient): Promise<{
    available: boolean;
    error?: string;
  }> {
    try {
      const channel = client.channel('health-check');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          channel.unsubscribe();
          resolve({ available: false, error: 'Timeout' });
        }, 5000);

        channel
          .on('broadcast', { event: 'test' }, () => {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve({ available: true });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'test',
                payload: {},
              });
            }
          });
      });
    } catch (error: any) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Comprehensive health check
   */
  static async fullHealthCheck(client: SupabaseClient): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    database: { connected: boolean; latency?: number; error?: string };
    auth: { available: boolean; error?: string };
    realtime: { available: boolean; error?: string };
    timestamp: string;
  }> {
    const [database, auth, realtime] = await Promise.all([
      this.checkConnectivity(client),
      this.checkAuth(client),
      this.checkRealtime(client),
    ]);

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!database.connected) {
      overall = 'unhealthy';
    } else if (!auth.available || !realtime.available) {
      overall = 'degraded';
    }

    return {
      overall,
      database,
      auth,
      realtime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Connection pool management
 */
export class DatabasePool {
  private static pools = new Map<string, SupabaseClient[]>();
  private static maxPoolSize = 10;

  /**
   * Get client from pool or create new one
   */
  static getClient(config: DatabaseConfig, poolKey = 'default'): SupabaseClient {
    const pool = this.pools.get(poolKey) || [];
    
    if (pool.length > 0) {
      return pool.pop()!;
    }

    return DatabaseClientFactory.createClient(config);
  }

  /**
   * Return client to pool
   */
  static returnClient(client: SupabaseClient, poolKey = 'default'): void {
    const pool = this.pools.get(poolKey) || [];
    
    if (pool.length < this.maxPoolSize) {
      pool.push(client);
      this.pools.set(poolKey, pool);
    }
  }

  /**
   * Clear all pools
   */
  static clearPools(): void {
    this.pools.clear();
  }

  /**
   * Set maximum pool size
   */
  static setMaxPoolSize(size: number): void {
    this.maxPoolSize = size;
  }
}

/**
 * Convenience functions
 */
export const createSupabaseClient = (config: DatabaseConfig, options?: DatabaseClientOptions) =>
  DatabaseClientFactory.createClient(config, options);

export const createServerSupabaseClient = (config: DatabaseConfig) =>
  DatabaseClientFactory.createServerClient(config);

export const createTestSupabaseClient = (config: DatabaseConfig) =>
  DatabaseClientFactory.createTestClient(config);

/**
 * Configuration presets for different environments
 */
export const createDevelopmentConfig = (url: string, anonKey: string): DatabaseConfig => ({
  url,
  anonKey,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: '100',
      },
    },
    global: {
      headers: {
        'x-environment': 'development',
      },
    },
  },
});

export const createProductionConfig = (
  url: string,
  anonKey: string,
  serviceRoleKey: string
): DatabaseConfig => ({
  url,
  anonKey,
  serviceRoleKey,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: '10',
      },
    },
    global: {
      headers: {
        'x-environment': 'production',
      },
    },
  },
});

export const createTestConfig = (url: string, anonKey: string): DatabaseConfig => ({
  url,
  anonKey,
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-environment': 'test',
      },
    },
  },
});