#!/usr/bin/env node

/**
 * 🧠 CONTEXT7 SHARED CACHE SYSTEM
 * 
 * Système de cache partagé pour les résultats Context7
 * Optimise les performances et réduit les appels API
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

export class Context7CacheManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Configuration du cache
      maxSize: options.maxSize || 1000, // Nombre max d'entrées
      defaultTTL: options.defaultTTL || 3600000, // 1 heure par défaut
      cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
      persistPath: options.persistPath || path.join(process.cwd(), 'cache', 'context7.json'),
      
      // Configuration de la qualité
      minRelevanceScore: options.minRelevanceScore || 0.7,
      maxAge: options.maxAge || 86400000, // 24 heures
      
      // Configuration de la stratégie
      strategy: options.strategy || 'lru', // lru, lfu, fifo
      sharing: options.sharing || true,
      compression: options.compression || false
    };

    // Cache principal (Map pour performance)
    this.cache = new Map();
    
    // Métadonnées pour chaque entrée
    this.metadata = new Map();
    
    // Statistiques d'utilisation
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      saves: 0,
      loads: 0,
      size: 0,
      queries: new Map() // Fréquence des requêtes
    };

    // Index par agent pour la purge sélective
    this.agentIndex = new Map();
    
    // Index par type de requête
    this.typeIndex = new Map();

    // Démarrer le nettoyage périodique
    this.startPeriodicCleanup();
    
    // Charger le cache persisté
    this.loadPersistedCache();

    this.log('🧠 Context7 Cache Manager initialisé');
  }

  /**
   * 🔍 RÉCUPÉRATION DEPUIS LE CACHE
   */
  async get(query, agentId, options = {}) {
    const cacheKey = this.generateCacheKey(query, agentId, options);
    
    if (this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      const meta = this.metadata.get(cacheKey);
      
      // Vérifier la validité
      if (this.isValidEntry(entry, meta, options)) {
        // Mettre à jour les statistiques d'accès
        this.updateAccessStats(cacheKey, meta, agentId);
        
        this.stats.hits++;
        this.log(`🎯 Cache hit: ${query.substring(0, 50)}... (${agentId})`);
        
        // Émettre l'événement pour le monitoring
        this.emit('cacheHit', { query, agentId, key: cacheKey });
        
        return {
          ...entry,
          cached: true,
          cacheKey,
          cachedAt: meta.createdAt,
          agentId: meta.agentId
        };
      } else {
        // Entrée expirée ou invalide
        this.delete(cacheKey);
      }
    }

    this.stats.misses++;
    this.emit('cacheMiss', { query, agentId, key: cacheKey });
    
    return null;
  }

  /**
   * 💾 SAUVEGARDE DANS LE CACHE
   */
  async set(query, result, agentId, options = {}) {
    const cacheKey = this.generateCacheKey(query, agentId, options);
    
    // Vérifier la qualité du résultat
    if (!this.isQualityResult(result, options)) {
      this.log(`⚠️ Résultat de faible qualité ignoré: ${query.substring(0, 30)}...`);
      return false;
    }

    // Vérifier l'espace disponible
    await this.ensureSpace();

    // Préparer les métadonnées
    const metadata = {
      agentId,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      ttl: options.ttl || this.config.defaultTTL,
      tags: options.tags || [],
      relevanceScore: this.calculateRelevance(result),
      queryType: this.detectQueryType(query),
      size: JSON.stringify(result).length
    };

    // Sauvegarder
    this.cache.set(cacheKey, result);
    this.metadata.set(cacheKey, metadata);

    // Mettre à jour les index
    this.updateIndexes(cacheKey, agentId, metadata);

    // Statistiques
    this.stats.saves++;
    this.stats.size = this.cache.size;

    this.log(`💾 Cache saved: ${query.substring(0, 50)}... (${agentId})`);
    this.emit('cacheSave', { query, agentId, key: cacheKey, metadata });

    // Persister si configuré
    if (this.config.persistPath) {
      await this.persistCache();
    }

    return true;
  }

  /**
   * 🔑 GÉNÉRATION DE CLÉ DE CACHE
   */
  generateCacheKey(query, agentId, options = {}) {
    // Normaliser la requête
    const normalizedQuery = this.normalizeQuery(query);
    
    // Inclure l'agent et les options pertinentes
    const keyComponents = [
      normalizedQuery,
      agentId,
      options.includeAgent ? agentId : '',
      options.context || '',
      JSON.stringify(options.filters || {})
    ];

    // Créer une clé unique mais lisible
    const keyString = keyComponents.join('|');
    
    // Utiliser un hash pour les longues requêtes
    if (keyString.length > 200) {
      const crypto = await import('crypto');
      return `${agentId}_${crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16)}`;
    }

    return keyString.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  normalizeQuery(query) {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '');
  }

  /**
   * ✅ VALIDATION D'ENTRÉE
   */
  isValidEntry(entry, metadata, options = {}) {
    const now = Date.now();
    
    // Vérifier l'expiration
    if (now - metadata.createdAt > metadata.ttl) {
      return false;
    }

    // Vérifier l'âge maximum
    if (now - metadata.createdAt > this.config.maxAge) {
      return false;
    }

    // Vérifier la pertinence
    if (metadata.relevanceScore < this.config.minRelevanceScore) {
      return false;
    }

    // Options spécifiques
    if (options.maxAge && now - metadata.createdAt > options.maxAge) {
      return false;
    }

    return true;
  }

  isQualityResult(result, options = {}) {
    if (!result || typeof result !== 'object') {
      return false;
    }

    // Vérifier la structure attendue
    if (!result.results || !Array.isArray(result.results)) {
      return false;
    }

    // Vérifier la qualité du contenu
    const hasQualityContent = result.results.some(item => 
      item.snippet && item.snippet.length > 20
    );

    return hasQualityContent;
  }

  calculateRelevance(result) {
    if (!result.results || result.results.length === 0) {
      return 0;
    }

    // Calculer un score basé sur la qualité des résultats
    const scores = result.results.map(item => {
      let score = 0.5; // Score de base

      // Longueur du snippet
      if (item.snippet && item.snippet.length > 100) score += 0.2;
      if (item.snippet && item.snippet.length > 200) score += 0.1;

      // Présence d'un titre
      if (item.title && item.title.length > 10) score += 0.1;

      // Score de relevance si fourni
      if (item.relevance && item.relevance > 0.8) score += 0.1;

      return Math.min(score, 1.0);
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  detectQueryType(query) {
    const patterns = {
      'best-practices': /best\s+practice|guideline|standard|convention/i,
      'troubleshooting': /error|issue|problem|fix|solve|debug/i,
      'tutorial': /how\s+to|tutorial|guide|example|demo/i,
      'reference': /api|reference|documentation|spec/i,
      'architecture': /architecture|design|pattern|structure/i,
      'security': /security|authentication|authorization|vulnerability/i,
      'performance': /performance|optimization|speed|fast|slow/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        return type;
      }
    }

    return 'general';
  }

  /**
   * 📊 GESTION DES STATISTIQUES
   */
  updateAccessStats(cacheKey, metadata, agentId) {
    metadata.lastAccessed = Date.now();
    metadata.accessCount++;

    // Statistiques par agent
    if (!this.agentStats) {
      this.agentStats = new Map();
    }
    
    const agentStat = this.agentStats.get(agentId) || { hits: 0, queries: 0 };
    agentStat.hits++;
    this.agentStats.set(agentId, agentStat);

    // Fréquence des requêtes
    const queryPattern = this.extractQueryPattern(cacheKey);
    const count = this.stats.queries.get(queryPattern) || 0;
    this.stats.queries.set(queryPattern, count + 1);
  }

  extractQueryPattern(cacheKey) {
    return cacheKey.split('|')[0].substring(0, 30);
  }

  /**
   * 🗂️ GESTION DES INDEX
   */
  updateIndexes(cacheKey, agentId, metadata) {
    // Index par agent
    if (!this.agentIndex.has(agentId)) {
      this.agentIndex.set(agentId, new Set());
    }
    this.agentIndex.get(agentId).add(cacheKey);

    // Index par type
    const queryType = metadata.queryType;
    if (!this.typeIndex.has(queryType)) {
      this.typeIndex.set(queryType, new Set());
    }
    this.typeIndex.get(queryType).add(cacheKey);
  }

  /**
   * 🧹 GESTION DE L'ESPACE
   */
  async ensureSpace() {
    if (this.cache.size < this.config.maxSize) {
      return;
    }

    const entriesToRemove = Math.ceil(this.config.maxSize * 0.1); // Supprimer 10%
    
    switch (this.config.strategy) {
      case 'lru':
        await this.evictLRU(entriesToRemove);
        break;
      case 'lfu':
        await this.evictLFU(entriesToRemove);
        break;
      case 'fifo':
        await this.evictFIFO(entriesToRemove);
        break;
      default:
        await this.evictLRU(entriesToRemove);
    }
  }

  async evictLRU(count) {
    // Least Recently Used
    const entries = Array.from(this.metadata.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      .slice(0, count);

    for (const [key] of entries) {
      this.delete(key);
      this.stats.evictions++;
    }

    this.log(`🗑️ Éviction LRU: ${count} entrées supprimées`);
  }

  async evictLFU(count) {
    // Least Frequently Used
    const entries = Array.from(this.metadata.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount)
      .slice(0, count);

    for (const [key] of entries) {
      this.delete(key);
      this.stats.evictions++;
    }

    this.log(`🗑️ Éviction LFU: ${count} entrées supprimées`);
  }

  async evictFIFO(count) {
    // First In, First Out
    const entries = Array.from(this.metadata.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
      .slice(0, count);

    for (const [key] of entries) {
      this.delete(key);
      this.stats.evictions++;
    }

    this.log(`🗑️ Éviction FIFO: ${count} entrées supprimées`);
  }

  /**
   * 🗑️ SUPPRESSION
   */
  delete(cacheKey) {
    const metadata = this.metadata.get(cacheKey);
    
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.metadata.delete(cacheKey);

      // Nettoyer les index
      if (metadata) {
        this.cleanupIndexes(cacheKey, metadata);
      }

      this.stats.size = this.cache.size;
      return true;
    }

    return false;
  }

  cleanupIndexes(cacheKey, metadata) {
    // Agent index
    const agentKeys = this.agentIndex.get(metadata.agentId);
    if (agentKeys) {
      agentKeys.delete(cacheKey);
      if (agentKeys.size === 0) {
        this.agentIndex.delete(metadata.agentId);
      }
    }

    // Type index
    const typeKeys = this.typeIndex.get(metadata.queryType);
    if (typeKeys) {
      typeKeys.delete(cacheKey);
      if (typeKeys.size === 0) {
        this.typeIndex.delete(metadata.queryType);
      }
    }
  }

  /**
   * 🧹 NETTOYAGE PÉRIODIQUE
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  cleanupExpired() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, metadata] of this.metadata.entries()) {
      if (now - metadata.createdAt > metadata.ttl || 
          now - metadata.createdAt > this.config.maxAge) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.log(`🧹 Nettoyage automatique: ${cleanedCount} entrées expirées supprimées`);
    }
  }

  /**
   * 💾 PERSISTANCE
   */
  async persistCache() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        config: this.config,
        entries: Array.from(this.cache.entries()),
        metadata: Array.from(this.metadata.entries()),
        stats: { ...this.stats, queries: Array.from(this.stats.queries.entries()) }
      };

      const cacheDir = path.dirname(this.config.persistPath);
      await fs.mkdir(cacheDir, { recursive: true });
      
      await fs.writeFile(this.config.persistPath, JSON.stringify(cacheData, null, 2));
      
      this.log(`💾 Cache persisté: ${this.cache.size} entrées`);
    } catch (error) {
      this.log(`❌ Erreur persistance cache: ${error.message}`);
    }
  }

  async loadPersistedCache() {
    try {
      if (await fs.access(this.config.persistPath).then(() => true).catch(() => false)) {
        const data = await fs.readFile(this.config.persistPath, 'utf-8');
        const cacheData = JSON.parse(data);

        // Vérifier la compatibilité
        const maxAge = 86400000; // 24 heures
        if (Date.now() - cacheData.timestamp > maxAge) {
          this.log('⚠️ Cache persisté trop ancien, ignoré');
          return;
        }

        // Restaurer les données
        this.cache = new Map(cacheData.entries);
        this.metadata = new Map(cacheData.metadata);
        
        if (cacheData.stats) {
          this.stats = { ...this.stats, ...cacheData.stats };
          if (cacheData.stats.queries) {
            this.stats.queries = new Map(cacheData.stats.queries);
          }
        }

        // Reconstruire les index
        this.rebuildIndexes();

        // Nettoyer les entrées expirées
        this.cleanupExpired();

        this.log(`💾 Cache restauré: ${this.cache.size} entrées`);
      }
    } catch (error) {
      this.log(`❌ Erreur chargement cache: ${error.message}`);
    }
  }

  rebuildIndexes() {
    this.agentIndex.clear();
    this.typeIndex.clear();

    for (const [key, metadata] of this.metadata.entries()) {
      this.updateIndexes(key, metadata.agentId, metadata);
    }
  }

  /**
   * 📊 API DE GESTION
   */
  clear(agentId = null) {
    if (agentId) {
      // Nettoyer seulement pour un agent spécifique
      const agentKeys = this.agentIndex.get(agentId);
      if (agentKeys) {
        for (const key of agentKeys) {
          this.delete(key);
        }
      }
      this.log(`🧹 Cache nettoyé pour agent: ${agentId}`);
    } else {
      // Nettoyer tout le cache
      this.cache.clear();
      this.metadata.clear();
      this.agentIndex.clear();
      this.typeIndex.clear();
      this.stats.size = 0;
      this.log('🧹 Cache complètement nettoyé');
    }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryUsage: this.getMemoryUsage(),
      agentStats: this.agentStats ? Array.from(this.agentStats.entries()) : [],
      topQueries: this.getTopQueries(10)
    };
  }

  getMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length + JSON.stringify(value).length;
    }
    return Math.round(totalSize / 1024); // KB
  }

  getTopQueries(limit = 10) {
    return Array.from(this.stats.queries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  /**
   * 🔍 RECHERCHE AVANCÉE
   */
  search(query, options = {}) {
    const results = [];
    const normalizedQuery = this.normalizeQuery(query);

    for (const [key, entry] of this.cache.entries()) {
      const metadata = this.metadata.get(key);
      
      if (this.matchesSearch(key, entry, metadata, normalizedQuery, options)) {
        results.push({
          key,
          entry,
          metadata,
          relevance: this.calculateSearchRelevance(key, normalizedQuery)
        });
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options.limit || 20);
  }

  matchesSearch(key, entry, metadata, query, options) {
    // Recherche dans la clé
    if (key.toLowerCase().includes(query)) {
      return true;
    }

    // Recherche dans les tags
    if (metadata.tags && metadata.tags.some(tag => 
      tag.toLowerCase().includes(query))) {
      return true;
    }

    // Filtres
    if (options.agentId && metadata.agentId !== options.agentId) {
      return false;
    }

    if (options.queryType && metadata.queryType !== options.queryType) {
      return false;
    }

    return false;
  }

  calculateSearchRelevance(key, query) {
    const keyLower = key.toLowerCase();
    
    if (keyLower === query) return 1.0;
    if (keyLower.startsWith(query)) return 0.9;
    if (keyLower.includes(query)) return 0.7;
    
    return 0.5;
  }

  /**
   * 📝 LOGGING
   */
  log(message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(chalk.gray(`[${timestamp}]`), chalk.blue('[Cache]'), message);
    
    // Émettre pour le monitoring
    this.emit('log', { message, timestamp });
  }

  /**
   * 🔧 CONFIGURATION DYNAMIQUE
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log(`⚙️ Configuration mise à jour: ${Object.keys(newConfig).join(', ')}`);
  }

  /**
   * 🛠️ UTILITAIRES
   */
  async warmup(queries = []) {
    this.log(`🔥 Préchauffage du cache avec ${queries.length} requêtes...`);
    
    // TODO: Implémenter le préchauffage avec des requêtes communes
    // Cela pourrait inclure des appels réels à Context7 pour populer le cache
    
    for (const query of queries) {
      // Simuler une requête de préchauffage
      this.log(`🔥 Préchauffage: ${query}`);
    }
  }

  async export(filePath) {
    const exportData = {
      timestamp: Date.now(),
      version: '1.0.0',
      cache: Array.from(this.cache.entries()),
      metadata: Array.from(this.metadata.entries()),
      stats: this.getStats()
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    this.log(`📤 Cache exporté vers: ${filePath}`);
  }

  async import(filePath) {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    this.cache = new Map(data.cache);
    this.metadata = new Map(data.metadata);
    this.rebuildIndexes();
    
    this.log(`📥 Cache importé depuis: ${filePath} (${this.cache.size} entrées)`);
  }
}

export default Context7CacheManager;