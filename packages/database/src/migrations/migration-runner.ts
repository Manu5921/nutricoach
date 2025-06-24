/**
 * Database Migration Runner
 * Universal migration system for schema changes
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface Migration {
  id: string;
  name: string;
  up: (client: SupabaseClient) => Promise<void>;
  down: (client: SupabaseClient) => Promise<void>;
  dependencies?: string[];
  timestamp: string;
}

export interface MigrationRecord {
  id: string;
  name: string;
  executed_at: string;
  checksum: string;
}

export interface MigrationResult {
  id: string;
  name: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  duration: number;
}

/**
 * Migration Runner
 */
export class MigrationRunner {
  private client: SupabaseClient;
  private migrationsTable: string;

  constructor(client: SupabaseClient, migrationsTable = '_migrations') {
    this.client = client;
    this.migrationsTable = migrationsTable;
  }

  /**
   * Initialize migrations table
   */
  async initialize(): Promise<void> {
    const { error } = await this.client.rpc('create_migrations_table', {
      table_name: this.migrationsTable,
    });

    if (error && !error.message.includes('already exists')) {
      // Fallback: create table with raw SQL
      const { error: createError } = await this.client.sql`
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          checksum TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      if (createError) {
        throw new Error(`Failed to create migrations table: ${createError.message}`);
      }
    }
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const { data, error } = await this.client
      .from(this.migrationsTable)
      .select('*')
      .order('executed_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get executed migrations: ${error.message}`);
    }

