#!/usr/bin/env node

/**
 * 🚀 SETUP SCRIPT - SYSTÈME MULTI-AGENTS NUTRICOACH
 * 
 * Script d'initialisation et de configuration du système d'agents
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

class AgentsSetup {
  constructor() {
    this.setupSteps = [
      { name: 'Vérification des prérequis', action: () => this.checkPrerequisites() },
      { name: 'Création des dossiers', action: () => this.createDirectories() },
      { name: 'Configuration des permissions', action: () => this.setupPermissions() },
      { name: 'Validation du système', action: () => this.validateSystem() },
      { name: 'Génération des exemples', action: () => this.generateExamples() }
    ];
  }

  async run() {
    console.log(chalk.blue('🚀 SETUP SYSTÈME MULTI-AGENTS NUTRICOACH'));
    console.log(chalk.blue('═'.repeat(50)));

    try {
      for (const step of this.setupSteps) {
        console.log(chalk.yellow(`\n📋 ${step.name}...`));
        await step.action();
        console.log(chalk.green(`✅ ${step.name} terminé`));
      }

      console.log(chalk.green('\n🎉 Setup terminé avec succès!'));
      this.displayNextSteps();

    } catch (error) {
      console.error(chalk.red('\n❌ Erreur pendant le setup:'), error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    // Vérifier Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ requis. Version actuelle: ${nodeVersion}`);
    }

    console.log(`  ✓ Node.js ${nodeVersion}`);

    // Vérifier si nous sommes dans le bon répertoire
    const packagePath = path.join(process.cwd(), 'package.json');
    try {
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      if (packageJson.name !== 'nutricoach-agents') {
        throw new Error('Setup doit être exécuté depuis le dossier dev-agents/');
      }
    } catch (error) {
      throw new Error('Fichier package.json non trouvé ou invalide');
    }

    console.log('  ✓ Répertoire de travail correct');
  }

  async createDirectories() {
    const directories = [
      'logs',
      'tmp',
      'reports',
      'examples',
      'tests',
      'docs/generated'
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`  ✓ Dossier créé: ${dir}/`);
    }
  }

  async setupPermissions() {
    // Rendre les scripts exécutables (Unix/Linux/Mac)
    if (process.platform !== 'win32') {
      const executableFiles = ['cli.js', 'orchestrator.js', 'setup.js'];
      
      for (const file of executableFiles) {
        try {
          await fs.chmod(file, 0o755);
          console.log(`  ✓ Permissions définies: ${file}`);
        } catch (error) {
          console.log(`  ⚠️ Impossible de modifier les permissions: ${file}`);
        }
      }
    } else {
      console.log('  ✓ Windows détecté - permissions par défaut');
    }
  }

  async validateSystem() {
    // Vérifier que tous les agents sont présents
    const requiredAgents = [
      'agents/db-agent.js',
      'agents/ui-agent.js',
      'agents/module-agent.js',
      'agents/qa-agent.js',
      'agents/doc-agent.js'
    ];

    for (const agent of requiredAgents) {
      try {
        await fs.access(agent);
        console.log(`  ✓ Agent trouvé: ${path.basename(agent)}`);
      } catch (error) {
        throw new Error(`Agent manquant: ${agent}`);
      }
    }

    // Vérifier les fichiers de spécification
    const specFiles = [
      'specs/feature-template.json',
      'specs/nutricoach-features.json'
    ];

    for (const specFile of specFiles) {
      try {
        await fs.access(specFile);
        const content = await fs.readFile(specFile, 'utf8');
        JSON.parse(content); // Vérifier que c'est du JSON valide
        console.log(`  ✓ Spécification valide: ${path.basename(specFile)}`);
      } catch (error) {
        throw new Error(`Spécification invalide: ${specFile}`);
      }
    }
  }

  async generateExamples() {
    // Générer des exemples de tâches pour chaque agent
    const examples = {
      'db-task-example.json': {
        id: 'db-example-schema',
        type: 'schema',
        description: 'Exemple de création de schéma de base de données',
        priority: 'medium',
        estimatedTime: '1h',
        spec: {
          tableName: 'example_table',
          columns: [
            { name: 'id', type: 'uuid', primaryKey: true },
            { name: 'name', type: 'text', notNull: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' }
          ]
        }
      },
      'ui-task-example.json': {
        id: 'ui-example-component',
        type: 'component',
        description: 'Exemple de création de composant UI',
        priority: 'medium',
        estimatedTime: '2h',
        spec: {
          componentName: 'ExampleCard',
          props: [
            { name: 'title', type: 'string', optional: false },
            { name: 'content', type: 'string', optional: true }
          ]
        }
      },
      'simple-feature-example.json': {
        feature: {
          name: 'Simple CRUD Example',
          description: 'Exemple simple d\'une feature CRUD',
          type: 'crud-feature',
          priority: 'medium',
          estimatedTime: '4h'
        },
        agents: {
          'db-agent': {
            required: true,
            tasks: [{
              id: 'db-simple-schema',
              type: 'schema',
              description: 'Créer un schéma simple',
              priority: 'high',
              estimatedTime: '1h',
              spec: { tableName: 'simple_items' }
            }]
          },
          'qa-agent': {
            required: true,
            tasks: [{
              id: 'qa-simple-tests',
              type: 'unit-tests',
              description: 'Tests pour la feature simple',
              priority: 'medium',
              estimatedTime: '1h',
              spec: { target: 'simple-items' }
            }]
          }
        }
      }
    };

    for (const [filename, content] of Object.entries(examples)) {
      const filePath = path.join('examples', filename);
      await fs.writeFile(filePath, JSON.stringify(content, null, 2));
      console.log(`  ✓ Exemple créé: ${filename}`);
    }
  }

  displayNextSteps() {
    console.log(chalk.blue('\n📋 PROCHAINES ÉTAPES:'));
    console.log(chalk.gray('─'.repeat(30)));
    
    console.log(chalk.cyan('1. Tester le système:'));
    console.log('   npm run validate');
    console.log('   npm run list');
    
    console.log(chalk.cyan('\n2. Exécuter un exemple:'));
    console.log('   npm start -- --dry-run -f "nutrition-tracking"');
    
    console.log(chalk.cyan('\n3. Monitoring:'));
    console.log('   npm run status');
    console.log('   npm run monitor');
    
    console.log(chalk.cyan('\n4. Configuration (optionnel):'));
    console.log('   export CONTEXT7_API_KEY="your-key"');
    console.log('   export OPENAI_API_KEY="your-key"');
    
    console.log(chalk.cyan('\n5. Documentation:'));
    console.log('   cat README.md');
    console.log('   ls examples/');

    console.log(chalk.green('\n🚀 Le système multi-agents est prêt à l\'utilisation!'));
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new AgentsSetup();
  setup.run().catch(console.error);
}