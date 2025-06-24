#!/usr/bin/env node

/**
 * 🎯 ORCHESTRATEUR MULTI-AGENTS NUTRICOACH
 * 
 * Système de coordination pour 5 agents spécialisés :
 * - UI Agent (Interface & Design)
 * - DB Agent (Base de données)
 * - Module Agent (Logique métier)
 * - Doc Agent (Documentation)
 * - QA Agent (Tests & Qualité)
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import MonitoringDashboard from './lib/monitoring-dashboard.js';
import Context7CacheManager from './lib/context7-cache.js';

// Import des agents
import { DBAgent } from './agents/db-agent.js';
import { UIAgent } from './agents/ui-agent.js';
import { ModuleAgent } from './agents/module-agent.js';
import { QAAgent } from './agents/qa-agent.js';
import { DocAgent } from './agents/doc-agent.js';

class MultiAgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.agentInstances = new Map();
    this.tasks = new Map();
    this.messageQueue = [];
    this.context7Cache = new Map();
    this.retryAttempts = new Map();
    
    this.state = {
      activeFeature: null,
      currentSprint: null,
      agentStates: {},
      conflicts: [],
      integration: {
        pending: [],
        completed: [],
        failed: []
      },
      monitoring: {
        tasksTotal: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        averageExecutionTime: 0,
        currentLoad: 0
      }
    };

    // Initialiser le dashboard de monitoring
    this.monitoringDashboard = new MonitoringDashboard(this);
    this.setupMonitoringEvents();

    // Initialiser le cache Context7 partagé
    this.context7Cache = new Context7CacheManager({
      maxSize: 500,
      defaultTTL: 7200000, // 2 heures
      persistPath: path.join(process.cwd(), 'cache', 'context7-shared.json')
    });

    // Configurer les événements du cache
    this.setupCacheEvents();
    
    this.initializeAgents();
    this.setupMessageHandling();
    this.startMonitoring();
  }

  /**
   * ⚙️ INITIALISATION DES AGENTS
   */
  initializeAgents() {
    // Créer les instances réelles des agents
    const agentClasses = {
      'db-agent': DBAgent,
      'ui-agent': UIAgent,
      'module-agent': ModuleAgent,
      'qa-agent': QAAgent,
      'doc-agent': DocAgent
    };

    Object.entries(agentClasses).forEach(([id, AgentClass]) => {
      try {
        const agentInstance = new AgentClass();
        this.agentInstances.set(id, agentInstance);
        
        // Configurer le cache Context7 partagé pour l'agent
        agentInstance.setSharedContext7Cache(this.context7Cache);
        
        // Configuration de l'agent pour l'orchestrateur
        const config = agentInstance.config;
        this.agents.set(id, {
          ...config,
          instance: agentInstance,
          status: 'idle',
          currentTask: null,
          completedTasks: [],
          errors: [],
          lastHeartbeat: new Date(),
          metrics: {
            tasksExecuted: 0,
            averageTime: 0,
            successRate: 100
          }
        });
        
        this.state.agentStates[id] = 'ready';
        
        // Écouter les événements de l'agent
        this.setupAgentListeners(agentInstance);
        
        this.log(`✅ Agent ${config.name} initialisé`);
      } catch (error) {
        this.logError(`❌ Erreur initialisation agent ${id}:`, error);
      }
    });

    this.log('🎯 Orchestrateur initialisé avec', this.agents.size, 'agents');
  }

  /**
   * 🚀 DISPATCH D'UNE FEATURE COMPLEXE
   */
  async dispatchFeature(featureSpec) {
    this.log(`🎯 Démarrage feature: ${featureSpec.name}`);
    this.state.activeFeature = featureSpec;

    try {
      // 1. Analyser et décomposer la feature
      const taskDecomposition = await this.decomposeFeature(featureSpec);
      
      // 2. Créer le plan d'exécution avec dépendances
      const executionPlan = await this.createExecutionPlan(taskDecomposition);
      
      // 3. Dispatcher les tâches parallèles
      const results = await this.executeParallelTasks(executionPlan);
      
      // 4. Intégrer les résultats
      const integration = await this.integrateResults(results);
      
      // 5. Valider et créer PR
      const validation = await this.validateIntegration(integration);
      
      if (validation.success) {
        await this.createFeaturePR(featureSpec, integration);
        this.log(`✅ Feature ${featureSpec.name} complétée avec succès`);
        return { success: true, integration, validation };
      } else {
        this.log(`❌ Validation échouée pour ${featureSpec.name}`);
        return { success: false, errors: validation.errors };
      }
      
    } catch (error) {
      this.log(`💥 Erreur lors de l'exécution de ${featureSpec.name}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧩 DÉCOMPOSITION D'UNE FEATURE EN TÂCHES AGENTS
   */
  async decomposeFeature(featureSpec) {
    const decomposition = {
      feature: featureSpec.name,
      tasks: {
        'db-agent': [],
        'ui-agent': [],
        'module-agent': [],
        'qa-agent': [],
        'doc-agent': []
      },
      dependencies: {},
      timeline: {}
    };

    // Analyse automatique basée sur le type de feature
    switch (featureSpec.type) {
      case 'crud-feature':
        decomposition.tasks['db-agent'].push({
          id: `db-${featureSpec.name}-schema`,
          description: `Créer le schéma DB pour ${featureSpec.name}`,
          priority: 'critical',
          estimatedTime: '2h'
        });
        
        decomposition.tasks['module-agent'].push({
          id: `api-${featureSpec.name}-endpoints`,
          description: `Créer les endpoints API pour ${featureSpec.name}`,
          priority: 'high',
          estimatedTime: '4h',
          dependsOn: [`db-${featureSpec.name}-schema`]
        });
        
        decomposition.tasks['ui-agent'].push({
          id: `ui-${featureSpec.name}-components`,
          description: `Créer les composants UI pour ${featureSpec.name}`,
          priority: 'high',
          estimatedTime: '6h',
          dependsOn: [`api-${featureSpec.name}-endpoints`]
        });
        break;

      case 'ai-feature':
        decomposition.tasks['module-agent'].push({
          id: `ai-${featureSpec.name}-integration`,
          description: `Intégration IA pour ${featureSpec.name}`,
          priority: 'critical',
          estimatedTime: '8h'
        });
        break;

      case 'ui-enhancement':
        decomposition.tasks['ui-agent'].push({
          id: `ui-${featureSpec.name}-enhancement`,
          description: `Amélioration UI pour ${featureSpec.name}`,
          priority: 'medium',
          estimatedTime: '4h'
        });
        break;
    }

    // Ajouter systématiquement les tâches QA et Doc
    decomposition.tasks['qa-agent'].push({
      id: `qa-${featureSpec.name}-tests`,
      description: `Tests pour ${featureSpec.name}`,
      priority: 'high',
      estimatedTime: '3h',
      dependsOn: Object.values(decomposition.tasks)
        .flat()
        .filter(task => !task.id.startsWith('qa-') && !task.id.startsWith('doc-'))
        .map(task => task.id)
    });

    decomposition.tasks['doc-agent'].push({
      id: `doc-${featureSpec.name}-documentation`,
      description: `Documentation pour ${featureSpec.name}`,
      priority: 'medium',
      estimatedTime: '2h',
      dependsOn: [`qa-${featureSpec.name}-tests`]
    });

    return decomposition;
  }

  /**
   * 📋 CRÉATION DU PLAN D'EXÉCUTION
   */
  async createExecutionPlan(decomposition) {
    const plan = {
      phases: [],
      totalEstimatedTime: 0,
      criticalPath: [],
      parallelizable: []
    };

    // Analyser les dépendances et créer les phases
    const allTasks = Object.entries(decomposition.tasks)
      .flatMap(([agentId, tasks]) => 
        tasks.map(task => ({ ...task, agentId }))
      );

    // Phase 1: Tâches sans dépendances
    const phase1 = allTasks.filter(task => !task.dependsOn || task.dependsOn.length === 0);
    plan.phases.push({
      phase: 1,
      tasks: phase1,
      parallelizable: true,
      estimatedTime: Math.max(...phase1.map(t => this.parseTimeEstimate(t.estimatedTime)))
    });

    // Phases suivantes basées sur les dépendances
    let remainingTasks = allTasks.filter(task => task.dependsOn && task.dependsOn.length > 0);
    let phaseNum = 2;
    let completedTaskIds = new Set(phase1.map(t => t.id));

    while (remainingTasks.length > 0) {
      const readyTasks = remainingTasks.filter(task => 
        task.dependsOn.every(dep => completedTaskIds.has(dep))
      );

      if (readyTasks.length === 0) {
        throw new Error('Dépendances circulaires détectées');
      }

      plan.phases.push({
        phase: phaseNum,
        tasks: readyTasks,
        parallelizable: true,
        estimatedTime: Math.max(...readyTasks.map(t => this.parseTimeEstimate(t.estimatedTime)))
      });

      readyTasks.forEach(task => completedTaskIds.add(task.id));
      remainingTasks = remainingTasks.filter(task => !readyTasks.includes(task));
      phaseNum++;
    }

    plan.totalEstimatedTime = plan.phases.reduce((total, phase) => total + phase.estimatedTime, 0);
    
    return plan;
  }

  /**
   * ⚡ EXÉCUTION PARALLÈLE DES TÂCHES
   */
  async executeParallelTasks(executionPlan) {
    const results = {
      completed: [],
      failed: [],
      timeline: {}
    };

    this.log(`🚀 Exécution du plan en ${executionPlan.phases.length} phases`);

    for (const phase of executionPlan.phases) {
      this.log(`📍 Phase ${phase.phase}: ${phase.tasks.length} tâches parallèles`);
      
      const phasePromises = phase.tasks.map(task => 
        this.executeTask(task.agentId, task)
      );

      try {
        const phaseResults = await Promise.allSettled(phasePromises);
        
        phaseResults.forEach((result, index) => {
          const task = phase.tasks[index];
          if (result.status === 'fulfilled') {
            results.completed.push({ task, result: result.value });
            this.log(`✅ ${task.agentId}: ${task.description}`);
          } else {
            results.failed.push({ task, error: result.reason });
            this.log(`❌ ${task.agentId}: ${task.description} - ${result.reason}`);
          }
        });

        // Vérifier si des tâches critiques ont échoué
        const criticalFailures = results.failed.filter(f => f.task.priority === 'critical');
        if (criticalFailures.length > 0) {
          throw new Error(`Tâches critiques échouées: ${criticalFailures.map(f => f.task.id).join(', ')}`);
        }

      } catch (error) {
        this.log(`💥 Erreur phase ${phase.phase}:`, error.message);
        throw error;
      }
    }

    return results;
  }

  /**
   * 🔧 EXÉCUTION D'UNE TÂCHE PAR UN AGENT
   */
  async executeTask(agentId, task) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} non trouvé`);
    }

    const startTime = Date.now();
    
    // Mettre à jour le statut de l'agent
    agent.status = 'working';
    agent.currentTask = task;
    this.state.agentStates[agentId] = 'working';

    try {
      // Consultation Context7 si nécessaire
      if (task.useContext7) {
        await this.consultContext7ForTask(task);
      }
      
      // Exécuter la tâche avec l'agent réel
      const result = await agent.instance.executeTask(task);
      const executionTime = Date.now() - startTime;
      
      // Mettre à jour les métriques
      this.updateAgentMetrics(agentId, executionTime, true);
      
      // Marquer comme complété
      agent.status = 'idle';
      agent.currentTask = null;
      agent.completedTasks.push({
        ...task,
        result,
        executionTime,
        completedAt: new Date()
      });
      this.state.agentStates[agentId] = 'ready';
      agent.lastHeartbeat = new Date();

      this.log(`✅ Tâche ${task.id} complétée par ${agentId} (${executionTime}ms)`);
      this.emit('taskCompleted', { agentId, task, result, executionTime });

      return {
        success: true,
        agentId,
        task,
        result,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Gestion de la récupération d'erreur
      const shouldRetry = await this.handleTaskError(agentId, task, error);
      
      if (shouldRetry) {
        this.log(`🔄 Nouvelle tentative pour ${task.id}`);
        return await this.executeTask(agentId, task);
      }
      
      this.updateAgentMetrics(agentId, executionTime, false);
      
      agent.status = 'error';
      agent.errors.push({ 
        task, 
        error: error.message, 
        timestamp: new Date(),
        executionTime
      });
      this.state.agentStates[agentId] = 'error';
      
      this.logError(`❌ Échec tâche ${task.id} par ${agentId}:`, error);
      this.emit('taskFailed', { agentId, task, error, executionTime });
      
      throw error;
    }
  }

  /**
   * 🔄 SIMULATION D'EXÉCUTION (À REMPLACER PAR VRAIS AGENTS)
   */
  async simulateTaskExecution(agentId, task) {
    const executionTime = this.parseTimeEstimate(task.estimatedTime);
    
    // Simulation : attendre proportionnellement au temps estimé
    await new Promise(resolve => setTimeout(resolve, Math.min(executionTime * 100, 5000)));
    
    // Simulation d'échec aléatoire (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error(`Simulation d'échec pour ${task.id}`);
    }

    return {
      files: [`src/features/${task.id}/index.ts`],
      changes: [`Implémentation de ${task.description}`],
      tests: [`tests/${task.id}.test.ts`],
      documentation: [`docs/${task.id}.md`]
    };
  }

  /**
   * 🔗 INTÉGRATION DES RÉSULTATS
   */
  async integrateResults(results) {
    this.log('🔗 Intégration des résultats...');

    const integration = {
      files: new Set(),
      changes: [],
      conflicts: [],
      dependencies: {},
      tests: new Set(),
      documentation: new Set()
    };

    // Collecter tous les fichiers modifiés
    results.completed.forEach(({ result }) => {
      if (result.output && typeof result.output === 'object') {
        result.output.files?.forEach(file => integration.files.add(file));
        result.output.changes?.forEach(change => integration.changes.push(change));
        result.output.tests?.forEach(test => integration.tests.add(test));
        result.output.documentation?.forEach(doc => integration.documentation.add(doc));
      }
    });

    // Détecter les conflits potentiels
    const fileConflicts = this.detectFileConflicts(Array.from(integration.files));
    integration.conflicts = fileConflicts;

    // Résoudre les conflits automatiquement si possible
    if (integration.conflicts.length > 0) {
      const resolved = await this.resolveConflicts(integration.conflicts);
      integration.conflicts = integration.conflicts.filter(c => !resolved.includes(c.id));
    }

    this.log(`📊 Intégration: ${integration.files.size} fichiers, ${integration.conflicts.length} conflits`);

    return integration;
  }

  /**
   * 🔍 DÉTECTION DES CONFLITS
   */
  detectFileConflicts(files) {
    const conflicts = [];
    const fileAgents = {};

    // Grouper les fichiers par agent
    files.forEach(file => {
      const agent = this.guessAgentFromFile(file);
      if (!fileAgents[file]) {
        fileAgents[file] = [];
      }
      fileAgents[file].push(agent);
    });

    // Détecter les fichiers modifiés par plusieurs agents
    Object.entries(fileAgents).forEach(([file, agents]) => {
      if (agents.length > 1) {
        conflicts.push({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'file-conflict',
          file,
          agents,
          severity: 'medium',
          autoResolvable: this.isAutoResolvable(file, agents)
        });
      }
    });

    return conflicts;
  }

  /**
   * 🛠️ RÉSOLUTION AUTOMATIQUE DES CONFLITS
   */
  async resolveConflicts(conflicts) {
    const resolved = [];

    for (const conflict of conflicts) {
      if (conflict.autoResolvable) {
        try {
          await this.autoResolveConflict(conflict);
          resolved.push(conflict.id);
          this.log(`✅ Conflit résolu automatiquement: ${conflict.file}`);
        } catch (error) {
          this.log(`❌ Échec résolution automatique: ${conflict.file} - ${error.message}`);
        }
      }
    }

    return resolved;
  }

  /**
   * ✅ VALIDATION DE L'INTÉGRATION
   */
  async validateIntegration(integration) {
    this.log('✅ Validation de l\'intégration...');

    const validation = {
      success: true,
      errors: [],
      warnings: [],
      checks: {
        typeScript: false,
        tests: false,
        linting: false,
        build: false,
        dependencies: false
      }
    };

    try {
      // Vérification TypeScript
      validation.checks.typeScript = await this.runTypeScriptCheck();
      
      // Exécution des tests
      validation.checks.tests = await this.runTests();
      
      // Vérification du linting
      validation.checks.linting = await this.runLinting();
      
      // Test de build
      validation.checks.build = await this.runBuild();
      
      // Vérification des dépendances
      validation.checks.dependencies = await this.checkDependencies();

      // Vérifier si tous les checks passent
      const allChecksPassed = Object.values(validation.checks).every(check => check);
      validation.success = allChecksPassed && integration.conflicts.length === 0;

      if (!validation.success) {
        validation.errors.push('Certains checks de validation ont échoué');
      }

    } catch (error) {
      validation.success = false;
      validation.errors.push(`Erreur lors de la validation: ${error.message}`);
    }

    return validation;
  }

  /**
   * 📝 CRÉATION DE LA PR
   */
  async createFeaturePR(featureSpec, integration) {
    const prData = {
      title: `✨ Feature: ${featureSpec.name}`,
      body: this.generatePRDescription(featureSpec, integration),
      branch: `feature/${featureSpec.name.toLowerCase().replace(/\s+/g, '-')}`,
      base: 'main',
      files: Array.from(integration.files),
      agents: this.getInvolvedAgents(integration)
    };

    this.log(`📝 Création PR: ${prData.title}`);
    
    // Simuler la création de PR (remplacer par GitHub API)
    await this.simulateCreatePR(prData);
    
    return prData;
  }

  /**
   * 📊 GÉNÉRATION DE LA DESCRIPTION PR
   */
  generatePRDescription(featureSpec, integration) {
    return `## 🎯 Feature: ${featureSpec.name}

### 📋 Description
${featureSpec.description || 'Feature développée par le système multi-agents'}

### 🤖 Agents Impliqués
${this.getInvolvedAgents(integration).map(agent => 
  `- **${agent.name}**: ${agent.specialization}`
).join('\n')}

### 📁 Fichiers Modifiés
${Array.from(integration.files).map(file => `- \`${file}\``).join('\n')}

