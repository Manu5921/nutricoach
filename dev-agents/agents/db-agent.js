#!/usr/bin/env node

/**
 * 🗄️ DB AGENT - BASE DE DONNÉES
 * 
 * Spécialisation: PostgreSQL, Supabase, Migrations, RLS
 * Responsabilités: Schéma DB, migrations, optimisation, sécurité
 */

import { BaseAgent } from '../lib/base-agent.js';
import chalk from 'chalk';

class DBAgent extends BaseAgent {
  constructor() {
    super({
      id: 'db-agent',
      name: 'DB Agent',
      specialization: 'Base de données',
      color: 'green',
      capabilities: [
        'postgresql',
        'supabase',
        'migrations',
        'rls-policies',
        'query-optimization',
        'indexing',
        'backup-strategies',
        'data-modeling',
        'sql-generation',
        'type-generation'
      ],
      dependencies: [], // Aucune dépendance
      outputPaths: {
        migrations: 'supabase/migrations/',
        types: 'supabase/types.ts',
        helpers: 'supabase/client-helpers.ts',
        seeds: 'supabase/seed.sql',
        docs: 'supabase/README.md'
      }
    });

    this.dbSchema = {
      tables: new Map(),
      relationships: [],
      indexes: [],
      policies: [],
      functions: [],
      triggers: []
    };
  }