    return data as MigrationRecord[];
  }

  /**
   * Record migration execution
   */
  async recordMigration(migration: Migration): Promise<void> {
    const checksum = await this.calculateChecksum(migration);

    const { error } = await this.client
      .from(this.migrationsTable)
      .insert({
        id: migration.id,
        name: migration.name,
        checksum,
        executed_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
  }

  /**
   * Remove migration record
   */
  async removeMigrationRecord(migrationId: string): Promise<void> {
    const { error } = await this.client
      .from(this.migrationsTable)
      .delete()
      .eq('id', migrationId);

    if (error) {
      throw new Error(`Failed to remove migration record: ${error.message}`);
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<MigrationResult[]> {
    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));

    // Sort migrations by timestamp
    const sortedMigrations = migrations.sort((a, b) => 
      a.timestamp.localeCompare(b.timestamp)
    );

    // Check dependencies
    this.validateDependencies(sortedMigrations);

    const results: MigrationResult[] = [];

    for (const migration of sortedMigrations) {
      if (executedIds.has(migration.id)) {
        results.push({
          id: migration.id,
          name: migration.name,
          status: 'skipped',
          duration: 0,
        });
        continue;
      }

      const startTime = Date.now();

      try {
        // Execute migration
        await migration.up(this.client);

        // Record successful execution
        await this.recordMigration(migration);

        const duration = Date.now() - startTime;

        results.push({
          id: migration.id,
          name: migration.name,
          status: 'success',
          duration,
        });

        console.log(`✓ Migration ${migration.name} completed in ${duration}ms`);
      } catch (error: any) {
        const duration = Date.now() - startTime;

        results.push({
          id: migration.id,
          name: migration.name,
          status: 'error',
          error: error.message,
          duration,
        });

        console.error(`✗ Migration ${migration.name} failed: ${error.message}`);
        
        // Stop on first error
        break;
      }
    }

    return results;
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(
    migrations: Migration[],
    targetMigrationId?: string
  ): Promise<MigrationResult[]> {
    const executedMigrations = await this.getExecutedMigrations();
    
    // Find migrations to rollback
    let migrationsToRollback: Migration[];
    
    if (targetMigrationId) {
      const targetIndex = executedMigrations.findIndex(m => m.id === targetMigrationId);
      if (targetIndex === -1) {
        throw new Error(`Target migration ${targetMigrationId} not found`);
      }
      migrationsToRollback = migrations.filter(m => 
        executedMigrations.slice(targetIndex + 1).some(em => em.id === m.id)
      );
    } else {
      // Rollback only the last migration
      const lastMigration = executedMigrations[executedMigrations.length - 1];
      migrationsToRollback = migrations.filter(m => m.id === lastMigration?.id);
    }

    // Sort in reverse order for rollback
    migrationsToRollback.reverse();

    const results: MigrationResult[] = [];

    for (const migration of migrationsToRollback) {
      const startTime = Date.now();

      try {
        // Execute rollback
        await migration.down(this.client);

        // Remove migration record
        await this.removeMigrationRecord(migration.id);

        const duration = Date.now() - startTime;

        results.push({
          id: migration.id,
          name: migration.name,
          status: 'success',
          duration,
        });

        console.log(`✓ Rollback ${migration.name} completed in ${duration}ms`);
      } catch (error: any) {
        const duration = Date.now() - startTime;

        results.push({
          id: migration.id,
          name: migration.name,
          status: 'error',
          error: error.message,
          duration,
        });

        console.error(`✗ Rollback ${migration.name} failed: ${error.message}`);
        
        // Stop on first error
        break;
      }
    }

    return results;
  }

  /**
   * Get migration status
   */
  async getStatus(migrations: Migration[]): Promise<{
    total: number;
    executed: number;
    pending: number;
    migrations: Array<{
      id: string;
      name: string;
      status: 'executed' | 'pending';
      executedAt?: string;
    }>;
  }> {
    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));

    const migrationStatus = migrations.map(migration => ({
      id: migration.id,
      name: migration.name,
      status: executedIds.has(migration.id) ? 'executed' as const : 'pending' as const,
      executedAt: executedMigrations.find(m => m.id === migration.id)?.executed_at,
    }));

    return {
      total: migrations.length,
      executed: migrationStatus.filter(m => m.status === 'executed').length,
      pending: migrationStatus.filter(m => m.status === 'pending').length,
      migrations: migrationStatus,
    };
  }

  /**
   * Validate migration dependencies
   */
  private validateDependencies(migrations: Migration[]): void {
    const migrationMap = new Map(migrations.map(m => [m.id, m]));

    for (const migration of migrations) {
      if (migration.dependencies) {
        for (const depId of migration.dependencies) {
          if (!migrationMap.has(depId)) {
            throw new Error(
              `Migration ${migration.id} depends on ${depId} which is not available`
            );
          }
        }
      }
    }
  }

  /**
   * Calculate migration checksum
   */
  private async calculateChecksum(migration: Migration): Promise<string> {
    const content = migration.up.toString() + migration.down.toString();
    
    // Simple checksum calculation (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }
}

/**
 * Migration utility functions
 */
export class MigrationUtils {
  /**
   * Create a new migration template
   */
  static createMigration(name: string): Migration {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = `${timestamp}-${name.toLowerCase().replace(/\s+/g, '-')}`;

    return {
      id,
      name,
      timestamp,
      up: async (client: SupabaseClient) => {
        // Implementation goes here
        console.log(`Running migration: ${name}`);
      },
      down: async (client: SupabaseClient) => {
        // Rollback implementation goes here
        console.log(`Rolling back migration: ${name}`);
      },
    };
  }

  /**
   * Create table migration
   */
  static createTableMigration(
    tableName: string,
    columns: Array<{ name: string; type: string; constraints?: string }>
  ): Migration {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = `${timestamp}-create-${tableName}`;

    return {
      id,
      name: `Create ${tableName} table`,
      timestamp,
      up: async (client: SupabaseClient) => {
        const columnDefs = columns
          .map(col => `${col.name} ${col.type} ${col.constraints || ''}`)
          .join(',\n  ');

        const { error } = await client.sql`
          CREATE TABLE ${tableName} (
            ${columnDefs}
          );
        `;

        if (error) {
          throw new Error(`Failed to create table ${tableName}: ${error.message}`);
        }
      },
      down: async (client: SupabaseClient) => {
        const { error } = await client.sql`DROP TABLE IF EXISTS ${tableName};`;

        if (error) {
          throw new Error(`Failed to drop table ${tableName}: ${error.message}`);
        }
      },
    };
  }

  /**
   * Add column migration
   */
  static addColumnMigration(
    tableName: string,
    columnName: string,
    columnType: string,
    constraints?: string
  ): Migration {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = `${timestamp}-add-${columnName}-to-${tableName}`;

    return {
      id,
      name: `Add ${columnName} to ${tableName}`,
      timestamp,
      up: async (client: SupabaseClient) => {
        const { error } = await client.sql`
          ALTER TABLE ${tableName} 
          ADD COLUMN ${columnName} ${columnType} ${constraints || ''};
        `;

        if (error) {
          throw new Error(`Failed to add column ${columnName}: ${error.message}`);
        }
      },
      down: async (client: SupabaseClient) => {
        const { error } = await client.sql`
          ALTER TABLE ${tableName} 
          DROP COLUMN IF EXISTS ${columnName};
        `;

        if (error) {
          throw new Error(`Failed to drop column ${columnName}: ${error.message}`);
        }
      },
    };
  }
}

/**
 * Convenience functions
 */
export const createMigrationRunner = (client: SupabaseClient, migrationsTable?: string) =>
  new MigrationRunner(client, migrationsTable);

export const createMigration = MigrationUtils.createMigration;
export const createTableMigration = MigrationUtils.createTableMigration;
export const addColumnMigration = MigrationUtils.addColumnMigration;