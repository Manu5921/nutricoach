#!/usr/bin/env node

/**
 * 📊 MONITORING DASHBOARD
 * 
 * Dashboard en temps réel pour le monitoring du système multi-agents
 * Métriques, alertes, et visualisation de l'état du système
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';

export class MonitoringDashboard extends EventEmitter {
  constructor(orchestrator) {
    super();
    
    this.orchestrator = orchestrator;
    this.metrics = {
      system: {
        startTime: Date.now(),
        uptime: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        activeAgents: 0,
        messagesExchanged: 0
      },
      agents: new Map(),
      tasks: new Map(),
      alerts: [],
      performance: {
        avgTaskTime: 0,
        systemLoad: 0,
        memoryUsage: 0,
        context7Hits: 0,
        context7Misses: 0
      }
    };
    
    this.alertRules = new Map();
    this.setupDefaultAlerts();
    this.isRunning = false;
    this.refreshInterval = null;
    this.logFile = path.join(process.cwd(), 'logs', 'monitoring.log');
  }

  /**
   * 🚀 DÉMARRAGE DU DASHBOARD
   */
  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.clear();
    this.log('🚀 Démarrage du dashboard de monitoring...');

    // S'abonner aux événements de l'orchestrateur
    this.setupEventListeners();

    // Démarrer le monitoring en temps réel
    this.refreshInterval = setInterval(() => {
      this.updateDisplay();
    }, 1000); // Refresh toutes les secondes

    // Première affichage
    this.updateDisplay();

    // Monitoring des performances système
    this.startSystemMonitoring();

    this.log('✅ Dashboard de monitoring démarré');
  }

  /**
   * ⏹️ ARRÊT DU DASHBOARD
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Sauvegarder les métriques finales
    await this.saveMetrics();

    console.log(chalk.yellow('\n📊 Dashboard de monitoring arrêté'));
    this.log('⏹️ Dashboard de monitoring arrêté');
  }

  /**
   * 🎧 CONFIGURATION DES LISTENERS
   */
  setupEventListeners() {
    if (!this.orchestrator) return;

    // Événements des agents
    this.orchestrator.on('agentRegistered', (data) => {
      this.handleAgentRegistered(data);
    });

    this.orchestrator.on('taskStarted', (data) => {
      this.handleTaskStarted(data);
    });

    this.orchestrator.on('taskCompleted', (data) => {
      this.handleTaskCompleted(data);
    });

    this.orchestrator.on('taskFailed', (data) => {
      this.handleTaskFailed(data);
    });

    this.orchestrator.on('messageExchanged', (data) => {
      this.handleMessageExchanged(data);
    });

    this.orchestrator.on('context7Query', (data) => {
      this.handleContext7Query(data);
    });

    this.orchestrator.on('healthUpdate', (data) => {
      this.handleHealthUpdate(data);
    });

    this.orchestrator.on('performanceAlert', (data) => {
      this.handlePerformanceAlert(data);
    });
  }

  /**
   * 🔔 GESTION DES ÉVÉNEMENTS
   */
  handleAgentRegistered(data) {
    this.metrics.system.activeAgents++;
    this.metrics.agents.set(data.agentId, {
      id: data.agentId,
      name: data.name,
      specialization: data.specialization,
      status: 'idle',
      registeredAt: Date.now(),
      tasksCompleted: 0,
      tasksFailed: 0,
      avgTaskTime: 0,
      health: 'healthy',
      lastActivity: Date.now()
    });

    this.log(`🤖 Agent enregistré: ${data.agentId}`);
  }

  handleTaskStarted(data) {
    this.metrics.system.totalTasks++;
    
    const task = {
      id: data.task.id,
      agentId: data.agent,
      type: data.task.type,
      description: data.task.description,
      priority: data.task.priority,
      startTime: Date.now(),
      status: 'running'
    };
    
    this.metrics.tasks.set(data.task.id, task);

    // Mettre à jour l'agent
    const agent = this.metrics.agents.get(data.agent);
    if (agent) {
      agent.status = 'working';
      agent.lastActivity = Date.now();
    }

    this.log(`🚀 Tâche démarrée: ${data.task.id} par ${data.agent}`);
  }

  handleTaskCompleted(data) {
    this.metrics.system.completedTasks++;
    
    const task = this.metrics.tasks.get(data.task.id);
    if (task) {
      task.status = 'completed';
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      task.result = data.result;
    }

    // Mettre à jour l'agent
    const agent = this.metrics.agents.get(data.agent);
    if (agent) {
      agent.status = 'idle';
      agent.tasksCompleted++;
      agent.lastActivity = Date.now();
      
      // Calculer la moyenne mobile du temps d'exécution
      if (task && task.duration) {
        const totalTime = agent.avgTaskTime * (agent.tasksCompleted - 1) + task.duration;
        agent.avgTaskTime = Math.round(totalTime / agent.tasksCompleted);
      }
    }

    // Mettre à jour les métriques de performance
    this.updatePerformanceMetrics();

    this.log(`✅ Tâche complétée: ${data.task.id} (${data.executionTime}ms)`);
  }

  handleTaskFailed(data) {
    this.metrics.system.failedTasks++;
    
    const task = this.metrics.tasks.get(data.task.id);
    if (task) {
      task.status = 'failed';
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      task.error = data.error.message;
    }

    // Mettre à jour l'agent
    const agent = this.metrics.agents.get(data.agent);
    if (agent) {
      agent.status = 'error';
      agent.tasksFailed++;
      agent.lastActivity = Date.now();
    }

    // Créer une alerte
    this.createAlert('error', `Échec de tâche: ${data.task.id}`, {
      agent: data.agent,
      task: data.task.id,
      error: data.error.message
    });

    this.log(`❌ Tâche échouée: ${data.task.id} - ${data.error.message}`);
  }

  handleMessageExchanged(data) {
    this.metrics.system.messagesExchanged++;
    this.log(`📨 Message: ${data.from} → ${data.to} (${data.message.type})`);
  }

  handleContext7Query(data) {
    if (data.result) {
      this.metrics.performance.context7Hits++;
    } else {
      this.metrics.performance.context7Misses++;
    }
  }

  handleHealthUpdate(data) {
    const agent = this.metrics.agents.get(data.agentId);
    if (agent) {
      agent.health = data.health;
      agent.loadFactor = data.metrics?.loadFactor || 0;
      agent.errorRate = data.metrics?.errorRate || 0;
    }

    // Vérifier les règles d'alertes
    this.checkAlertRules(data);
  }

  handlePerformanceAlert(data) {
    this.createAlert('warning', data.message, data.details);
  }

  /**
   * 📊 MISE À JOUR DES MÉTRIQUES
   */
  updatePerformanceMetrics() {
    // Uptime
    this.metrics.system.uptime = Date.now() - this.metrics.system.startTime;

    // Temps moyen des tâches
    const completedTasks = Array.from(this.metrics.tasks.values())
      .filter(task => task.status === 'completed' && task.duration);
    
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => sum + task.duration, 0);
      this.metrics.performance.avgTaskTime = Math.round(totalTime / completedTasks.length);
    }

    // Charge système (basée sur les agents actifs)
    const workingAgents = Array.from(this.metrics.agents.values())
      .filter(agent => agent.status === 'working').length;
    
    this.metrics.performance.systemLoad = 
      this.metrics.system.activeAgents > 0 
        ? Math.round((workingAgents / this.metrics.system.activeAgents) * 100)
        : 0;

    // Utilisation mémoire (Node.js)
    const memUsage = process.memoryUsage();
    this.metrics.performance.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  }

  /**
   * 🖥️ AFFICHAGE DU DASHBOARD
   */
  updateDisplay() {
    if (!this.isRunning) return;

    console.clear();
    this.displayHeader();
    this.displaySystemMetrics();
    this.displayAgentsStatus();
    this.displayTasksOverview();
    this.displayPerformanceMetrics();
    this.displayAlerts();
    this.displayControls();
  }

  displayHeader() {
    const uptime = this.formatDuration(this.metrics.system.uptime);
    
    console.log(chalk.blue('═'.repeat(80)));
    console.log(chalk.blue.bold('📊 NUTRICOACH MULTI-AGENTS - MONITORING DASHBOARD'));
    console.log(chalk.blue(`⏱️  Uptime: ${uptime} | 🔄 Refresh: 1s | 📊 Agents: ${this.metrics.system.activeAgents}`));
    console.log(chalk.blue('═'.repeat(80)));
    console.log('');
  }

  displaySystemMetrics() {
    const { system } = this.metrics;
    const successRate = system.totalTasks > 0 
      ? Math.round((system.completedTasks / system.totalTasks) * 100)
      : 0;

    console.log(chalk.cyan('🔧 MÉTRIQUES SYSTÈME'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const metricsDisplay = [
      ['📋 Tâches totales', system.totalTasks],
      ['✅ Tâches complétées', system.completedTasks],
      ['❌ Tâches échouées', system.failedTasks],
      ['📈 Taux de succès', `${successRate}%`],
      ['📨 Messages échangés', system.messagesExchanged],
      ['🤖 Agents actifs', system.activeAgents]
    ];

    metricsDisplay.forEach(([label, value]) => {
      const color = this.getMetricColor(label, value);
      console.log(`  ${label}: ${color(value)}`);
    });
    
    console.log('');
  }

  displayAgentsStatus() {
    console.log(chalk.cyan('🤖 STATUT DES AGENTS'));
    console.log(chalk.gray('─'.repeat(40)));

    if (this.metrics.agents.size === 0) {
      console.log(chalk.gray('  Aucun agent enregistré'));
      console.log('');
      return;
    }

    const headers = ['Agent', 'Statut', 'Santé', 'Tâches', 'Temps moy.', 'Dernière activité'];
    console.log(chalk.gray(`  ${headers.join(' | ')}`));
    console.log(chalk.gray(`  ${headers.map(h => '─'.repeat(h.length)).join('─┼─')}`));

    Array.from(this.metrics.agents.values()).forEach(agent => {
      const status = this.getStatusIcon(agent.status);
      const health = this.getHealthIcon(agent.health);
      const tasks = `${agent.tasksCompleted}/${agent.tasksFailed}`;
      const avgTime = this.formatDuration(agent.avgTaskTime);
      const lastActivity = this.formatRelativeTime(agent.lastActivity);

      console.log(`  ${agent.id.padEnd(8)} | ${status.padEnd(8)} | ${health.padEnd(8)} | ${tasks.padEnd(8)} | ${avgTime.padEnd(10)} | ${lastActivity}`);
    });

    console.log('');
  }

  displayTasksOverview() {
    const runningTasks = Array.from(this.metrics.tasks.values())
      .filter(task => task.status === 'running');

    console.log(chalk.cyan('📋 TÂCHES EN COURS'));
    console.log(chalk.gray('─'.repeat(40)));

    if (runningTasks.length === 0) {
      console.log(chalk.gray('  Aucune tâche en cours'));
    } else {
      runningTasks.slice(0, 5).forEach(task => {
        const duration = this.formatDuration(Date.now() - task.startTime);
        const priority = this.getPriorityIcon(task.priority);
        
        console.log(`  ${priority} ${task.id} (${task.agentId})`);
        console.log(`    ${chalk.gray(task.description)} - ${duration}`);
      });

      if (runningTasks.length > 5) {
        console.log(chalk.gray(`    ... et ${runningTasks.length - 5} autres`));
      }
    }

    console.log('');
  }

  displayPerformanceMetrics() {
    const { performance } = this.metrics;
    
    console.log(chalk.cyan('⚡ PERFORMANCE'));
    console.log(chalk.gray('─'.repeat(40)));

    const performanceDisplay = [
      ['⏱️ Temps moyen/tâche', this.formatDuration(performance.avgTaskTime)],
      ['📊 Charge système', `${performance.systemLoad}%`],
      ['💾 Mémoire utilisée', `${performance.memoryUsage} MB`],
      ['🎯 Context7 hits', performance.context7Hits],
      ['❌ Context7 misses', performance.context7Misses]
    ];

    performanceDisplay.forEach(([label, value]) => {
      const color = this.getPerformanceColor(label, value);
      console.log(`  ${label}: ${color(value)}`);
    });

    console.log('');
  }

  displayAlerts() {
    const recentAlerts = this.metrics.alerts
      .slice(-5)
      .reverse();

    console.log(chalk.cyan('🚨 ALERTES RÉCENTES'));
    console.log(chalk.gray('─'.repeat(40)));

    if (recentAlerts.length === 0) {
      console.log(chalk.green('  ✅ Aucune alerte'));
    } else {
      recentAlerts.forEach(alert => {
        const icon = this.getAlertIcon(alert.level);
        const time = this.formatRelativeTime(alert.timestamp);
        
        console.log(`  ${icon} ${alert.message} (${time})`);
        if (alert.details && Object.keys(alert.details).length > 0) {
          console.log(chalk.gray(`    ${JSON.stringify(alert.details)}`));
        }
      });
    }

    console.log('');
  }

  displayControls() {
    console.log(chalk.cyan('🎮 CONTRÔLES'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log('  Ctrl+C : Arrêter le monitoring');
    console.log('  Space  : Forcer le rafraîchissement');
    console.log('  h      : Afficher l\'aide');
    console.log('');
  }

  /**
   * 🚨 SYSTÈME D'ALERTES
   */
  setupDefaultAlerts() {
    // Alerte de charge système élevée
    this.alertRules.set('high-system-load', {
      condition: (metrics) => metrics.performance.systemLoad > 80,
      level: 'warning',
      message: 'Charge système élevée',
      cooldown: 60000 // 1 minute
    });

    // Alerte d'agent en erreur prolongée
    this.alertRules.set('agent-error-state', {
      condition: (metrics) => {
        return Array.from(metrics.agents.values()).some(agent => 
          agent.status === 'error' && 
          Date.now() - agent.lastActivity > 300000 // 5 minutes
        );
      },
      level: 'error',
      message: 'Agent en erreur prolongée',
      cooldown: 300000 // 5 minutes
    });

    // Alerte de taux d'échec élevé
    this.alertRules.set('high-failure-rate', {
      condition: (metrics) => {
        const total = metrics.system.totalTasks;
        const failed = metrics.system.failedTasks;
        return total > 10 && (failed / total) > 0.2; // 20% d'échec
      },
      level: 'warning',
      message: 'Taux d\'échec élevé détecté',
      cooldown: 180000 // 3 minutes
    });

    // Alerte de mémoire élevée
    this.alertRules.set('high-memory-usage', {
      condition: (metrics) => metrics.performance.memoryUsage > 512, // 512 MB
      level: 'warning',
      message: 'Utilisation mémoire élevée',
      cooldown: 120000 // 2 minutes
    });
  }

  checkAlertRules(data) {
    this.alertRules.forEach((rule, ruleId) => {
      try {
        if (rule.condition(this.metrics)) {
          // Vérifier le cooldown
          const lastAlert = this.metrics.alerts
            .reverse()
            .find(alert => alert.ruleId === ruleId);

          if (!lastAlert || Date.now() - lastAlert.timestamp > rule.cooldown) {
            this.createAlert(rule.level, rule.message, { ruleId, trigger: data });
          }
        }
      } catch (error) {
        console.error(`Erreur règle d'alerte ${ruleId}:`, error.message);
      }
    });
  }

  createAlert(level, message, details = {}) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level, // info, warning, error, critical
      message,
      details,
      timestamp: Date.now(),
      ruleId: details.ruleId
    };

    this.metrics.alerts.push(alert);

    // Garder seulement les 100 dernières alertes
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }

    this.log(`🚨 Alerte ${level}: ${message}`);
    this.emit('alert', alert);
  }

  /**
   * 💾 MONITORING SYSTÈME
   */
  startSystemMonitoring() {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.checkAlertRules({});
    }, 5000); // Toutes les 5 secondes
  }

  /**
   * 🎨 UTILITAIRES D'AFFICHAGE
   */
  getStatusIcon(status) {
    const icons = {
      'idle': chalk.gray('⚫ Inactif'),
      'working': chalk.yellow('🟡 Actif'),
      'error': chalk.red('🔴 Erreur'),
      'completed': chalk.green('🟢 Fini')
    };
    return icons[status] || chalk.gray('❓ Inconnu');
  }

  getHealthIcon(health) {
    const icons = {
      'healthy': chalk.green('💚 Sain'),
      'degraded': chalk.yellow('💛 Dégradé'),
      'stressed': chalk.orange('🧡 Stressé'),
      'error': chalk.red('❤️ Erreur')
    };
    return icons[health] || chalk.gray('💜 Inconnu');
  }

  getPriorityIcon(priority) {
    const icons = {
      'low': chalk.gray('🔹'),
      'medium': chalk.yellow('🔸'),
      'high': chalk.orange('🟠'),
      'critical': chalk.red('🔴')
    };
    return icons[priority] || chalk.gray('⚫');
  }

  getAlertIcon(level) {
    const icons = {
      'info': chalk.blue('ℹ️'),
      'warning': chalk.yellow('⚠️'),
      'error': chalk.red('❌'),
      'critical': chalk.red('🚨')
    };
    return icons[level] || chalk.gray('📢');
  }

  getMetricColor(label, value) {
    if (label.includes('échec') && value > 0) return chalk.red;
    if (label.includes('succès') && value >= 95) return chalk.green;
    if (label.includes('succès') && value >= 80) return chalk.yellow;
    if (label.includes('succès') && value < 80) return chalk.red;
    return chalk.white;
  }

  getPerformanceColor(label, value) {
    if (label.includes('Charge') && parseInt(value) > 80) return chalk.red;
    if (label.includes('Charge') && parseInt(value) > 60) return chalk.yellow;
    if (label.includes('Mémoire') && parseInt(value) > 512) return chalk.red;
    if (label.includes('Mémoire') && parseInt(value) > 256) return chalk.yellow;
    return chalk.white;
  }

  /**
   * 🔧 UTILITAIRES
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }

  formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'maintenant';
    if (diff < 3600000) return `${Math.round(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h`;
    return `${Math.round(diff / 86400000)}j`;
  }

  /**
   * 💾 SAUVEGARDE ET LOGGING
   */
  async saveMetrics() {
    try {
      const metricsSnapshot = {
        timestamp: Date.now(),
        system: this.metrics.system,
        agents: Array.from(this.metrics.agents.values()),
        tasks: Array.from(this.metrics.tasks.values()),
        performance: this.metrics.performance,
        alerts: this.metrics.alerts.slice(-50) // Dernières 50 alertes
      };

      const logsDir = path.dirname(this.logFile);
      await fs.mkdir(logsDir, { recursive: true });

      const snapshotFile = path.join(logsDir, `metrics-snapshot-${Date.now()}.json`);
      await fs.writeFile(snapshotFile, JSON.stringify(metricsSnapshot, null, 2));

      this.log(`💾 Métriques sauvegardées: ${snapshotFile}`);
    } catch (error) {
      console.error('Erreur sauvegarde métriques:', error.message);
    }
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    try {
      const logsDir = path.dirname(this.logFile);
      await fs.mkdir(logsDir, { recursive: true });
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      // Silently fail to avoid flooding console
    }
  }

  /**
   * 📊 API POUR LES MÉTRIQUES
   */
  getMetricsSnapshot() {
    return {
      timestamp: Date.now(),
      system: { ...this.metrics.system },
      agents: Array.from(this.metrics.agents.values()),
      tasks: Array.from(this.metrics.tasks.values()),
      performance: { ...this.metrics.performance },
      alerts: [...this.metrics.alerts]
    };
  }

  getAgentMetrics(agentId) {
    return this.metrics.agents.get(agentId) || null;
  }

  getTaskMetrics(taskId) {
    return this.metrics.tasks.get(taskId) || null;
  }

  getAlerts(level = null, limit = 10) {
    let alerts = [...this.metrics.alerts].reverse();
    
    if (level) {
      alerts = alerts.filter(alert => alert.level === level);
    }

    return alerts.slice(0, limit);
  }
}

export default MonitoringDashboard;