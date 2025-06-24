#!/usr/bin/env node

/**
 * 🎯 GÉNÉRATEUR DE FEATURES
 * 
 * Utilitaire pour générer rapidement des spécifications de features
 * basées sur des templates prédéfinis
 */

import { promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FeatureGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
    this.specsPath = path.join(__dirname, '../specs');
    this.examples = null;
    this.templates = {
      'crud-feature': this.generateCrudFeature.bind(this),
      'ai-feature': this.generateAiFeature.bind(this),
      'ui-enhancement': this.generateUiFeature.bind(this),
      'api-integration': this.generateApiFeature.bind(this),
      'security-feature': this.generateSecurityFeature.bind(this),
      'analytics-feature': this.generateAnalyticsFeature.bind(this),
      'performance-optimization': this.generatePerformanceFeature.bind(this)
    };
  }

  async loadExamples() {
    if (!this.examples) {
      try {
        const examplesPath = path.join(this.templatesPath, 'feature-examples.json');
        const content = await fs.readFile(examplesPath, 'utf-8');
        this.examples = JSON.parse(content);
      } catch (error) {
        console.error(chalk.red('❌ Erreur lors du chargement des exemples:', error.message));
        this.examples = { features: {} };
      }
    }
    return this.examples;
  }

  async generateFeature() {
    console.log(chalk.blue('🎯 Générateur de Features NutriCoach\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'Comment voulez-vous créer la feature ?',
        choices: [
          { name: '📋 Partir d\'un exemple existant', value: 'from-example' },
          { name: '🔧 Créer depuis un template', value: 'from-template' },
          { name: '✨ Créer depuis zéro', value: 'from-scratch' }
        ]
      }
    ]);

    switch (answers.method) {
      case 'from-example':
        return await this.generateFromExample();
      case 'from-template':
        return await this.generateFromTemplate();
      case 'from-scratch':
        return await this.generateFromScratch();
    }
  }

  async generateFromExample() {
    await this.loadExamples();
    
    const examples = Object.keys(this.examples.features);
    if (examples.length === 0) {
      console.log(chalk.yellow('⚠️ Aucun exemple disponible'));
      return await this.generateFromTemplate();
    }

    const { selectedExample } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedExample',
        message: 'Choisissez un exemple à adapter :',
        choices: examples.map(key => ({
          name: `${this.examples.features[key].feature.name} (${this.examples.features[key].feature.type})`,
          value: key
        }))
      }
    ]);

    const example = this.examples.features[selectedExample];
    
    // Personnaliser l'exemple
    const customization = await this.customizeExample(example);
    
    // Générer le fichier
    const featureSpec = this.adaptExample(example, customization);
    return await this.saveFeature(featureSpec, customization.featureId);
  }

  async customizeExample(example) {
    console.log(chalk.cyan(`\n📋 Adaptation de: ${example.feature.name}`));
    
    return await inquirer.prompt([
      {
        type: 'input',
        name: 'featureId',
        message: 'ID de la feature (kebab-case):',
        validate: input => /^[a-z][a-z0-9-]*$/.test(input) || 'Format invalide (ex: my-feature)'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Nom de la feature:',
        default: example.feature.name
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: example.feature.description
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priorité:',
        choices: ['low', 'medium', 'high', 'critical'],
        default: example.feature.priority
      },
      {
        type: 'input',
        name: 'estimatedTime',
        message: 'Temps estimé (ex: 2d, 8h):',
        default: example.feature.estimatedTime,
        validate: input => /^\d+[hd]$/.test(input) || 'Format invalide (ex: 2d, 8h)'
      }
    ]);
  }

  async generateFromTemplate() {
    const { featureType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'featureType',
        message: 'Type de feature:',
        choices: [
          { name: '📋 CRUD Feature - Gestion de données simple', value: 'crud-feature' },
          { name: '🤖 AI Feature - Fonctionnalité avec IA', value: 'ai-feature' },
          { name: '🎨 UI Enhancement - Amélioration interface', value: 'ui-enhancement' },
          { name: '🔌 API Integration - Intégration externe', value: 'api-integration' },
          { name: '🔒 Security Feature - Sécurité', value: 'security-feature' },
          { name: '📊 Analytics Feature - Analytique', value: 'analytics-feature' },
          { name: '⚡ Performance Optimization - Performance', value: 'performance-optimization' }
        ]
      }
    ]);

    const generator = this.templates[featureType];
    if (!generator) {
      console.error(chalk.red('❌ Template non trouvé'));
      return;
    }

    return await generator();
  }

  async generateFromScratch() {
    console.log(chalk.cyan('\n✨ Création d\'une feature personnalisée\n'));

    const basicInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'featureId',
        message: 'ID de la feature (kebab-case):',
        validate: input => /^[a-z][a-z0-9-]*$/.test(input) || 'Format invalide (ex: my-feature)'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Nom de la feature:',
        validate: input => input.length >= 3 || 'Minimum 3 caractères'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description détaillée:',
        validate: input => input.length >= 10 || 'Minimum 10 caractères'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Type de feature:',
        choices: [
          'crud-feature',
          'ai-feature',
          'ui-enhancement',
          'api-integration',
          'performance-optimization',
          'security-feature',
          'analytics-feature'
        ]
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priorité:',
        choices: ['low', 'medium', 'high', 'critical']
      },
      {
        type: 'input',
        name: 'estimatedTime',
        message: 'Temps estimé (ex: 2d, 8h):',
        validate: input => /^\d+[hd]$/.test(input) || 'Format invalide (ex: 2d, 8h)'
      }
    ]);

    // Sélection des agents
    const agentSelection = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'requiredAgents',
        message: 'Agents requis:',
        choices: [
          { name: '🗄️ DB Agent - Base de données', value: 'db-agent', checked: true },
          { name: '🎨 UI Agent - Interface utilisateur', value: 'ui-agent', checked: true },
          { name: '⚙️ Module Agent - Logique métier/API', value: 'module-agent', checked: true },
          { name: '🧪 QA Agent - Tests et qualité', value: 'qa-agent', checked: true },
          { name: '📚 Doc Agent - Documentation', value: 'doc-agent' }
        ]
      }
    ]);

    // Génération des tâches pour chaque agent
    const agents = {};
    for (const agentId of agentSelection.requiredAgents) {
      agents[agentId] = await this.generateAgentTasks(agentId, basicInfo.type);
    }

    const featureSpec = {
      project: "NutriCoach",
      version: "1.0.0",
      features: {
        [basicInfo.featureId]: {
          feature: basicInfo,
          agents
        }
      }
    };

    return await this.saveFeature(featureSpec, basicInfo.featureId);
  }

  async generateAgentTasks(agentId, featureType) {
    const agentNames = {
      'db-agent': '🗄️ DB Agent',
      'ui-agent': '🎨 UI Agent',
      'module-agent': '⚙️ Module Agent',
      'qa-agent': '🧪 QA Agent',
      'doc-agent': '📚 Doc Agent'
    };

    console.log(chalk.cyan(`\n${agentNames[agentId]} - Définition des tâches:`));

    const { taskCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'taskCount',
        message: 'Nombre de tâches:',
        default: 2,
        validate: input => input > 0 && input <= 10 || 'Entre 1 et 10 tâches'
      }
    ]);

    const tasks = [];
    for (let i = 0; i < taskCount; i++) {
      console.log(chalk.gray(`\nTâche ${i + 1}/${taskCount}:`));
      
      const task = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'ID de la tâche:',
          validate: input => /^[a-z][a-z0-9-]*$/.test(input) || 'Format invalide'
        },
        {
          type: 'list',
          name: 'type',
          message: 'Type de tâche:',
          choices: this.getTaskTypesForAgent(agentId)
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          validate: input => input.length >= 5 || 'Minimum 5 caractères'
        },
        {
          type: 'list',
          name: 'priority',
          message: 'Priorité:',
          choices: ['low', 'medium', 'high', 'critical']
        },
        {
          type: 'input',
          name: 'estimatedTime',
          message: 'Temps estimé (ex: 4h, 30m):',
          validate: input => /^\d+[hm]$/.test(input) || 'Format invalide'
        },
        {
          type: 'confirm',
          name: 'useContext7',
          message: 'Utiliser Context7 pour cette tâche?',
          default: true
        }
      ]);

      tasks.push(task);
    }

    return {
      required: true,
      tasks
    };
  }

  getTaskTypesForAgent(agentId) {
    const taskTypes = {
      'db-agent': ['schema', 'migration', 'rls-policy', 'index', 'function'],
      'ui-agent': ['component', 'page', 'layout', 'design-system', 'responsive'],
      'module-agent': ['api-endpoint', 'business-logic', 'ai-integration', 'external-api', 'validation', 'middleware', 'service'],
      'qa-agent': ['unit-tests', 'integration-tests', 'e2e-tests', 'performance-tests', 'security-tests', 'accessibility-tests'],
      'doc-agent': ['api-docs', 'user-guide', 'tutorial', 'technical-doc', 'troubleshooting', 'changelog']
    };

    return taskTypes[agentId] || ['generic-task'];
  }

  // Générateurs de templates spécialisés
  async generateCrudFeature() {
    console.log(chalk.cyan('\n📋 Générateur CRUD Feature\n'));

    const info = await inquirer.prompt([
      {
        type: 'input',
        name: 'featureId',
        message: 'ID de la feature (ex: user-management):',
        validate: input => /^[a-z][a-z0-9-]*$/.test(input) || 'Format invalide'
      },
      {
        type: 'input',
        name: 'entityName',
        message: 'Nom de l\'entité (ex: User, Product):',
        validate: input => input.length >= 3 || 'Minimum 3 caractères'
      },
      {
        type: 'input',
        name: 'tableName',
        message: 'Nom de la table (ex: users, products):',
        validate: input => /^[a-z][a-z0-9_]*$/.test(input) || 'Format invalide'
      },
      {
        type: 'checkbox',
        name: 'fields',
        message: 'Champs principaux:',
        choices: [
          'name', 'email', 'description', 'category', 'status', 'created_at', 'updated_at'
        ]
      },
      {
        type: 'confirm',
        name: 'hasSearch',
        message: 'Inclure la recherche?',
        default: true
      },
      {
        type: 'confirm',
        name: 'hasPagination',
        message: 'Inclure la pagination?',
        default: true
      }
    ]);

    const feature = {
      project: "NutriCoach",
      version: "1.0.0",
      features: {
        [info.featureId]: {
          feature: {
            name: `Gestion des ${info.entityName}s`,
            description: `CRUD complet pour la gestion des ${info.entityName}s avec interface utilisateur`,
            type: "crud-feature",
            priority: "medium",
            estimatedTime: "1d",
            tags: ["crud", info.entityName.toLowerCase(), "management"]
          },
          agents: {
            "db-agent": {
              required: true,
              tasks: [
                {
                  id: `${info.tableName}-schema`,
                  type: "schema",
                  description: `Création de la table ${info.tableName}`,
                  priority: "high",
                  estimatedTime: "2h",
                  useContext7: true,
                  spec: {
                    tables: [info.tableName],
                    fields: info.fields,
                    indexes: ["id", "created_at"]
                  }
                }
              ]
            },
            "ui-agent": {
              required: true,
              tasks: [
                {
                  id: `${info.entityName.toLowerCase()}-crud-ui`,
                  type: "component",
                  description: `Interface CRUD pour ${info.entityName}`,
                  priority: "high",
                  estimatedTime: "6h",
                  useContext7: true,
                  spec: {
                    components: [
                      `${info.entityName}List`,
                      `${info.entityName}Form`,
                      ...(info.hasSearch ? [`${info.entityName}Search`] : [])
                    ],
                    features: [
                      ...(info.hasSearch ? ["search"] : []),
                      ...(info.hasPagination ? ["pagination"] : []),
                      "sort", "filter"
                    ]
                  }
                }
              ]
            },
            "module-agent": {
              required: true,
              tasks: [
                {
                  id: `${info.entityName.toLowerCase()}-api`,
                  type: "api-endpoint",
                  description: `API CRUD pour ${info.entityName}`,
                  priority: "high",
                  estimatedTime: "4h",
                  useContext7: true,
                  spec: {
                    endpoints: ["GET", "POST", "PUT", "DELETE"],
                    validation: "zod",
                    pagination: info.hasPagination,
                    search: info.hasSearch
                  }
                }
              ]
            },
            "qa-agent": {
              required: true,
              tasks: [
                {
                  id: `${info.entityName.toLowerCase()}-tests`,
                  type: "unit-tests",
                  description: `Tests pour le CRUD ${info.entityName}`,
                  priority: "medium",
                  estimatedTime: "3h",
                  useContext7: true,
                  spec: {
                    coverage: ">=80%",
                    testTypes: ["unit", "integration"]
                  }
                }
              ]
            },
            "doc-agent": {
              required: false,
              tasks: [
                {
                  id: `${info.entityName.toLowerCase()}-docs`,
                  type: "api-docs",
                  description: `Documentation API ${info.entityName}`,
                  priority: "low",
                  estimatedTime: "1h"
                }
              ]
            }
          }
        }
      }
    };

    return await this.saveFeature(feature, info.featureId);
  }

  async generateAiFeature() {
    console.log(chalk.cyan('\n🤖 Générateur AI Feature\n'));

    const info = await inquirer.prompt([
      {
        type: 'input',
        name: 'featureId',
        message: 'ID de la feature:',
        validate: input => /^[a-z][a-z0-9-]*$/.test(input) || 'Format invalide'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Nom de la feature:',
        validate: input => input.length >= 3 || 'Minimum 3 caractères'
      },
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Fournisseur IA:',
        choices: ['openai', 'anthropic', 'google', 'local-model']
      },
      {
        type: 'checkbox',
        name: 'aiFeatures',
        message: 'Fonctionnalités IA:',
        choices: [
          'text-generation',
          'image-analysis',
          'recommendation-engine',
          'natural-language-processing',
          'data-analysis',
          'personalization'
        ]
      }
    ]);

    // Générer la feature AI avec les spécifications appropriées
    const feature = this.createAiFeatureStructure(info);
    return await this.saveFeature(feature, info.featureId);
  }

  createAiFeatureStructure(info) {
    return {
      project: "NutriCoach",
      version: "1.0.0",
      features: {
        [info.featureId]: {
          feature: {
            name: info.name,
            description: `Feature IA utilisant ${info.aiProvider} pour ${info.aiFeatures.join(', ')}`,
            type: "ai-feature",
            priority: "high",
            estimatedTime: "3d",
            tags: ["ai", "ml", ...info.aiFeatures]
          },
          agents: {
            "module-agent": {
              required: true,
              tasks: [
                {
                  id: "ai-integration",
                  type: "ai-integration",
                  description: `Intégration ${info.aiProvider} pour ${info.name}`,
                  priority: "critical",
                  estimatedTime: "8h",
                  useContext7: true,
                  spec: {
                    aiProvider: info.aiProvider,
                    features: info.aiFeatures,
                    apiKeys: [`${info.aiProvider.toUpperCase()}_API_KEY`]
                  }
                }
              ]
            },
            "ui-agent": {
              required: true,
              tasks: [
                {
                  id: "ai-interface",
                  type: "component",
                  description: "Interface utilisateur pour la feature IA",
                  priority: "high",
                  estimatedTime: "6h",
                  spec: {
                    components: ["AIInterface", "ResultsDisplay", "LoadingStates"],
                    features: ["real-time-updates", "progress-indicators"]
                  }
                }
              ]
            },
            "qa-agent": {
              required: true,
              tasks: [
                {
                  id: "ai-testing",
                  type: "integration-tests",
                  description: "Tests d'intégration pour la feature IA",
                  priority: "high",
                  estimatedTime: "4h",
                  spec: {
                    testTypes: ["api-integration", "error-handling", "performance"]
                  }
                }
              ]
            }
          }
        }
      }
    };
  }

  adaptExample(example, customization) {
    const adapted = JSON.parse(JSON.stringify(example));
    
    // Adapter les informations de base
    adapted.feature.name = customization.name;
    adapted.feature.description = customization.description;
    adapted.feature.priority = customization.priority;
    adapted.feature.estimatedTime = customization.estimatedTime;

    return {
      project: "NutriCoach",
      version: "1.0.0",
      features: {
        [customization.featureId]: adapted
      }
    };
  }

  async saveFeature(featureSpec, featureId) {
    try {
      // Créer le dossier specs s'il n'existe pas
      await fs.mkdir(this.specsPath, { recursive: true });

      // Nom du fichier
      const filename = `${featureId}-feature.json`;
      const filepath = path.join(this.specsPath, filename);

      // Vérifier si le fichier existe déjà
      try {
        await fs.access(filepath);
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Le fichier ${filename} existe déjà. Écraser?`,
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('⚠️ Génération annulée'));
          return;
        }
      } catch {
        // Le fichier n'existe pas, c'est OK
      }

      // Sauvegarder le fichier
      await fs.writeFile(filepath, JSON.stringify(featureSpec, null, 2));

      console.log(chalk.green(`\n✅ Feature générée avec succès!`));
      console.log(chalk.gray(`📁 Fichier: ${filepath}`));
      console.log(chalk.gray(`🚀 Utilisez: npm run dev-agent orchestrate ${filename}`));

      return filepath;

    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la sauvegarde:', error.message));
      throw error;
    }
  }

  async listFeatures() {
    try {
      const files = await fs.readdir(this.specsPath);
      const featureFiles = files.filter(file => file.endsWith('-feature.json'));

      if (featureFiles.length === 0) {
        console.log(chalk.yellow('📋 Aucune feature trouvée'));
        return [];
      }

      console.log(chalk.blue('📋 Features disponibles:\n'));

      const features = [];
      for (const file of featureFiles) {
        try {
          const content = await fs.readFile(path.join(this.specsPath, file), 'utf-8');
          const spec = JSON.parse(content);
          const featureId = Object.keys(spec.features)[0];
          const feature = spec.features[featureId];

          features.push({
            file,
            id: featureId,
            name: feature.feature.name,
            type: feature.feature.type,
            priority: feature.feature.priority,
            estimatedTime: feature.feature.estimatedTime
          });

          console.log(chalk.gray(`📄 ${file}`));
          console.log(`   ${chalk.cyan(feature.feature.name)}`);
          console.log(`   ${chalk.gray(`Type: ${feature.feature.type} | Priorité: ${feature.feature.priority} | Temps: ${feature.feature.estimatedTime}`)}`);
          console.log();

        } catch (error) {
          console.log(chalk.red(`❌ Erreur lecture ${file}: ${error.message}`));
        }
      }

      return features;

    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la liste des features:', error.message));
      return [];
    }
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new FeatureGenerator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'generate':
    case 'new':
      await generator.generateFeature();
      break;
    case 'list':
      await generator.listFeatures();
      break;
    default:
      console.log(chalk.blue('🎯 Générateur de Features NutriCoach\n'));
      console.log('Usage:');
      console.log('  node feature-generator.js generate  - Générer une nouvelle feature');
      console.log('  node feature-generator.js list      - Lister les features existantes');
      break;
  }
}

export default FeatureGenerator;