  /**
   * 🎯 TRAITEMENT DES TÂCHES DB
   */
  async processTask(task) {
    this.log(`🗄️ Traitement tâche DB: ${task.description}`);

    try {
      switch (task.type) {
        case 'schema':
          return await this.createSchema(task);
        case 'migration':
          return await this.createMigration(task);
        case 'rls-policy':
          return await this.createRLSPolicy(task);
        case 'index':
          return await this.createIndex(task);
        case 'function':
          return await this.createFunction(task);
        case 'optimization':
          return await this.optimizeQueries(task);
        case 'backup':
          return await this.setupBackup(task);
        case 'types':
          return await this.generateTypes(task);
        default:
          throw new Error(`Type de tâche DB non supporté: ${task.type}`);
      }
    } catch (error) {
      this.logError(`Erreur traitement tâche ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * 🏗️ CRÉATION DE SCHÉMA
   */
  async createSchema(task) {
    const { tableName, columns, relationships, policies } = task.spec;
    
    this.log(`🏗️ Création schéma: ${tableName}`);

    // Générer la migration de création de table
    const migrationSQL = this.generateCreateTableSQL(tableName, columns, relationships);
    
    // Générer les politiques RLS
    const rlsPolicies = policies ? this.generateRLSPolicies(tableName, policies) : '';
    
    // Générer les types TypeScript
    const typesTS = this.generateTableTypes(tableName, columns);
    
    // Générer les helpers client
    const helpersTS = this.generateClientHelpers(tableName, columns);

    const migrationName = `${Date.now()}_create_${tableName}_table.sql`;
    
    const files = [
      {
        path: `${this.config.outputPaths.migrations}${migrationName}`,
        content: migrationSQL + '\n\n' + rlsPolicies
      },
      {
        path: this.config.outputPaths.types,
        content: typesTS,
        append: true
      },
      {
        path: this.config.outputPaths.helpers,
        content: helpersTS,
        append: true
      }
    ];

    // Mettre à jour le schéma interne
    this.dbSchema.tables.set(tableName, {
      columns,
      relationships,
      policies,
      createdAt: new Date()
    });

    return {
      success: true,
      files,
      table: tableName,
      migration: migrationName,
      types: `${tableName}Type`,
      documentation: `Table ${tableName} créée avec RLS et types TypeScript`
    };
  }

  /**
   * 🔄 CRÉATION DE MIGRATION
   */
  async createMigration(task) {
    const { operation, tableName, changes } = task.spec;
    
    this.log(`🔄 Création migration: ${operation} sur ${tableName}`);

    let migrationSQL = '';
    
    switch (operation) {
      case 'add_column':
        migrationSQL = this.generateAddColumnSQL(tableName, changes.column);
        break;
      case 'modify_column':
        migrationSQL = this.generateModifyColumnSQL(tableName, changes.column);
        break;
      case 'drop_column':
        migrationSQL = this.generateDropColumnSQL(tableName, changes.columnName);
        break;
      case 'add_index':
        migrationSQL = this.generateAddIndexSQL(tableName, changes.index);
        break;
      case 'add_constraint':
        migrationSQL = this.generateAddConstraintSQL(tableName, changes.constraint);
        break;
    }

    const migrationName = `${Date.now()}_${operation}_${tableName}.sql`;
    
    const files = [
      {
        path: `${this.config.outputPaths.migrations}${migrationName}`,
        content: migrationSQL
      }
    ];

    return {
      success: true,
      files,
      migration: migrationName,
      operation,
      table: tableName,
      documentation: `Migration ${operation} appliquée à ${tableName}`
    };
  }

  /**
   * 🔒 CRÉATION POLITIQUES RLS
   */
  async createRLSPolicy(task) {
    const { tableName, policyName, operation, condition, role } = task.spec;
    
    this.log(`🔒 Création politique RLS: ${policyName} sur ${tableName}`);

    const policySQL = this.generateRLSPolicySQL(tableName, policyName, operation, condition, role);
    
    const migrationName = `${Date.now()}_rls_policy_${tableName}_${policyName}.sql`;
    
    const files = [
      {
        path: `${this.config.outputPaths.migrations}${migrationName}`,
        content: policySQL
      }
    ];

    return {
      success: true,
      files,
      policy: policyName,
      table: tableName,
      migration: migrationName,
      documentation: `Politique RLS ${policyName} créée pour ${tableName}`
    };
  }

  /**
   * 📊 CRÉATION D'INDEX
   */
  async createIndex(task) {
    const { tableName, indexName, columns, type = 'btree', unique = false } = task.spec;
    
    this.log(`📊 Création index: ${indexName} sur ${tableName}`);

    const indexSQL = this.generateCreateIndexSQL(tableName, indexName, columns, type, unique);
    
    const migrationName = `${Date.now()}_index_${indexName}.sql`;
    
    const files = [
      {
        path: `${this.config.outputPaths.migrations}${migrationName}`,
        content: indexSQL
      }
    ];

    return {
      success: true,
      files,
      index: indexName,
      table: tableName,
      columns,
      documentation: `Index ${indexName} créé sur ${tableName}(${columns.join(', ')})`
    };
  }

  /**
   * ⚡ FONCTION STORED
   */
  async createFunction(task) {
    const { functionName, returnType, parameters, body, language = 'plpgsql' } = task.spec;
    
    this.log(`⚡ Création fonction: ${functionName}`);

    const functionSQL = this.generateCreateFunctionSQL(functionName, returnType, parameters, body, language);
    
    const migrationName = `${Date.now()}_function_${functionName}.sql`;
    
    const files = [
      {
        path: `${this.config.outputPaths.migrations}${migrationName}`,
        content: functionSQL
      }
    ];

    return {
      success: true,
      files,
      function: functionName,
      migration: migrationName,
      documentation: `Fonction ${functionName} créée en ${language}`
    };
  }

  /**
   * 🔧 OPTIMISATION REQUÊTES
   */
  async optimizeQueries(task) {
    const { queries, performance } = task.spec;
    
    this.log('🔧 Optimisation requêtes');

    const optimizations = [];
    const newIndexes = [];

    for (const query of queries) {
      const analysis = this.analyzeQuery(query);
      const optimization = this.generateOptimization(analysis);
      
      optimizations.push(optimization);
      
      if (optimization.suggestedIndexes) {
        newIndexes.push(...optimization.suggestedIndexes);
      }
    }

    const files = [];
    
    if (newIndexes.length > 0) {
      const indexSQL = newIndexes.map(idx => this.generateCreateIndexSQL(
        idx.table, idx.name, idx.columns, idx.type
      )).join('\n\n');
      
      files.push({
        path: `${this.config.outputPaths.migrations}${Date.now()}_optimization_indexes.sql`,
        content: indexSQL
      });
    }

    return {
      success: true,
      files,
      optimizations,
      newIndexes: newIndexes.length,
      documentation: `Optimisation de ${queries.length} requêtes avec ${newIndexes.length} nouveaux index`
    };
  }

  /**
   * 💾 SETUP BACKUP
   */
  async setupBackup(task) {
    const { schedule, retention, compression = true } = task.spec;
    
    this.log('💾 Configuration backup');

    const backupScript = this.generateBackupScript(schedule, retention, compression);
    const restoreScript = this.generateRestoreScript();
    
    const files = [
      {
        path: 'supabase/scripts/backup.sh',
        content: backupScript
      },
      {
        path: 'supabase/scripts/restore.sh',
        content: restoreScript
      },
      {
        path: 'supabase/backup-config.json',
        content: JSON.stringify({ schedule, retention, compression }, null, 2)
      }
    ];

    return {
      success: true,
      files,
      schedule,
      retention,
      documentation: `Backup configuré avec rétention ${retention} et schedule ${schedule}`
    };
  }

  /**
   * 📝 GÉNÉRATION TYPES TYPESCRIPT
   */
  async generateTypes(task) {
    const { tables } = task.spec || { tables: Array.from(this.dbSchema.tables.keys()) };
    
    this.log('📝 Génération types TypeScript');

    let typesContent = `// Types générés automatiquement par DB Agent
// Ne pas modifier manuellement

`;

    for (const tableName of tables) {
      const tableSchema = this.dbSchema.tables.get(tableName);
      if (tableSchema) {
        typesContent += this.generateTableTypes(tableName, tableSchema.columns);
        typesContent += '\n\n';
      }
    }

    // Ajouter les types d'union et utilitaires
    typesContent += this.generateUtilityTypes();

    const files = [
      {
        path: this.config.outputPaths.types,
        content: typesContent
      }
    ];

    return {
      success: true,
      files,
      types: tables.map(t => `${t}Type`),
      documentation: `Types TypeScript générés pour ${tables.length} tables`
    };
  }

  /**
   * 🏗️ GÉNÉRATEURS SQL
   */
  generateCreateTableSQL(tableName, columns, relationships = []) {
    let sql = `-- Création table ${tableName}\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
    
    // Colonnes
    const columnDefs = columns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.notNull) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.default) def += ` DEFAULT ${col.default}`;
      
      return def;
    });
    
    sql += columnDefs.join(',\n');
    
    // Contraintes de clés étrangères
    if (relationships.length > 0) {
      const fkConstraints = relationships.map(rel => 
        `  CONSTRAINT fk_${tableName}_${rel.column} FOREIGN KEY (${rel.column}) REFERENCES ${rel.referencedTable}(${rel.referencedColumn})`
      );
      sql += ',\n' + fkConstraints.join(',\n');
    }
    
    sql += '\n);\n\n';
    
    // Activer RLS
    sql += `-- Activer Row Level Security\n`;
    sql += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
    
    // Index par défaut
    sql += `-- Index par défaut\n`;
    const primaryKeyCol = columns.find(col => col.primaryKey);
    if (primaryKeyCol && primaryKeyCol.name !== 'id') {
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${primaryKeyCol.name} ON public.${tableName}(${primaryKeyCol.name});\n`;
    }
    
    // Index sur les clés étrangères
    relationships.forEach(rel => {
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${rel.column} ON public.${tableName}(${rel.column});\n`;
    });
    
    return sql;
  }

  generateRLSPolicies(tableName, policies) {
    let sql = `-- Politiques RLS pour ${tableName}\n`;
    
    policies.forEach(policy => {
      sql += this.generateRLSPolicySQL(tableName, policy.name, policy.operation, policy.condition, policy.role);
      sql += '\n';
    });
    
    return sql;
  }

  generateRLSPolicySQL(tableName, policyName, operation, condition, role = 'authenticated') {
    return `CREATE POLICY "${policyName}" ON public.${tableName}
  AS PERMISSIVE FOR ${operation.toUpperCase()}
  TO ${role}
  USING (${condition});`;
  }

  generateCreateIndexSQL(tableName, indexName, columns, type = 'btree', unique = false) {
    const uniqueKeyword = unique ? 'UNIQUE ' : '';
    const columnsStr = columns.join(', ');
    
    return `-- Index ${indexName} sur ${tableName}
CREATE ${uniqueKeyword}INDEX IF NOT EXISTS ${indexName} 
ON public.${tableName} USING ${type} (${columnsStr});`;
  }

  generateCreateFunctionSQL(functionName, returnType, parameters, body, language) {
    const paramsList = parameters.map(p => `${p.name} ${p.type}`).join(', ');
    
    return `-- Fonction ${functionName}
CREATE OR REPLACE FUNCTION public.${functionName}(${paramsList})
RETURNS ${returnType}
LANGUAGE ${language}
SECURITY DEFINER
AS $$
${body}
$$;`;
  }

  generateAddColumnSQL(tableName, column) {
    return `-- Ajout colonne ${column.name} à ${tableName}
ALTER TABLE public.${tableName} 
ADD COLUMN ${column.name} ${column.type}${column.notNull ? ' NOT NULL' : ''}${column.default ? ` DEFAULT ${column.default}` : ''};`;
  }

  generateModifyColumnSQL(tableName, column) {
    return `-- Modification colonne ${column.name} de ${tableName}
ALTER TABLE public.${tableName} 
ALTER COLUMN ${column.name} TYPE ${column.type};`;
  }

  generateDropColumnSQL(tableName, columnName) {
    return `-- Suppression colonne ${columnName} de ${tableName}
ALTER TABLE public.${tableName} 
DROP COLUMN ${columnName};`;
  }

  /**
   * 📝 GÉNÉRATEURS TYPESCRIPT
   */
  generateTableTypes(tableName, columns) {
    const typeName = this.toPascalCase(tableName);
    
    let types = `// Type pour la table ${tableName}\n`;
    types += `export interface ${typeName} {\n`;
    
    columns.forEach(col => {
      const optional = !col.notNull ? '?' : '';
      const tsType = this.sqlTypeToTsType(col.type);
      types += `  ${col.name}${optional}: ${tsType};\n`;
    });
    
    types += `}\n\n`;
    
    // Type pour l'insertion (sans les champs auto-générés)
    types += `export interface ${typeName}Insert {\n`;
    columns.forEach(col => {
      if (!col.generated) {
        const optional = !col.notNull || col.default ? '?' : '';
        const tsType = this.sqlTypeToTsType(col.type);
        types += `  ${col.name}${optional}: ${tsType};\n`;
      }
    });
    types += `}\n\n`;
    
    // Type pour la mise à jour
    types += `export interface ${typeName}Update {\n`;
    columns.forEach(col => {
      if (!col.primaryKey && !col.generated) {
        const tsType = this.sqlTypeToTsType(col.type);
        types += `  ${col.name}?: ${tsType};\n`;
      }
    });
    types += `}\n`;
    
    return types;
  }

  generateClientHelpers(tableName, columns) {
    const typeName = this.toPascalCase(tableName);
    
    return `
// Helpers pour la table ${tableName}
export const ${tableName}Helpers = {
  // Sélectionner tous les enregistrements
  async getAll() {
    const { data, error } = await supabase
      .from('${tableName}')
      .select('*');
    
    if (error) throw error;
    return data as ${typeName}[];
  },

  // Sélectionner par ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('${tableName}')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as ${typeName};
  },

  // Créer un nouvel enregistrement
  async create(data: ${typeName}Insert) {
    const { data: result, error } = await supabase
      .from('${tableName}')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result as ${typeName};
  },

  // Mettre à jour un enregistrement
  async update(id: string, data: ${typeName}Update) {
    const { data: result, error } = await supabase
      .from('${tableName}')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result as ${typeName};
  },

  // Supprimer un enregistrement
  async delete(id: string) {
    const { error } = await supabase
      .from('${tableName}')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
`;
  }

  generateUtilityTypes() {
    return `// Types utilitaires
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Tables seront ajoutées ici
    };
    Views: {
      // Vues seront ajoutées ici
    };
    Functions: {
      // Fonctions seront ajoutées ici
    };
  };
}
`;
  }

  generateBackupScript(schedule, retention, compression) {
    return `#!/bin/bash
# Script de backup automatique Supabase
# Schedule: ${schedule}
# Retention: ${retention}

set -e

BACKUP_DIR="/var/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nutricoach_backup_$DATE.sql"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Backup avec compression
${compression ? 'pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/$BACKUP_FILE.gz"' : 'pg_dump $DATABASE_URL > "$BACKUP_DIR/$BACKUP_FILE"'}

# Nettoyage des anciens backups (${retention})
find $BACKUP_DIR -name "*.sql*" -mtime +${retention.match(/\d+/)[0]} -delete

echo "Backup completed: $BACKUP_FILE"
`;
  }

  generateRestoreScript() {
    return `#!/bin/bash
# Script de restauration Supabase

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Erreur: Fichier $BACKUP_FILE non trouvé"
    exit 1
fi

# Restaurer selon le type de fichier
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql $DATABASE_URL
else
    psql $DATABASE_URL < "$BACKUP_FILE"
fi

echo "Restauration complétée depuis: $BACKUP_FILE"
`;
  }

  /**
   * 🛠️ UTILITAIRES
   */
  sqlTypeToTsType(sqlType) {
    const typeMap = {
      'uuid': 'string',
      'text': 'string',
      'varchar': 'string',
      'char': 'string',
      'integer': 'number',
      'bigint': 'number',
      'smallint': 'number',
      'decimal': 'number',
      'numeric': 'number',
      'real': 'number',
      'double precision': 'number',
      'boolean': 'boolean',
      'timestamp': 'string',
      'timestamptz': 'string',
      'date': 'string',
      'time': 'string',
      'interval': 'string',
      'json': 'Json',
      'jsonb': 'Json',
      'array': 'Array<any>',
      'bytea': 'string'
    };

    // Extraire le type de base (sans les modifiers comme length)
    const baseType = sqlType.split('(')[0].toLowerCase();
    return typeMap[baseType] || 'any';
  }

  toPascalCase(str) {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  analyzeQuery(query) {
    return {
      tables: [],
      conditions: [],
      joins: [],
      performance: 'unknown'
    };
  }

  generateOptimization(analysis) {
    return {
      suggestedIndexes: [],
      rewrittenQuery: null,
      improvements: []
    };
  }
}

export { DBAgent };

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new DBAgent();
  
  const exampleTask = {
    id: 'db-users-table',
    type: 'schema',
    description: 'Créer la table users avec authentification',
    spec: {
      tableName: 'users',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
        { name: 'email', type: 'text', notNull: true, unique: true },
        { name: 'name', type: 'text', notNull: true },
        { name: 'avatar_url', type: 'text' },
        { name: 'created_at', type: 'timestamptz', default: 'now()', notNull: true },
        { name: 'updated_at', type: 'timestamptz', default: 'now()', notNull: true }
      ],
      policies: [
        {
          name: 'Users can view own profile',
          operation: 'select',
          condition: 'auth.uid() = id'
        },
        {
          name: 'Users can update own profile',
          operation: 'update',
          condition: 'auth.uid() = id'
        }
      ]
    }
  };

  agent.processTask(exampleTask)
    .then(result => {
      console.log('✅ Table créée:', result);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
    });
}