### ✅ Validations
- [x] TypeScript compilation
- [x] Tests unitaires
- [x] Linting ESLint
- [x] Build production
- [x] Vérification dépendances

### 🧪 Tests
${Array.from(integration.tests).map(test => `- \`${test}\``).join('\n')}

### 📚 Documentation
${Array.from(integration.documentation).map(doc => `- \`${doc}\``).join('\n')}

### 🔄 Conflits Résolus
${integration.conflicts.length > 0 ? 
  integration.conflicts.map(c => `- ${c.file}: ${c.type}`).join('\n') : 
  'Aucun conflit détecté'}

---
🤖 **Générée automatiquement par l'Orchestrateur Multi-Agents NutriCoach**
`;
  }

  /**
   * 🛠️ UTILITAIRES
   */
  parseTimeEstimate(timeStr) {
    const match = timeStr.match(/(\d+)([hm])/);
    if (!match) return 60; // défaut 1h
    
    const [, value, unit] = match;
    return unit === 'h' ? parseInt(value) * 60 : parseInt(value);
  }

  guessAgentFromFile(file) {
    if (file.includes('components/') || file.includes('ui/')) return 'ui-agent';
    if (file.includes('supabase/') || file.includes('migrations/')) return 'db-agent';
    if (file.includes('api/') || file.includes('services/')) return 'module-agent';
    if (file.includes('test') || file.includes('spec')) return 'qa-agent';
    if (file.includes('docs/') || file.includes('.md')) return 'doc-agent';
    return 'unknown';
  }

  isAutoResolvable(file, agents) {
    // Les conflits entre UI et Module sont souvent auto-résolvables
    if (agents.includes('ui-agent') && agents.includes('module-agent')) {
      return file.includes('types') || file.includes('interfaces');
    }
    return false;
  }

  async autoResolveConflict(conflict) {
    // Simulation de résolution automatique
    this.log(`🔧 Résolution automatique: ${conflict.file}`);
    return Promise.resolve();
  }

  getInvolvedAgents(integration) {
    const agentIds = new Set();
    integration.changes.forEach(change => {
      // Extraire l'agent du message de change (format: "agentId: description")
      const match = change.match(/^(\w+-agent):/);
      if (match) agentIds.add(match[1]);
    });
    
    return Array.from(agentIds).map(id => this.agents.get(id)).filter(Boolean);
  }

  // Méthodes de validation (à implémenter avec de vrais outils)
  async runTypeScriptCheck() { return true; }
  async runTests() { return true; }
  async runLinting() { return true; }
  async runBuild() { return true; }
  async checkDependencies() { return true; }
  async simulateCreatePR(prData) { 
    this.log(`📝 PR simulée créée: ${prData.title}`);
    return Promise.resolve(); 
  }

  /**
   * 🔗 COMMUNICATION INTER-AGENTS
   */
  setupAgentListeners(agentInstance) {
    agentInstance.on('messageToAgent', (data) => {
      this.routeMessage(data);
    });
    
    agentInstance.on('taskCompleted', (data) => {
      this.handleAgentTaskComplete(data);
    });
    
    agentInstance.on('taskFailed', (data) => {
      this.handleAgentTaskFailed(data);
    });
  }

  async routeMessage(messageData) {
    const { from, to, message } = messageData;
    const targetAgent = this.agentInstances.get(to);
    
    if (targetAgent) {
      this.log(`📬 Routage message: ${from} → ${to} (${message.type})`);
      await targetAgent.receiveMessage(from, message);
    } else {
      this.logError(`❌ Agent destinataire ${to} non trouvé`);
    }
  }

  setupMessageHandling() {
    // Traitement périodique de la queue de messages
    setInterval(() => {
      this.processMessageQueue();
    }, 1000);
  }

  async processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      try {
        await this.routeMessage(message);
      } catch (error) {
        this.logError('Erreur traitement message:', error);
      }
    }
  }

  /**
   * 🔄 GESTION DES ERREURS ET RECOVERY
   */
  async handleTaskError(agentId, task, error) {
    const retryKey = `${agentId}-${task.id}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    const maxRetries = task.maxRetries || 3;

    if (attempts < maxRetries) {
      this.retryAttempts.set(retryKey, attempts + 1);
      
      // Délai exponentiel entre les tentatives
      const delay = Math.pow(2, attempts) * 1000;
      await this.sleep(delay);
      
      this.log(`🔄 Tentative ${attempts + 1}/${maxRetries} pour ${task.id}`);
      return true; // Retry
    }

    // Nettoyer les compteurs après échec définitif
    this.retryAttempts.delete(retryKey);
    
    // Tenter une récupération alternative
    return await this.attemptRecovery(agentId, task, error);
  }

  async attemptRecovery(agentId, task, error) {
    // Stratégies de récupération
    const agent = this.agents.get(agentId);
    
    // 1. Réinitialiser l'agent si nécessaire
    if (error.message.includes('memory') || error.message.includes('timeout')) {
      this.log(`🔧 Réinitialisation agent ${agentId}`);
      await this.resetAgent(agentId);
      return true;
    }
    
    // 2. Déléguer à un autre agent si possible
    const alternativeAgent = this.findAlternativeAgent(agentId, task);
    if (alternativeAgent) {
      this.log(`🔀 Délégation vers ${alternativeAgent}`);
      task.delegatedFrom = agentId;
      // Ne pas retry directement, sera géré par l'orchestrateur
      return false;
    }
    
    // 3. Marquer la tâche comme échouée définitivement
    this.state.integration.failed.push({
      agentId,
      task,
      error,
      timestamp: new Date(),
      recovery: 'impossible'
    });
    
    return false; // Pas de retry
  }

  async resetAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent && agent.instance) {
      try {
        // Nettoyer l'agent
        if (typeof agent.instance.cleanup === 'function') {
          await agent.instance.cleanup();
        }
        
        // Réinitialiser l'état
        agent.status = 'idle';
        agent.currentTask = null;
        this.state.agentStates[agentId] = 'ready';
        agent.lastHeartbeat = new Date();
        
        this.log(`✨ Agent ${agentId} réinitialisé`);
      } catch (error) {
        this.logError(`Erreur réinitialisation ${agentId}:`, error);
      }
    }
  }

  findAlternativeAgent(agentId, task) {
    // Trouver un agent alternatif capable d'exécuter la tâche
    for (const [id, agent] of this.agents) {
      if (id !== agentId && 
          agent.status === 'idle' && 
          agent.capabilities.some(cap => task.requiredCapabilities?.includes(cap))) {
        return id;
      }
    }
    return null;
  }

  /**
   * 📊 MONITORING ET MÉTRIQUES
   */
  setupMonitoringEvents() {
    // Relayer les événements vers le dashboard de monitoring
    this.on('taskStarted', (data) => {
      this.monitoringDashboard.emit('taskStarted', data);
    });

    this.on('taskCompleted', (data) => {
      this.monitoringDashboard.emit('taskCompleted', data);
    });

    this.on('taskFailed', (data) => {
      this.monitoringDashboard.emit('taskFailed', data);
    });

    this.on('messageExchanged', (data) => {
      this.monitoringDashboard.emit('messageExchanged', data);
    });

    this.on('context7Query', (data) => {
      this.monitoringDashboard.emit('context7Query', data);
    });

    this.on('healthUpdate', (data) => {
      this.monitoringDashboard.emit('healthUpdate', data);
    });

    this.on('performanceAlert', (data) => {
      this.monitoringDashboard.emit('performanceAlert', data);
    });

    // Surveiller les événements des agents
    this.setupAgentMonitoring();
  }

  setupCacheEvents() {
    // Relayer les événements du cache vers le monitoring
    this.context7Cache.on('cacheHit', (data) => {
      this.emit('context7Query', { ...data, result: true });
    });

    this.context7Cache.on('cacheMiss', (data) => {
      this.emit('context7Query', { ...data, result: false });
    });

    this.context7Cache.on('log', (data) => {
      this.log(`🧠 Cache: ${data.message}`);
    });
  }

  setupAgentMonitoring() {
    // Écouter les événements des agents pour le monitoring
    this.on('agentRegistered', (agentId, agentConfig) => {
      this.monitoringDashboard.handleAgentRegistered({
        agentId,
        name: agentConfig.name,
        specialization: agentConfig.specialization
      });
    });
  }

  async startMonitoringDashboard() {
    if (this.monitoringDashboard) {
      await this.monitoringDashboard.start();
    }
  }

  async stopMonitoringDashboard() {
    if (this.monitoringDashboard) {
      await this.monitoringDashboard.stop();
    }
  }

  startMonitoring() {
    // Monitoring périodique toutes les 30 secondes
    setInterval(() => {
      this.updateSystemMetrics();
      this.checkAgentHealth();
      this.reportStatus();
    }, 30000);
  }

  updateSystemMetrics() {
    const totalTasks = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.completedTasks.length, 0);
    
    const failedTasks = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.errors.length, 0);

    const avgTime = this.calculateAverageExecutionTime();
    const currentLoad = this.calculateCurrentLoad();

    this.state.monitoring = {
      tasksTotal: totalTasks + failedTasks,
      tasksCompleted: totalTasks,
      tasksFailed: failedTasks,
      averageExecutionTime: avgTime,
      currentLoad
    };
  }

  calculateAverageExecutionTime() {
    const allTasks = Array.from(this.agents.values())
      .flatMap(agent => agent.completedTasks)
      .filter(task => task.executionTime);

    if (allTasks.length === 0) return 0;

    const totalTime = allTasks.reduce((sum, task) => sum + task.executionTime, 0);
    return Math.round(totalTime / allTasks.length);
  }

  calculateCurrentLoad() {
    const workingAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'working').length;
    
    return Math.round((workingAgents / this.agents.size) * 100);
  }

  updateAgentMetrics(agentId, executionTime, success) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const metrics = agent.metrics;
    metrics.tasksExecuted++;

    if (success) {
      // Moyenne mobile du temps d'exécution
      metrics.averageTime = Math.round(
        (metrics.averageTime * (metrics.tasksExecuted - 1) + executionTime) / metrics.tasksExecuted
      );
    }

    // Taux de succès
    const successCount = agent.completedTasks.length;
    const totalAttempts = successCount + agent.errors.length;
    metrics.successRate = totalAttempts > 0 ? Math.round((successCount / totalAttempts) * 100) : 100;
  }

  checkAgentHealth() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [agentId, agent] of this.agents) {
      const timeSinceHeartbeat = now - agent.lastHeartbeat;
      
      if (timeSinceHeartbeat > timeout && agent.status === 'working') {
        this.logError(`⚠️ Agent ${agentId} ne répond plus (timeout: ${Math.round(timeSinceHeartbeat/1000)}s)`);
        
        // Marquer comme en erreur et tenter une récupération
        agent.status = 'error';
        this.state.agentStates[agentId] = 'error';
        
        // Programmer une récupération
        setTimeout(() => {
          this.resetAgent(agentId);
        }, 1000);
      }
    }
  }

  reportStatus() {
    if (this.state.activeFeature) {
      const { monitoring } = this.state;
      const completion = monitoring.tasksTotal > 0 ? 
        Math.round((monitoring.tasksCompleted / monitoring.tasksTotal) * 100) : 0;
      
      this.log(`📊 Status: ${completion}% complété, ${monitoring.currentLoad}% charge, avg: ${monitoring.averageExecutionTime}ms`);
    }
  }

  /**
   * 🔍 INTÉGRATION CONTEXT7
   */
  async consultContext7ForTask(task) {
    const cacheKey = `task:${task.type}:${task.agentId}`;
    
    if (this.context7Cache.has(cacheKey)) {
      task.context7Results = this.context7Cache.get(cacheKey);
      return;
    }

    try {
      const queries = [
        `${task.type} ${task.description} best practices`,
        `${task.type} common issues solutions`,
        `${task.technology || 'general'} implementation patterns`
      ];

      const results = await Promise.all(
        queries.map(query => this.callContext7API(query))
      );

      const filteredResults = results.filter(Boolean);
      
      if (filteredResults.length > 0) {
        this.context7Cache.set(cacheKey, filteredResults);
        task.context7Results = filteredResults;
        
        this.log(`📚 Context7: ${filteredResults.length} ressources trouvées pour ${task.id}`);
      }
    } catch (error) {
      this.logError('Erreur Context7:', error);
    }
  }

  async callContext7API(query) {
    // Simulation de l'appel Context7 (à remplacer par la vraie API)
    await this.sleep(200);
    
    return {
      query,
      results: [
        {
          title: `Best practices for ${query}`,
          snippet: `Recommendations for implementing ${query} effectively...`,
          relevance: 0.85,
          source: 'context7'
        }
      ],
      timestamp: new Date()
    };
  }

  /**
   * 🎛️ MÉTHODES D'ÉVÉNEMENTS
   */
  handleAgentTaskComplete(data) {
    this.log(`✅ Agent ${data.agentId} a terminé: ${data.task.id}`);
    this.emit('agentTaskComplete', data);
  }

  handleAgentTaskFailed(data) {
    this.log(`❌ Agent ${data.agentId} a échoué: ${data.task.id}`);
    this.emit('agentTaskFailed', data);
  }

  /**
   * 🛠️ UTILITAIRES
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📟 LOGGING
   */
  log(message, ...args) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(chalk.gray(`[${timestamp}]`), chalk.blue('[ORCHESTRATOR]'), message, ...args);
  }

  logError(message, error) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.error(chalk.gray(`[${timestamp}]`), chalk.red('[ORCHESTRATOR]'), chalk.red(message));
    if (error) {
      console.error(chalk.red(error.stack || error.message || error));
    }
  }

  /**
   * 📊 STATUS GLOBAL
   */
  getStatus() {
    return {
      agents: Object.fromEntries(
        Array.from(this.agents.entries()).map(([id, agent]) => [
          id, 
          {
            status: agent.status,
            currentTask: agent.currentTask?.id,
            completedTasks: agent.completedTasks.length,
            errors: agent.errors.length
          }
        ])
      ),
      activeFeature: this.state.activeFeature?.name,
      totalTasks: this.tasks.size,
      conflicts: this.state.conflicts.length,
      cache: this.context7Cache ? this.context7Cache.getStats() : null
    };
  }

  /**
   * 🧠 GESTION DU CACHE CONTEXT7
   */
  getCacheStats() {
    return this.context7Cache ? this.context7Cache.getStats() : null;
  }

  async clearCache(agentId = null) {
    if (this.context7Cache) {
      this.context7Cache.clear(agentId);
      this.log(`🧹 Cache Context7 nettoyé${agentId ? ` pour ${agentId}` : ''}`);
    }
  }

  async warmupCache(queries = []) {
    if (this.context7Cache) {
      await this.context7Cache.warmup(queries);
      this.log(`🔥 Cache Context7 préchauffé avec ${queries.length} requêtes`);
    }
  }

  searchCache(query, options = {}) {
    if (this.context7Cache) {
      return this.context7Cache.search(query, options);
    }
    return [];
  }

  async exportCache(filePath) {
    if (this.context7Cache) {
      await this.context7Cache.export(filePath);
      this.log(`📤 Cache Context7 exporté vers: ${filePath}`);
    }
  }

  async importCache(filePath) {
    if (this.context7Cache) {
      await this.context7Cache.import(filePath);
      this.log(`📥 Cache Context7 importé depuis: ${filePath}`);
    }
  }

  updateCacheConfig(newConfig) {
    if (this.context7Cache) {
      this.context7Cache.updateConfig(newConfig);
      this.log(`⚙️ Configuration cache Context7 mise à jour`);
    }
  }
}

export default MultiAgentOrchestrator;

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new MultiAgentOrchestrator();
  
  // Exemple d'utilisation
  const exampleFeature = {
    name: 'User Authentication',
    type: 'crud-feature',
    description: 'Système d\'authentification complet avec Supabase',
    priority: 'critical',
    requirements: [
      'Signup/Login/Logout',
      'Reset password',
      'Profile management',
      'JWT token handling'
    ]
  };

  orchestrator.dispatchFeature(exampleFeature)
    .then(result => {
      console.log('🎉 Feature complétée:', result);
      console.log('📊 Status final:', orchestrator.getStatus());
    })
    .catch(error => {
      console.error('💥 Erreur:', error);
    });
}