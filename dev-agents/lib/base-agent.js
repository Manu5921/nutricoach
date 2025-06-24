#!/usr/bin/env node

/**
 * 🤖 BASE AGENT - CLASSE PARENTE
 * 
 * Classe de base pour tous les agents spécialisés
 * Fournit les fonctionnalités communes : logging, Context7, états, etc.
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import Context7CacheManager from './context7-cache.js';

export class BaseAgent extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      id: config.id,
      name: config.name,
      specialization: config.specialization,
      color: config.color || 'white',
      capabilities: config.capabilities || [],
      dependencies: config.dependencies || [],
      outputPaths: config.outputPaths || {},
      timeout: config.timeout || 300000, // 5 minutes par défaut
      retries: config.retries || 3
    };

    this.state = {
      status: 'idle', // idle, working, error, completed
      currentTask: null,
      completedTasks: [],
      errors: [],
      metrics: {
        tasksCompleted: 0,
        tasksActive: 0,
        totalErrors: 0,
        averageExecutionTime: 0,
        lastActivityAt: null
      }
    };

    this.context7Cache = new Map();
    this.taskQueue = [];
    this.isProcessing = false;

    // Cache partagé Context7 (si fourni par l'orchestrateur)
    this.sharedContext7Cache = null;

    this.log(`🤖 Agent ${this.config.name} initialisé`);
    
    // Démarrer le monitoring de santé
    setInterval(() => {
      this.emitHealthUpdate();
      this.cleanExpiredCache();
    }, 60000); // Toutes les minutes
  }

  /**
   * 🎯 MÉTHODE PRINCIPALE - À IMPLÉMENTER PAR LES AGENTS
   */
  async processTask(task) {
    throw new Error(`processTask() doit être implémentée par l'agent ${this.config.id}`);
  }

  /**
   * 📋 EXÉCUTION D'UNE TÂCHE AVEC GESTION D'ERREURS
   */
  async executeTask(task) {
    const startTime = Date.now();
    this.state.status = 'working';
    this.state.currentTask = task;
    this.state.metrics.tasksActive++;
    this.state.metrics.lastActivityAt = new Date();

    this.log(`🚀 Démarrage tâche: ${task.description}`);
    this.emit('taskStarted', { agent: this.config.id, task });

    try {
      // Vérifier les dépendances Context7 si nécessaire
      if (task.useContext7) {
        await this.checkContext7Dependencies(task);
      }

      // Exécuter la tâche principale
      const result = await this.processTask(task);

      // Calculer les métriques
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, true);

      // Mettre à jour l'état
      this.state.status = 'completed';
      this.state.currentTask = null;
      this.state.completedTasks.push({
        ...task,
        result,
        executionTime,
        completedAt: new Date()
      });

      this.log(`✅ Tâche complétée: ${task.description} (${executionTime}ms)`);
      this.emit('taskCompleted', { agent: this.config.id, task, result, executionTime });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, false);

      this.state.status = 'error';
      this.state.errors.push({
        task,
        error: error.message,
        stack: error.stack,
        timestamp: new Date(),
        executionTime
      });

      this.logError(`❌ Échec tâche: ${task.description}`, error);
      this.emit('taskFailed', { agent: this.config.id, task, error, executionTime });

      throw error;
    } finally {
      this.state.metrics.tasksActive--;
    }
  }

  /**
   * 🔍 CONSULTATION CONTEXT7 AMÉLIORÉE AVEC CACHE PARTAGÉ
   */
  async consultContext7(query, useCache = true) {
    try {
      this.log(`🔍 Consultation Context7: ${query}`);
      
      // Enrichir la requête avec le contexte de l'agent
      const enrichedQuery = `${this.config.specialization} ${query} ${this.config.capabilities.join(' ')}`;
      
      // Essayer le cache partagé d'abord
      if (useCache && this.sharedContext7Cache) {
        const cachedResult = await this.sharedContext7Cache.get(enrichedQuery, this.config.id);
        if (cachedResult) {
          this.log(`📚 Context7 shared cache hit: ${query}`);
          return cachedResult;
        }
      }

      // Essayer le cache local en fallback
      const localCacheKey = `context7:${this.config.id}:${query}`;
      if (useCache && this.context7Cache.has(localCacheKey)) {
        this.log(`📚 Context7 local cache hit: ${query}`);
        return this.context7Cache.get(localCacheKey);
      }
      
      // Appel API Context7
      const result = await this.callContext7API(enrichedQuery);
      
      if (result && useCache) {
        // Sauvegarder dans le cache partagé en priorité
        if (this.sharedContext7Cache) {
          await this.sharedContext7Cache.set(enrichedQuery, result, this.config.id, {
            tags: [this.config.specialization, 'context7-api'],
            ttl: 3600000 // 1 heure
          });
          this.log(`💾 Résultat sauvé dans le cache partagé`);
        } else {
          // Fallback vers le cache local
          this.context7Cache.set(localCacheKey, {
            ...result,
            cachedAt: Date.now(),
            ttl: 3600000
          });
          this.log(`💾 Résultat sauvé dans le cache local`);
        }
      }

      return result;

    } catch (error) {
      this.logError('Erreur Context7:', error);
      return null;
    }
  }

  /**
   * 🔗 CONFIGURATION DU CACHE PARTAGÉ
   */
  setSharedContext7Cache(cacheManager) {
    this.sharedContext7Cache = cacheManager;
    this.log(`🧠 Cache Context7 partagé configuré`);
  }

  async callContext7API(query) {
    try {
      // Utiliser le MCP Context7 si disponible
      if (typeof globalThis.mcp__context7__resolve_library_id === 'function') {
        const response = await this.queryContext7MCP(query);
        if (response) return response;
      }
    } catch (error) {
      this.log(`⚠️ Context7 MCP error: ${error.message}`);
    }
    
    // Fallback vers simulation
    return await this.simulateContext7Query(query);
  }

  async queryContext7MCP(query) {
    // Extraire le terme principal pour la recherche de librairie
    const mainTerm = query.split(' ')[0];
    
    try {
      const libraryResponse = await globalThis.mcp__context7__resolve_library_id({
        libraryName: mainTerm
      });
      
      if (libraryResponse?.libraryId) {
        const docsResponse = await globalThis.mcp__context7__get_library_docs({
          context7CompatibleLibraryID: libraryResponse.libraryId,
          topic: query,
          tokens: 3000
        });
        
        return {
          query,
          results: [{
            title: `Context7: ${mainTerm} Documentation`,
            snippet: docsResponse?.content?.substring(0, 200) || 'Documentation found',
            fullContent: docsResponse?.content,
            relevance: 0.9,
            source: 'context7-mcp',
            libraryId: libraryResponse.libraryId
          }],
          timestamp: new Date()
        };
      }
    } catch (error) {
      this.log(`Context7 MCP query failed: ${error.message}`);
    }
    
    return null;
  }

  /**
   * 🔗 VÉRIFICATION DES DÉPENDANCES CONTEXT7
   */
  async checkContext7Dependencies(task) {
    const queries = [
      `${task.type} ${this.config.specialization} best practices`,
      `${task.type} common issues solutions`,
      `${task.technology || 'general'} ${task.type} patterns`
    ];

    const results = await Promise.all(
      queries.map(query => this.consultContext7(query))
    );

    task.context7Results = results.filter(Boolean);
    
    if (task.context7Results.length > 0) {
      this.log(`📚 Context7: ${task.context7Results.length} ressources trouvées`);
    }
  }

  /**
   * 📊 MISE À JOUR DES MÉTRIQUES
   */
  updateMetrics(executionTime, success) {
    this.state.metrics.tasksCompleted++;
    
    if (success) {
      // Calculer la moyenne mobile du temps d'exécution
      const currentAvg = this.state.metrics.averageExecutionTime;
      const count = this.state.metrics.tasksCompleted;
      this.state.metrics.averageExecutionTime = 
        (currentAvg * (count - 1) + executionTime) / count;
    } else {
      this.state.metrics.totalErrors++;
    }
  }

  /**
   * 📁 CRÉATION DE FICHIERS
   */
  async createFiles(files) {
    const createdFiles = [];

    for (const file of files) {
      try {
        // Créer les dossiers parents si nécessaire
        const dir = path.dirname(file.path);
        await fs.mkdir(dir, { recursive: true });

        // Écrire le fichier
        if (file.append) {
          await fs.appendFile(file.path, file.content);
        } else {
          await fs.writeFile(file.path, file.content);
        }

        createdFiles.push(file.path);
        this.log(`📄 Fichier créé: ${file.path}`);

      } catch (error) {
        this.logError(`Erreur création fichier ${file.path}:`, error);
        throw error;
      }
    }

    return createdFiles;
  }

  /**
   * 🔄 COMMUNICATION INTER-AGENTS AMÉLIORÉE
   */
  async sendMessage(targetAgentId, message) {
    this.log(`📤 Message vers ${targetAgentId}: ${message.type}`);
    
    // Enrichir le message avec le contexte de l'agent
    const enrichedMessage = {
      ...message,
      agentContext: {
        capabilities: this.config.capabilities,
        currentLoad: this.state.metrics.tasksActive,
        specialization: this.config.specialization
      }
    };
    
    this.emit('messageToAgent', {
      from: this.config.id,
      to: targetAgentId,
      message: enrichedMessage,
      timestamp: new Date()
    });
  }

  async receiveMessage(fromAgentId, message) {
    this.log(`📥 Message de ${fromAgentId}: ${message.type}`);
    
    // Mettre à jour les métriques de communication
    this.updateCommunicationMetrics(message);
    
    this.emit('messageReceived', {
      from: fromAgentId,
      to: this.config.id,
      message,
      timestamp: new Date()
    });

    // Traiter le message selon son type
    switch (message.type) {
      case 'dependency-ready':
        await this.handleDependencyReady(message);
        break;
      case 'request-assistance':
        await this.handleAssistanceRequest(message);
        break;
      case 'share-resource':
        await this.handleResourceShare(message);
        break;
      case 'context7-insight':
        await this.handleContext7Insight(message);
        break;
      case 'cross-validation':
        await this.handleCrossValidation(message);
        break;
      case 'resource-request':
        await this.handleResourceRequest(message);
        break;
      default:
        this.log(`⚠️ Type de message non supporté: ${message.type}`);
    }
  }

  updateCommunicationMetrics(message) {
    if (!this.communicationMetrics) {
      this.communicationMetrics = {
        messagesReceived: 0,
        messagesSent: 0,
        lastMessageAt: null
      };
    }
    
    this.communicationMetrics.messagesReceived++;
    this.communicationMetrics.lastMessageAt = new Date();
  }

  async handleContext7Insight(message) {
    this.log(`🧠 Insight Context7 reçu: ${message.data.sourceTask}`);
    
    // Stocker les insights pour utilisation future
    if (!this.receivedInsights) {
      this.receivedInsights = [];
    }
    
    this.receivedInsights.push({
      source: message.data.sourceTask,
      insights: message.data.insights,
      receivedAt: new Date()
    });
    
    // Garder seulement les 50 derniers insights
    if (this.receivedInsights.length > 50) {
      this.receivedInsights = this.receivedInsights.slice(-50);
    }
  }

  async handleCrossValidation(message) {
    this.log(`🔍 Demande de validation croisée: ${message.data.validationType}`);
    
    try {
      const validation = await this.performCrossValidation(
        message.data.artifact,
        message.data.validationType
      );
      
      // Renvoyer le résultat de validation
      await this.sendMessage(message.data.requestedBy, {
        type: 'validation-result',
        data: {
          validationId: message.data.validationId,
          result: validation,
          validator: this.config.id
        }
      });
      
    } catch (error) {
      this.logError('Erreur validation croisée:', error);
    }
  }

  async performCrossValidation(artifact, validationType) {
    // Validation basique - à surcharger par les agents spécialisés
    return {
      valid: true,
      warnings: [],
      suggestions: ['Validation générique effectuée']
    };
  }

  async handleResourceRequest(message) {
    this.log(`📋 Demande de ressource: ${message.data.resourceType}`);
    
    // Émettre vers l'orchestrateur pour gestion centralisée
    this.emit('resourceRequest', {
      from: this.config.id,
      resourceType: message.data.resourceType,
      specification: message.data.specification
    });
  }

  async requestResource(resourceType, specification = {}) {
    this.log(`📤 Demande de ressource: ${resourceType}`);
    
    this.emit('resourceRequest', {
      from: this.config.id,
      resourceType,
      specification
    });
  }

  /**
   * 🤝 GESTION DES MESSAGES INTER-AGENTS AMÉLIORÉE
   */
  async handleDependencyReady(message) {
    this.log(`✅ Dépendance prête: ${message.data.dependency}`);
    
    // Reprendre les tâches en attente de cette dépendance
    if (this.pendingTasks) {
      const readyTasks = this.pendingTasks.filter(task => 
        task.waitingFor === message.data.dependency
      );
      
      for (const task of readyTasks) {
        this.log(`🔄 Reprise de la tâche: ${task.id}`);
        this.taskQueue.push(task);
      }
      
      this.pendingTasks = this.pendingTasks.filter(task => 
        task.waitingFor !== message.data.dependency
      );
    }
  }

  async handleAssistanceRequest(message) {
    this.log(`🆘 Demande d'assistance: ${message.data.issue}`);
    
    // Vérifier si on peut aider selon nos capacités
    const canHelp = this.config.capabilities.some(cap => 
      message.data.requiredCapabilities?.includes(cap)
    );
    
    if (canHelp && this.state.status === 'idle') {
      await this.sendMessage(message.data.requestedBy, {
        type: 'assistance-offer',
        data: {
          assistantAgent: this.config.id,
          availableCapabilities: this.config.capabilities,
          estimatedTime: this.estimateAssistanceTime(message.data.issue)
        }
      });
    }
  }

  estimateAssistanceTime(issue) {
    // Estimation basique du temps d'assistance
    return '30m'; // Par défaut
  }

  async handleResourceShare(message) {
    this.log(`📚 Ressource partagée: ${message.data.resourceType}`);
    
    // Stocker la ressource pour utilisation
    if (!this.sharedResources) {
      this.sharedResources = new Map();
    }
    
    this.sharedResources.set(message.data.resourceType, {
      content: message.data.content,
      source: message.data.source,
      receivedAt: new Date(),
      timestamp: message.data.timestamp
    });
    
    this.log(`💾 Ressource ${message.data.resourceType} stockée depuis ${message.data.source}`);
  }

  getSharedResource(resourceType) {
    return this.sharedResources?.get(resourceType)?.content || null;
  }

  hasSharedResource(resourceType) {
    return this.sharedResources?.has(resourceType) || false;
  }

  /**
   * 🔄 SIMULATION CONTEXT7 (À REMPLACER)
   */
  async simulateContext7Query(query) {
    // Simuler un délai de requête
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      query,
      results: [
        {
          title: `Best practices for ${query}`,
          snippet: `Recommendations for implementing ${query} effectively...`,
          relevance: 0.85
        }
      ],
      timestamp: new Date()
    };
  }

  /**
   * 📊 STATUT DE L'AGENT ENRICHI
   */
  getStatus() {
    return {
      id: this.config.id,
      name: this.config.name,
      specialization: this.config.specialization,
      status: this.state.status,
      health: this.calculateHealth(),
      currentTask: this.state.currentTask?.id,
      metrics: {
        ...this.state.metrics,
        communication: this.communicationMetrics,
        context7CacheSize: this.context7Cache.size,
        sharedResourcesCount: this.sharedResources?.size || 0
      },
      errors: this.state.errors.length,
      recentErrors: this.getRecentErrors(),
      capabilities: this.config.capabilities,
      dependencies: this.config.dependencies,
      resources: {
        shared: Array.from(this.sharedResources?.keys() || []),
        context7Insights: this.receivedInsights?.length || 0
      },
      performance: {
        avgTaskTime: this.calculateAvgTaskTime(),
        loadFactor: this.calculateLoadFactor()
      }
    };
  }

  calculateHealth() {
    const errorRate = this.state.errors.length / Math.max(this.state.completedTasks.length, 1);
    const recentErrorRate = this.getRecentErrors().length / Math.max(5, 1); // Sur les 5 dernières minutes
    
    if (this.state.status === 'error') return 'error';
    if (errorRate > 0.3 || recentErrorRate > 0.5) return 'degraded';
    if (this.state.status === 'working' && this.state.metrics.tasksActive > 3) return 'stressed';
    return 'healthy';
  }

  getRecentErrors() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return this.state.errors.filter(error => 
      error.timestamp && error.timestamp.getTime() > fiveMinutesAgo
    );
  }

  calculateAvgTaskTime() {
    if (this.state.completedTasks.length === 0) return 0;
    
    const totalTime = this.state.completedTasks.reduce((sum, task) => 
      sum + (task.executionTime || 0), 0
    );
    
    return Math.round(totalTime / this.state.completedTasks.length);
  }

  calculateLoadFactor() {
    const maxConcurrentTasks = 5; // Configurable
    return (this.state.metrics.tasksActive / maxConcurrentTasks) * 100;
  }

  /**
   * 🧹 NETTOYAGE DES RESSOURCES AMÉLIORÉ
   */
  cleanup() {
    this.context7Cache.clear();
    this.taskQueue = [];
    this.state.status = 'idle';
    this.state.currentTask = null;
    
    // Nettoyer les nouvelles structures de données
    if (this.sharedResources) {
      this.sharedResources.clear();
    }
    
    if (this.receivedInsights) {
      this.receivedInsights = [];
    }
    
    if (this.pendingTasks) {
      this.pendingTasks = [];
    }
    
    // Réinitialiser les métriques de communication
    this.communicationMetrics = {
      messagesReceived: 0,
      messagesSent: 0,
      lastMessageAt: null
    };
    
    this.log(`🧹 Nettoyage complet agent ${this.config.name} terminé`);
  }

  /**
   * 🔧 AUTO-RÉCUPÉRATION
   */
  async selfHeal() {
    this.log('🔧 Tentative d\'auto-récupération...');
    
    try {
      // Nettoyer les tâches bloquées
      if (this.state.currentTask) {
        const taskAge = Date.now() - (this.state.currentTask.startedAt || Date.now());
        if (taskAge > 300000) { // 5 minutes
          this.log('⚠️ Tâche bloquée détectée, abandon...');
          this.state.currentTask = null;
          this.state.status = 'idle';
        }
      }
      
      // Nettoyer le cache expiré
      this.cleanExpiredCache();
      
      // Réinitialiser les métriques si nécessaire
      if (this.state.errors.length > 10) {
        this.state.errors = this.state.errors.slice(-5); // Garder les 5 dernières
      }
      
      this.log('✅ Auto-récupération terminée');
      return true;
      
    } catch (error) {
      this.logError('Erreur lors de l\'auto-récupération:', error);
      return false;
    }
  }

  cleanExpiredCache() {
    let cleanedCount = 0;
    
    for (const [key, value] of this.context7Cache.entries()) {
      if (value.cachedAt && value.ttl) {
        if (Date.now() - value.cachedAt > value.ttl) {
          this.context7Cache.delete(key);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      this.log(`🗑️ ${cleanedCount} entrées de cache expirées nettoyées`);
    }
  }

  /**
   * 📊 ÉMISSION DE MÉTRIQUES DE SANTÉ
   */
  emitHealthUpdate() {
    const health = this.calculateHealth();
    const metrics = {
      loadFactor: this.calculateLoadFactor(),
      avgTaskTime: this.calculateAvgTaskTime(),
      errorRate: this.state.errors.length / Math.max(this.state.completedTasks.length, 1)
    };
    
    this.emit('healthUpdate', {
      agentId: this.config.id,
      health,
      metrics,
      timestamp: new Date()
    });
  }

  /**
   * 📟 LOGGING
   */
  log(message, ...args) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const colorFn = chalk[this.config.color] || chalk.white;
    const prefix = colorFn(`[${this.config.id}]`);
    console.log(chalk.gray(`[${timestamp}]`), prefix, message, ...args);
  }

  logError(message, error) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = chalk.red(`[${this.config.id}]`);
    console.error(chalk.gray(`[${timestamp}]`), prefix, chalk.red(message));
    if (error) {
      console.error(chalk.red(error.stack || error.message || error));
    }
  }

  /**
   * 🛠️ UTILITAIRES
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  toPascalCase(str) {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
}

export default BaseAgent;