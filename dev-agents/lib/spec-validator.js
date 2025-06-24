#!/usr/bin/env node

/**
 * 🔍 VALIDATEUR DE SPÉCIFICATIONS
 * 
 * Valide les spécifications de features selon le template défini
 * Vérifie la cohérence inter-agents et les dépendances
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

export class SpecValidator {
  constructor() {
    this.template = null;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 🔧 CHARGEMENT DU TEMPLATE
   */
  async loadTemplate(templatePath = null) {
    try {
      const defaultPath = path.join(process.cwd(), 'dev-agents/specs/feature-template.json');
      const filePath = templatePath || defaultPath;
      
      const templateContent = await fs.readFile(filePath, 'utf8');
      this.template = JSON.parse(templateContent);
      
      console.log(chalk.green('✅ Template chargé:', filePath));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Erreur chargement template:'), error.message);
      return false;
    }
  }

  /**
   * ✅ VALIDATION D'UNE FEATURE
   */
  async validateFeature(featureSpec, featureName = 'unknown') {
    this.errors = [];
    this.warnings = [];

    console.log(chalk.blue(`🔍 Validation feature: ${featureName}`));

    // 1. Validation de la structure de base
    this.validateFeatureStructure(featureSpec, featureName);

    // 2. Validation des tâches agents
    this.validateAgentTasks(featureSpec, featureName);

    // 3. Validation des dépendances
    this.validateDependencies(featureSpec, featureName);

    // 4. Validation croisée entre agents
    this.validateCrossAgentCompatibility(featureSpec, featureName);

    // 5. Validation des quality gates
    this.validateQualityGates(featureSpec, featureName);

    // Résumé de la validation
    this.reportValidationResults(featureName);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * 🏗️ VALIDATION STRUCTURE DE BASE
   */
  validateFeatureStructure(featureSpec, featureName) {
    const required = ['feature', 'agents'];
    
    for (const field of required) {
      if (!featureSpec[field]) {
        this.addError(`Champ requis manquant: ${field}`, featureName);
      }
    }

    if (featureSpec.feature) {
      const featureRequired = ['name', 'description', 'type', 'estimatedTime'];
      
      for (const field of featureRequired) {
        if (!featureSpec.feature[field]) {
          this.addError(`feature.${field} est requis`, featureName);
        }
      }

      // Validation du type
      const validTypes = ['crud-feature', 'ai-feature', 'ui-enhancement', 'api-integration', 'performance-optimization'];
      if (featureSpec.feature.type && !validTypes.includes(featureSpec.feature.type)) {
        this.addError(`Type de feature invalide: ${featureSpec.feature.type}. Types valides: ${validTypes.join(', ')}`, featureName);
      }

      // Validation du temps estimé
      if (featureSpec.feature.estimatedTime && !featureSpec.feature.estimatedTime.match(/^\d+[hd]$/)) {
        this.addError(`Format estimatedTime invalide: ${featureSpec.feature.estimatedTime}. Format attendu: 8h ou 2d`, featureName);
      }
    }
  }

  /**
   * 🤖 VALIDATION DES TÂCHES AGENTS
   */
  validateAgentTasks(featureSpec, featureName) {
    const validAgents = ['db-agent', 'ui-agent', 'module-agent', 'qa-agent', 'doc-agent'];
    
    if (!featureSpec.agents) return;

    for (const [agentId, agentConfig] of Object.entries(featureSpec.agents)) {
      if (!validAgents.includes(agentId)) {
        this.addError(`Agent invalide: ${agentId}. Agents valides: ${validAgents.join(', ')}`, featureName);
        continue;
      }

      if (agentConfig.required && (!agentConfig.tasks || agentConfig.tasks.length === 0)) {
        this.addError(`Agent ${agentId} est requis mais n'a pas de tâches définies`, featureName);
      }

      if (agentConfig.tasks) {
        for (const [taskIndex, task] of agentConfig.tasks.entries()) {
          this.validateTask(task, `${agentId}.tasks[${taskIndex}]`, featureName);
        }
      }
    }

    // Vérification que les agents QA et Doc sont présents
    const hasQA = featureSpec.agents['qa-agent']?.required !== false;
    const hasDoc = featureSpec.agents['doc-agent']?.required !== false;

    if (!hasQA) {
      this.addWarning('Agent QA non requis - les tests ne seront pas générés automatiquement', featureName);
    }

    if (!hasDoc) {
      this.addWarning('Agent Doc non requis - la documentation ne sera pas générée automatiquement', featureName);
    }
  }

  /**
   * 📋 VALIDATION D'UNE TÂCHE
   */
  validateTask(task, taskPath, featureName) {
    const required = ['id', 'type', 'description', 'priority', 'estimatedTime'];
    
    for (const field of required) {
      if (!task[field]) {
        this.addError(`${taskPath}.${field} est requis`, featureName);
      }
    }

    // Validation du format du temps
    if (task.estimatedTime && !task.estimatedTime.match(/^\d+[hm]$/)) {
      this.addError(`${taskPath}.estimatedTime format invalide: ${task.estimatedTime}. Format attendu: 2h ou 30m`, featureName);
    }

    // Validation des priorités
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (task.priority && !validPriorities.includes(task.priority)) {
      this.addError(`${taskPath}.priority invalide: ${task.priority}. Priorités valides: ${validPriorities.join(', ')}`, featureName);
    }

    // Validation des spécifications selon le type de tâche
    this.validateTaskSpec(task, taskPath, featureName);
  }

  /**
   * 🎯 VALIDATION DES SPÉCIFICATIONS DE TÂCHE
   */
  validateTaskSpec(task, taskPath, featureName) {
    if (!task.spec) {
      this.addWarning(`${taskPath}.spec manquant - spécifications détaillées recommandées`, featureName);
      return;
    }

    switch (task.type) {
      case 'schema':
        this.validateSchemaSpec(task.spec, taskPath, featureName);
        break;
      case 'api-endpoint':
        this.validateAPIEndpointSpec(task.spec, taskPath, featureName);
        break;
      case 'component':
        this.validateComponentSpec(task.spec, taskPath, featureName);
        break;
      case 'ai-integration':
        this.validateAIIntegrationSpec(task.spec, taskPath, featureName);
        break;
      default:
        this.addWarning(`Type de tâche ${task.type} - validation des specs non implémentée`, featureName);
    }
  }

  validateSchemaSpec(spec, taskPath, featureName) {
    if (spec.tableName && !spec.tableName.match(/^[a-z][a-z0-9_]*$/)) {
      this.addError(`${taskPath}.spec.tableName invalide: ${spec.tableName}. Format: snake_case`, featureName);
    }

    if (spec.columns) {
      for (const [colIndex, column] of spec.columns.entries()) {
        if (!column.name || !column.type) {
          this.addError(`${taskPath}.spec.columns[${colIndex}] doit avoir name et type`, featureName);
        }
      }
    }
  }

  validateAPIEndpointSpec(spec, taskPath, featureName) {
    if (spec.endpoints) {
      for (const [epIndex, endpoint] of spec.endpoints.entries()) {
        if (!endpoint.name || !endpoint.method || !endpoint.path) {
          this.addError(`${taskPath}.spec.endpoints[${epIndex}] doit avoir name, method et path`, featureName);
        }

        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        if (endpoint.method && !validMethods.includes(endpoint.method.toUpperCase())) {
          this.addError(`${taskPath}.spec.endpoints[${epIndex}].method invalide: ${endpoint.method}`, featureName);
        }
      }
    }
  }

  validateComponentSpec(spec, taskPath, featureName) {
    if (spec.components) {
      for (const [compIndex, component] of spec.components.entries()) {
        if (!component.name) {
          this.addError(`${taskPath}.spec.components[${compIndex}].name est requis`, featureName);
        }

        if (component.name && !component.name.match(/^[A-Z][a-zA-Z0-9]*$/)) {
          this.addError(`${taskPath}.spec.components[${compIndex}].name doit être en PascalCase`, featureName);
        }
      }
    }
  }

  validateAIIntegrationSpec(spec, taskPath, featureName) {
    const required = ['integrationName', 'provider', 'model'];
    
    for (const field of required) {
      if (!spec[field]) {
        this.addError(`${taskPath}.spec.${field} est requis pour une intégration IA`, featureName);
      }
    }

    const validProviders = ['openai', 'anthropic', 'ollama'];
    if (spec.provider && !validProviders.includes(spec.provider)) {
      this.addError(`${taskPath}.spec.provider invalide: ${spec.provider}. Providers valides: ${validProviders.join(', ')}`, featureName);
    }
  }

  /**
   * 🔗 VALIDATION DES DÉPENDANCES
   */
  validateDependencies(featureSpec, featureName) {
    if (!featureSpec.agents) return;

    const allTaskIds = new Set();
    const taskDependencies = new Map();

    // Collecter tous les IDs de tâches
    for (const [agentId, agentConfig] of Object.entries(featureSpec.agents)) {
      if (agentConfig.tasks) {
        for (const task of agentConfig.tasks) {
          if (task.id) {
            if (allTaskIds.has(task.id)) {
              this.addError(`ID de tâche dupliqué: ${task.id}`, featureName);
            }
            allTaskIds.add(task.id);
            
            if (task.dependsOn) {
              taskDependencies.set(task.id, task.dependsOn);
            }
          }
        }
      }
    }

    // Vérifier que toutes les dépendances existent
    for (const [taskId, dependencies] of taskDependencies) {
      for (const depId of dependencies) {
        if (!allTaskIds.has(depId)) {
          this.addError(`Dépendance inexistante: ${taskId} dépend de ${depId}`, featureName);
        }
      }
    }

    // Détecter les dépendances circulaires
    this.detectCircularDependencies(taskDependencies, featureName);
  }

  detectCircularDependencies(dependencies, featureName) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCircle = (taskId, path = []) => {
      if (recursionStack.has(taskId)) {
        const cycle = path.slice(path.indexOf(taskId)).concat(taskId);
        this.addError(`Dépendance circulaire détectée: ${cycle.join(' → ')}`, featureName);
        return true;
      }

      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const deps = dependencies.get(taskId) || [];
      for (const dep of deps) {
        if (hasCircle(dep, [...path, taskId])) {
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of dependencies.keys()) {
      if (!visited.has(taskId)) {
        hasCircle(taskId);
      }
    }
  }

  /**
   * 🤝 VALIDATION COMPATIBILITÉ INTER-AGENTS
   */
  validateCrossAgentCompatibility(featureSpec, featureName) {
    const agents = featureSpec.agents || {};

    // Vérifier cohérence DB-Module
    if (agents['db-agent']?.required && agents['module-agent']?.required) {
      this.validateDBModuleCompatibility(agents['db-agent'], agents['module-agent'], featureName);
    }

    // Vérifier cohérence Module-UI
    if (agents['module-agent']?.required && agents['ui-agent']?.required) {
      this.validateModuleUICompatibility(agents['module-agent'], agents['ui-agent'], featureName);
    }

    // Vérifier que QA teste tous les agents actifs
    if (agents['qa-agent']?.required) {
      this.validateQACoverage(agents, featureName);
    }
  }

  validateDBModuleCompatibility(dbAgent, moduleAgent, featureName) {
    const dbTables = this.extractTablesFromAgent(dbAgent);
    const moduleEndpoints = this.extractEndpointsFromAgent(moduleAgent);

    // Vérifier que les endpoints ont des tables correspondantes
    for (const endpoint of moduleEndpoints) {
      const relatedTable = this.guessRelatedTable(endpoint, dbTables);
      if (!relatedTable) {
        this.addWarning(`Endpoint ${endpoint} pourrait nécessiter une table DB correspondante`, featureName);
      }
    }
  }

  validateModuleUICompatibility(moduleAgent, uiAgent, featureName) {
    const moduleEndpoints = this.extractEndpointsFromAgent(moduleAgent);
    const uiComponents = this.extractComponentsFromAgent(uiAgent);

    if (moduleEndpoints.length > 0 && uiComponents.length === 0) {
      this.addWarning('Des endpoints API sont définis mais aucun composant UI pour les utiliser', featureName);
    }
  }

  validateQACoverage(agents, featureName) {
    const activeAgents = Object.keys(agents).filter(id => 
      id !== 'qa-agent' && agents[id]?.required !== false
    );

    const qaAgent = agents['qa-agent'];
    if (qaAgent?.tasks) {
      const testedComponents = qaAgent.tasks
        .filter(task => task.type === 'unit-tests' || task.type === 'integration-tests')
        .map(task => task.spec?.target)
        .filter(Boolean);

      if (testedComponents.length === 0) {
        this.addWarning('Agent QA actif mais aucun test spécifique défini', featureName);
      }
    }
  }

  /**
   * 🚦 VALIDATION DES QUALITY GATES
   */
  validateQualityGates(featureSpec, featureName) {
    if (!featureSpec.validation?.qualityGates) {
      this.addWarning('Aucun quality gate défini - recommandé pour la qualité', featureName);
      return;
    }

    const gates = featureSpec.validation.qualityGates;
    const validTypes = ['coverage', 'performance', 'security', 'accessibility'];

    for (const [gateIndex, gate] of gates.entries()) {
      if (!gate.name || !gate.type || gate.threshold === undefined) {
        this.addError(`validation.qualityGates[${gateIndex}] doit avoir name, type et threshold`, featureName);
      }

      if (gate.type && !validTypes.includes(gate.type)) {
        this.addError(`Quality gate type invalide: ${gate.type}. Types valides: ${validTypes.join(', ')}`, featureName);
      }

      if (typeof gate.threshold === 'number' && (gate.threshold < 0 || gate.threshold > 100)) {
        this.addError(`Quality gate threshold doit être entre 0 et 100: ${gate.threshold}`, featureName);
      }
    }
  }

  /**
   * 🛠️ UTILITAIRES D'EXTRACTION
   */
  extractTablesFromAgent(dbAgent) {
    const tables = [];
    if (dbAgent.tasks) {
      for (const task of dbAgent.tasks) {
        if (task.type === 'schema' && task.spec?.tableName) {
          tables.push(task.spec.tableName);
        }
        if (task.spec?.tables) {
          tables.push(...task.spec.tables.map(t => t.name));
        }
      }
    }
    return tables;
  }

  extractEndpointsFromAgent(moduleAgent) {
    const endpoints = [];
    if (moduleAgent.tasks) {
      for (const task of moduleAgent.tasks) {
        if (task.type === 'api-endpoint' && task.spec?.endpoints) {
          endpoints.push(...task.spec.endpoints.map(e => e.name || e.path));
        }
      }
    }
    return endpoints;
  }

  extractComponentsFromAgent(uiAgent) {
    const components = [];
    if (uiAgent.tasks) {
      for (const task of uiAgent.tasks) {
        if (task.type === 'component' && task.spec?.components) {
          components.push(...task.spec.components.map(c => c.name));
        }
      }
    }
    return components;
  }

  guessRelatedTable(endpoint, tables) {
    const endpointLower = endpoint.toLowerCase();
    return tables.find(table => 
      endpointLower.includes(table.replace('_', '')) ||
      table.replace('_', '').includes(endpointLower.replace(/[^a-z]/g, ''))
    );
  }

  /**
   * 📊 GESTION DES ERREURS ET WARNINGS
   */
  addError(message, context) {
    this.errors.push({ message, context, type: 'error' });
  }

  addWarning(message, context) {
    this.warnings.push({ message, context, type: 'warning' });
  }

  reportValidationResults(featureName) {
    console.log('\n' + chalk.blue('═'.repeat(60)));
    console.log(chalk.blue(`📋 RAPPORT DE VALIDATION: ${featureName}`));
    console.log(chalk.blue('═'.repeat(60)));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('✅ Validation réussie - Aucun problème détecté'));
    } else {
      if (this.errors.length > 0) {
        console.log(chalk.red(`\n❌ ERREURS (${this.errors.length}):`));
        this.errors.forEach((error, index) => {
          console.log(chalk.red(`  ${index + 1}. ${error.message}`));
        });
      }

      if (this.warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠️ AVERTISSEMENTS (${this.warnings.length}):`));
        this.warnings.forEach((warning, index) => {
          console.log(chalk.yellow(`  ${index + 1}. ${warning.message}`));
        });
      }
    }

    console.log(chalk.blue('\n' + '═'.repeat(60)));
  }

  /**
   * 📁 VALIDATION D'UN FICHIER DE SPECS
   */
  async validateSpecFile(specFilePath) {
    try {
      const specContent = await fs.readFile(specFilePath, 'utf8');
      const specs = JSON.parse(specContent);

      console.log(chalk.blue(`🔍 Validation fichier: ${specFilePath}`));

      if (!specs.features) {
        console.log(chalk.red('❌ Aucune feature trouvée dans le fichier'));
        return false;
      }

      let allValid = true;
      for (const [featureName, featureSpec] of Object.entries(specs.features)) {
        const result = await this.validateFeature(featureSpec, featureName);
        if (!result.valid) {
          allValid = false;
        }
      }

      console.log(chalk.blue(`\n📊 RÉSUMÉ GLOBAL:`));
      console.log(chalk.blue(`  Features validées: ${Object.keys(specs.features).length}`));
      console.log(allValid ? 
        chalk.green('  Status: Toutes les features sont valides ✅') :
        chalk.red('  Status: Certaines features ont des erreurs ❌')
      );

      return allValid;

    } catch (error) {
      console.error(chalk.red('❌ Erreur lecture fichier spec:'), error.message);
      return false;
    }
  }
}

export default SpecValidator;

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SpecValidator();
  
  async function main() {
    const specFile = process.argv[2] || 'dev-agents/specs/nutricoach-features.json';
    
    // Charger le template
    await validator.loadTemplate();
    
    // Valider le fichier de specs
    await validator.validateSpecFile(specFile);
  }

  main().catch(console.error);
}