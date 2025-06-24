/**
 * Universal Query Helpers
 * Reusable database query utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Universal Query Builder
 */
export class QueryBuilder {
  /**
   * Build paginated query
   */
  static async paginate<T>(
    client: SupabaseClient,
    table: string,
    options: PaginationOptions & Omit<QueryOptions, 'limit' | 'offset'>
  ): Promise<PaginatedResult<T>> {
    const { page, limit, select = '*', orderBy, orderDirection = 'desc', filters } = options;
    const offset = (page - 1) * limit;

    // Build base query
    let query = client.from(table).select(select, { count: 'exact' });

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.like(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Build search query
   */
  static async search<T>(
    client: SupabaseClient,
    table: string,
    searchTerm: string,
    searchFields: string[],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { select = '*', limit = 50, orderBy, orderDirection = 'desc' } = options;

    let query = client.from(table).select(select);

    // Build search conditions
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields
        .map(field => `${field}.ilike.%${searchTerm}%`)
        .join(',');
      
      query = query.or(searchConditions);
    }

    // Apply additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return data as T[];
  }

  /**
   * Build filtered query
   */
  static async filter<T>(
    client: SupabaseClient,
    table: string,
    filters: Record<string, any>,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { select = '*', limit, orderBy, orderDirection = 'desc' } = options;

    let query = client.from(table).select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value.min !== undefined) {
          // Range filter
          if (value.min !== undefined) query = query.gte(key, value.min);
          if (value.max !== undefined) query = query.lte(key, value.max);
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.like(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Filter failed: ${error.message}`);
    }

    return data as T[];
  }

  /**
   * Upsert (insert or update)
   */
  static async upsert<T>(
    client: SupabaseClient,
    table: string,
    data: Partial<T> | Partial<T>[],
    options: {
      onConflict?: string;
      ignoreDuplicates?: boolean;
      returning?: string;
    } = {}
  ): Promise<T[]> {
    const { onConflict, ignoreDuplicates = false, returning = '*' } = options;

    let query = client.from(table).upsert(data, {
      onConflict,
      ignoreDuplicates,
    });

    if (returning !== 'minimal') {
      query = query.select(returning);
    }

    const { data: result, error } = await query;

    if (error) {
      throw new Error(`Upsert failed: ${error.message}`);
    }

    return result as T[];
  }

  /**
   * Soft delete (set deleted_at timestamp)
   */
  static async softDelete(
    client: SupabaseClient,
    table: string,
    id: string,
    options: {
      idColumn?: string;
      deletedAtColumn?: string;
      returning?: string;
    } = {}
  ): Promise<any> {
    const { 
      idColumn = 'id', 
      deletedAtColumn = 'deleted_at', 
      returning = '*' 
    } = options;

    const { data, error } = await client
      .from(table)
      .update({ [deletedAtColumn]: new Date().toISOString() })
      .eq(idColumn, id)
      .select(returning);

    if (error) {
      throw new Error(`Soft delete failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Restore soft deleted record
   */
  static async restore(
    client: SupabaseClient,
    table: string,
    id: string,
    options: {
      idColumn?: string;
      deletedAtColumn?: string;
      returning?: string;
    } = {}
  ): Promise<any> {
    const { 
      idColumn = 'id', 
      deletedAtColumn = 'deleted_at', 
      returning = '*' 
    } = options;

    const { data, error } = await client
      .from(table)
      .update({ [deletedAtColumn]: null })
      .eq(idColumn, id)
      .select(returning);

    if (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Batch operations
   */
  static async batch<T>(
    client: SupabaseClient,
    operations: Array<{
      table: string;
      operation: 'insert' | 'update' | 'delete' | 'upsert';
      data?: any;
      filters?: Record<string, any>;
      options?: any;
    }>
  ): Promise<T[]> {
    const results: T[] = [];

    // Execute operations in sequence to maintain consistency
    for (const op of operations) {
      try {
        let query;
        
        switch (op.operation) {
          case 'insert':
            query = client.from(op.table).insert(op.data);
            break;
          case 'update':
            query = client.from(op.table).update(op.data);
            if (op.filters) {
              Object.entries(op.filters).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            }
            break;
          case 'delete':
            query = client.from(op.table).delete();
            if (op.filters) {
              Object.entries(op.filters).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            }
            break;
          case 'upsert':
            query = client.from(op.table).upsert(op.data, op.options);
            break;
          default:
            throw new Error(`Unknown operation: ${op.operation}`);
        }

        const { data, error } = await query.select('*');

        if (error) {
          throw new Error(`Batch operation failed: ${error.message}`);
        }

        results.push(...(data as T[]));
      } catch (error) {
        // Rollback previous operations if needed
        throw error;
      }
    }

    return results;
  }

  /**
   * Count records with filters
   */
  static async count(
    client: SupabaseClient,
    table: string,
    filters: Record<string, any> = {}
  ): Promise<number> {
    let query = client.from(table).select('*', { count: 'exact', head: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    const { count, error } = await query;

    if (error) {
      throw new Error(`Count failed: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if record exists
   */
  static async exists(
    client: SupabaseClient,
    table: string,
    filters: Record<string, any>
  ): Promise<boolean> {
    const count = await this.count(client, table, filters);
    return count > 0;
  }
}

/**
 * Convenience functions
 */
export const paginate = QueryBuilder.paginate;
export const search = QueryBuilder.search;
export const filter = QueryBuilder.filter;
export const upsert = QueryBuilder.upsert;
export const softDelete = QueryBuilder.softDelete;
export const restore = QueryBuilder.restore;
export const batch = QueryBuilder.batch;
export const count = QueryBuilder.count;
export const exists = QueryBuilder.exists;