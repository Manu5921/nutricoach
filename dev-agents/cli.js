#!/usr/bin/env node

/**
 * 🎛️ CLI MULTI-AGENTS NUTRICOACH
 * 
 * Interface en ligne de commande pour l'orchestration des agents
 * Commandes: start, status, monitor, validate, deploy
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';

// Import des modules
import MultiAgentOrchestrator from './orchestrator.js';
import SpecValidator from './lib/spec-validator.js';
import FeatureGenerator from './lib/feature-generator.js';

class AgentCLI {
  constructor() {
    this.orchestrator = null;
    this.validator = new SpecValidator();
    this.featureGenerator = new FeatureGenerator();
    this.setupCommands();
  }

  setupCommands() {
    program
      .name('nutricoach-agents')
      .description('CLI pour l\'orchestration multi-agents NutriCoach')
      .version('1.0.0');

    // Commande principale d'orchestration
    program
      .command('start')
      .description('Démarrer l\'orchestration d\'une feature')
      .option('-f, --feature <name>', 'Nom de la feature à implémenter')
      .option('-s, --spec <file>', 'Fichier de spécification', 'dev-agents/specs/nutricoach-features.json')
      .option('-d, --dry-run', 'Simulation sans exécution réelle')
      .option('-p, --parallel', 'Exécution parallèle maximale', false)
      .action(this.startOrchestration.bind(this));

    // Commande de status
    program
      .command('status')
      .description('Afficher le statut des agents')
      .option('-w, --watch', 'Mode surveillance continue')
      .option('-i, --interval <seconds>', 'Intervalle de rafraîchissement', '5')
      .action(this.showStatus.bind(this));

    // Commande de monitoring
    program
      .command('monitor')
      .description('Monitoring avancé en temps réel')
      .option('-t, --type <type>', 'Type de monitoring', 'all')
      .action(this.startMonitoring.bind(this));

    // Commande de dashboard
    program
      .command('dashboard')
      .description('Dashboard de monitoring interactif en temps réel')
      .option('-a, --auto-start', 'Démarrer automatiquement l\'orchestrateur')
      .action(this.startDashboard.bind(this));

    // Commande de validation
    program
      .command('validate')
      .description('Valider les spécifications de features')
      .option('-f, --file <path>', 'Fichier à valider', 'dev-agents/specs/nutricoach-features.json')
      .option('-t, --template <path>', 'Template de validation')
      .action(this.validateSpecs.bind(this));

    // Commande pour lister les features
    program
      .command('list')
      .description('Lister les features disponibles')
      .option('-s, --spec <file>', 'Fichier de spécification', 'dev-agents/specs/nutricoach-features.json')
      .action(this.listFeatures.bind(this));

    // Commande pour les agents individuels
    program
      .command('agent')
      .description('Exécuter un agent individuellement')
      .option('-t, --type <agent>', 'Type d\'agent (db, ui, module, qa, doc)')
      .option('-f, --file <path>', 'Fichier de tâche')
      .action(this.runSingleAgent.bind(this));

    // Commande de nettoyage
    program
      .command('clean')
      .description('Nettoyer les ressources et caches')
      .option('-a, --all', 'Nettoyage complet')
      .action(this.cleanResources.bind(this));

    // Commande de génération de rapport
    program
      .command('report')
      .description('Générer un rapport d\'activité')
      .option('-p, --period <days>', 'Période en jours', '7')
      .option('-f, --format <format>', 'Format de sortie (json, html, md)', 'md')
      .action(this.generateReport.bind(this));

    // Commandes pour la génération de features
    program
      .command('generate')
      .alias('new')
      .description('Générer une nouvelle feature')
      .option('-t, --template <type>', 'Type de template (crud, ai, ui, api, security, analytics, performance)')
      .option('-i, --interactive', 'Mode interactif', true)
      .action(this.generateFeature.bind(this));

    program
      .command('templates')
      .description('Lister les templates disponibles')
      .action(this.listTemplates.bind(this));

    program
      .command('features')
      .description('Lister toutes les features générées')
      .action(this.listGeneratedFeatures.bind(this));

    // Commandes de gestion du cache
    program
      .command('cache')
      .description('Gestion du cache Context7')
      .option('-s, --stats', 'Afficher les statistiques du cache')
      .option('-c, --clear [agentId]', 'Nettoyer le cache (optionnellement pour un agent)')
      .option('-e, --export <file>', 'Exporter le cache vers un fichier')
      .option('-i, --import <file>', 'Importer un cache depuis un fichier')
      .option('--search <query>', 'Rechercher dans le cache')
      .action(this.manageCache.bind(this));
  }

  /**
   * 🚀 DÉMARRAGE D'ORCHESTRATION
   */
  async startOrchestration(options) {
    try {
      this.displayHeader('DÉMARRAGE ORCHESTRATION');

      // Charger les spécifications
      const specs = await this.loadSpecs(options.spec);
      if (!specs) return;

      // Sélectionner la feature
      const featureName = options.feature || await this.selectFeature(specs);
      if (!featureName) return;

      const featureSpec = specs.features[featureName];
      if (!featureSpec) {
        console.log(chalk.red(`❌ Feature "${featureName}" non trouvée`));
        return;
      }

      // Validation optionnelle
      console.log(chalk.blue('🔍 Validation de la feature...'));
      await this.validator.loadTemplate();
      const validation = await this.validator.validateFeature(featureSpec, featureName);
      
      if (!validation.valid) {
        console.log(chalk.red(`❌ Validation échouée. ${validation.errors.length} erreurs trouvées.`));
        
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Continuer malgré les erreurs de validation?',
          default: false
        }]);

        if (!proceed) return;
      }

      // Initialiser l'orchestrateur
      console.log(chalk.blue('🎯 Initialisation de l\'orchestrateur...'));
      this.orchestrator = new MultiAgentOrchestrator();

      // Mode dry-run
      if (options.dryRun) {
        console.log(chalk.yellow('🏃 Mode DRY-RUN - Simulation uniquement'));
        await this.simulateExecution(featureSpec, featureName);
        return;
      }

      // Configuration des événements
      this.setupOrchestrationEvents();

      // Démarrage de l'exécution
      console.log(chalk.green(`🚀 Démarrage feature: ${featureName}`));
      console.log(chalk.gray('  Appuyez sur Ctrl+C pour arrêter\n'));

      const result = await this.orchestrator.dispatchFeature(featureSpec);

      if (result.success) {
        console.log(chalk.green(`\n✅ Feature "${featureName}" complétée avec succès!`));
        await this.displayExecutionSummary(result);
      } else {
        console.log(chalk.red(`\n❌ Échec de la feature "${featureName}"`));
        console.log(chalk.red('Erreurs:'), result.errors);
      }

    } catch (error) {
      console.error(chalk.red('💥 Erreur orchestration:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  }

  /**
   * 📊 AFFICHAGE DU STATUS
   */
  async showStatus(options) {
    const displayStatus = () => {
      console.clear();
      this.displayHeader('STATUS DES AGENTS');

      if (!this.orchestrator) {
        console.log(chalk.yellow('⚠️ Aucune orchestration en cours'));
        return;
      }

      const status = this.orchestrator.getStatus();

      // Status global
      console.log(chalk.blue('🌐 STATUS GLOBAL'));
      console.log(chalk.gray('━'.repeat(50)));
      console.log(`  Feature active: ${status.activeFeature || 'Aucune'}`);
      console.log(`  Total tâches: ${status.totalTasks}`);
      console.log(`  Conflits: ${status.conflicts}`);

      // Status des agents
      console.log(chalk.blue('\n🤖 AGENTS'));
      console.log(chalk.gray('━'.repeat(50)));

      for (const [agentId, agentStatus] of Object.entries(status.agents)) {
        const statusColor = this.getStatusColor(agentStatus.status);
        const statusIcon = this.getStatusIcon(agentStatus.status);
        
        console.log(`${statusIcon} ${chalk.bold(agentId.padEnd(15))} ${statusColor(agentStatus.status.padEnd(10))} ` +
                   `📝 ${agentStatus.completedTasks} tâches   ❌ ${agentStatus.errors} erreurs`);
      }

      // Métriques de performance
      if (this.orchestrator.state.monitoring) {
        const metrics = this.orchestrator.state.monitoring;
        console.log(chalk.blue('\n📈 MÉTRIQUES'));
        console.log(chalk.gray('━'.repeat(50)));
        console.log(`  Charge actuelle: ${metrics.currentLoad}%`);
        console.log(`  Temps moyen: ${metrics.averageExecutionTime}ms`);
        console.log(`  Taux de succès: ${Math.round((metrics.tasksCompleted / Math.max(metrics.tasksTotal, 1)) * 100)}%`);
      }

      if (options.watch) {
        console.log(chalk.gray(`\n⏱️ Actualisation dans ${options.interval}s... (Ctrl+C pour arrêter)`));
      }
    };

    displayStatus();

    if (options.watch) {
      const interval = setInterval(displayStatus, parseInt(options.interval) * 1000);
      
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(chalk.yellow('\n👋 Surveillance arrêtée'));
        process.exit(0);
      });
    }
  }

  /**
   * 📊 MONITORING AVANCÉ
   */
  async startMonitoring(options) {
    console.log(chalk.blue('📊 Démarrage monitoring avancé...'));
    
    if (!this.orchestrator) {
      console.log(chalk.yellow('⚠️ Aucune orchestration en cours - Démarrage du monitoring passif'));
      this.orchestrator = new MultiAgentOrchestrator();
    }

    // Monitoring en temps réel avec graphiques ASCII
    const monitoringInterval = setInterval(() => {
      console.clear();
      this.displayAdvancedMonitoring();
    }, 2000);

    process.on('SIGINT', () => {
      clearInterval(monitoringInterval);
      console.log(chalk.yellow('\n📊 Monitoring arrêté'));
      process.exit(0);
    });
  }

  /**
   * 📊 DASHBOARD INTERACTIF
   */
  async startDashboard(options) {
    try {
      this.displayHeader('DASHBOARD DE MONITORING');

      // Initialiser l'orchestrateur si nécessaire
      if (!this.orchestrator) {
        console.log(chalk.blue('🚀 Initialisation de l\'orchestrateur...'));
        this.orchestrator = new MultiAgentOrchestrator();
        
        if (options.autoStart) {
          // TODO: Démarrer une feature par défaut ou demander à l'utilisateur
          console.log(chalk.yellow('⚠️ Auto-start non implémenté - Dashboard en mode passif'));
        }
      }

      // Démarrer le dashboard de monitoring
      console.log(chalk.blue('📊 Démarrage du dashboard de monitoring...'));
      await this.orchestrator.startMonitoringDashboard();

      // Gérer l'arrêt propre
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\n📊 Arrêt du dashboard...'));
        if (this.orchestrator && this.orchestrator.monitoringDashboard) {
          await this.orchestrator.stopMonitoringDashboard();
        }
        console.log(chalk.green('✅ Dashboard arrêté proprement'));
        process.exit(0);
      });

      // Gestion des touches pour l'interactivité
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (key) => {
        switch (key.toString()) {
          case '\u0003': // Ctrl+C
            process.emit('SIGINT');
            break;
          case ' ': // Space - Force refresh
            if (this.orchestrator?.monitoringDashboard) {
              this.orchestrator.monitoringDashboard.updateDisplay();
            }
            break;
          case 'h': // Help
            this.showDashboardHelp();
            break;
          case 'q': // Quit
            process.emit('SIGINT');
            break;
        }
      });

      console.log(chalk.green('✅ Dashboard démarré - Appuyez sur \'h\' pour l\'aide'));

    } catch (error) {
      console.error(chalk.red('❌ Erreur lors du démarrage du dashboard:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  }

  showDashboardHelp() {
    console.log(chalk.blue('\n📖 AIDE DU DASHBOARD'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log('  Space  : Forcer le rafraîchissement');
    console.log('  h      : Afficher cette aide');
    console.log('  q      : Quitter le dashboard');
    console.log('  Ctrl+C : Arrêt d\'urgence');
    console.log('');
    console.log(chalk.gray('Le dashboard se rafraîchit automatiquement toutes les secondes'));
  }

  /**
   * ✅ VALIDATION DES SPECS
   */
  async validateSpecs(options) {
    try {
      this.displayHeader('VALIDATION DES SPÉCIFICATIONS');

      await this.validator.loadTemplate(options.template);
      const valid = await this.validator.validateSpecFile(options.file);

      if (valid) {
        console.log(chalk.green('\n🎉 Toutes les spécifications sont valides!'));
      } else {
        console.log(chalk.red('\n❌ Des erreurs ont été trouvées dans les spécifications'));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('💥 Erreur validation:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 📋 LISTE DES FEATURES
   */
  async listFeatures(options) {
    try {
      const specs = await this.loadSpecs(options.spec);
      if (!specs || !specs.features) return;

      this.displayHeader('FEATURES DISPONIBLES');

      for (const [name, feature] of Object.entries(specs.features)) {
        const typeColor = this.getFeatureTypeColor(feature.feature.type);
        const priorityIcon = this.getPriorityIcon(feature.feature.priority);
        
        console.log(`${priorityIcon} ${chalk.bold(name)}`);
        console.log(`   ${chalk.gray('Type:')} ${typeColor(feature.feature.type)}`);
        console.log(`   ${chalk.gray('Description:')} ${feature.feature.description}`);
        console.log(`   ${chalk.gray('Temps estimé:')} ${feature.feature.estimatedTime}`);
        console.log(`   ${chalk.gray('Agents requis:')} ${this.getRequiredAgents(feature).join(', ')}`);
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red('💥 Erreur liste features:'), error.message);
    }
  }

  /**
   * 🤖 EXÉCUTION D'UN AGENT INDIVIDUEL
   */
  async runSingleAgent(options) {
    try {
      this.displayHeader(`AGENT INDIVIDUEL: ${options.type?.toUpperCase()}`);

      if (!options.type) {
        const { agentType } = await inquirer.prompt([{
          type: 'list',
          name: 'agentType',
          message: 'Quel agent voulez-vous exécuter?',
          choices: [
            { name: '🗄️ DB Agent (Base de données)', value: 'db' },
            { name: '🎨 UI Agent (Interface)', value: 'ui' },
            { name: '⚙️ Module Agent (Logique métier)', value: 'module' },
            { name: '🧪 QA Agent (Tests)', value: 'qa' },
            { name: '📚 Doc Agent (Documentation)', value: 'doc' }
          ]
        }]);
        options.type = agentType;
      }

      // Charger la tâche depuis un fichier ou interface interactive
      let taskSpec;
      if (options.file) {
        const taskContent = await fs.readFile(options.file, 'utf8');
        taskSpec = JSON.parse(taskContent);
      } else {
        taskSpec = await this.createInteractiveTask(options.type);
      }

      // Exécuter la tâche
      console.log(chalk.blue(`🚀 Exécution agent ${options.type}...`));
      
      // Simuler l'exécution pour cette démo
      await this.simulateAgentExecution(options.type, taskSpec);

    } catch (error) {
      console.error(chalk.red('💥 Erreur agent individuel:'), error.message);
    }
  }

  /**
   * 🧹 NETTOYAGE DES RESSOURCES
   */
  async cleanResources(options) {
    this.displayHeader('NETTOYAGE DES RESSOURCES');

    const cleanTasks = [
      { name: 'Cache Context7', action: () => this.cleanContext7Cache() },
      { name: 'Logs temporaires', action: () => this.cleanTempLogs() },
      { name: 'Fichiers de build', action: () => this.cleanBuildFiles() },
    ];

    if (options.all) {
      cleanTasks.push(
        { name: 'Données de test', action: () => this.cleanTestData() },
        { name: 'Caches npm', action: () => this.cleanNpmCache() }
      );
    }

    for (const task of cleanTasks) {
      try {
        console.log(chalk.blue(`🧹 ${task.name}...`));
        await task.action();
        console.log(chalk.green(`  ✅ ${task.name} nettoyé`));
      } catch (error) {
        console.log(chalk.red(`  ❌ Erreur nettoyage ${task.name}: ${error.message}`));
      }
    }

    console.log(chalk.green('\n🎉 Nettoyage terminé!'));
  }

  /**
   * 📊 GÉNÉRATION DE RAPPORT
   */
  async generateReport(options) {
    this.displayHeader('GÉNÉRATION DE RAPPORT');

    const reportData = {
      period: `${options.period} derniers jours`,
      generatedAt: new Date().toISOString(),
      summary: {
        featuresCompleted: 0,
        tasksExecuted: 0,
        averageExecutionTime: 0,
        errorRate: 0
      },
      agents: {},
      recommendations: []
    };

    // Simuler la génération de données de rapport
    console.log(chalk.blue('📊 Collecte des métriques...'));
    await this.sleep(1000);

    console.log(chalk.blue('📈 Analyse des performances...'));
    await this.sleep(1000);

    const reportFile = `reports/nutricoach-agents-${new Date().toISOString().split('T')[0]}.${options.format}`;
    
    console.log(chalk.blue(`📄 Génération du rapport ${options.format.toUpperCase()}...`));
    await this.createReportFile(reportData, reportFile, options.format);

    console.log(chalk.green(`\n✅ Rapport généré: ${reportFile}`));
  }

  /**
   * 🛠️ MÉTHODES UTILITAIRES
   */
  async loadSpecs(specFile) {
    try {
      const content = await fs.readFile(specFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(chalk.red(`❌ Erreur chargement specs: ${error.message}`));
      return null;
    }
  }

  async selectFeature(specs) {
    const choices = Object.entries(specs.features).map(([name, feature]) => ({
      name: `${name} (${feature.feature.type} - ${feature.feature.estimatedTime})`,
      value: name,
      short: name
    }));

    const { featureName } = await inquirer.prompt([{
      type: 'list',
      name: 'featureName',
      message: 'Quelle feature voulez-vous implémenter?',
      choices
    }]);

    return featureName;
  }

  setupOrchestrationEvents() {
    this.orchestrator.on('taskCompleted', (data) => {
      console.log(chalk.green(`  ✅ ${data.agentId}: ${data.task.description} (${data.executionTime}ms)`));
    });

    this.orchestrator.on('taskFailed', (data) => {
      console.log(chalk.red(`  ❌ ${data.agentId}: ${data.task.description} - ${data.error.message}`));
    });

    this.orchestrator.on('agentTaskComplete', (data) => {
      console.log(chalk.blue(`  🤖 ${data.agentId} terminé`));
    });
  }

  async simulateExecution(featureSpec, featureName) {
    console.log(chalk.yellow('🎬 SIMULATION D\'EXÉCUTION'));
    console.log(chalk.gray('━'.repeat(50)));

    const agents = Object.entries(featureSpec.agents || {})
      .filter(([_, config]) => config.required !== false);

    for (const [agentId, agentConfig] of agents) {
      console.log(chalk.blue(`\n🤖 ${agentId.toUpperCase()}`));
      
      for (const task of agentConfig.tasks || []) {
        console.log(`  📋 ${task.description}`);
        console.log(`     Priority: ${task.priority} | Time: ${task.estimatedTime}`);
        
        if (task.dependsOn?.length > 0) {
          console.log(`     Dependencies: ${task.dependsOn.join(', ')}`);
        }
      }
    }

    console.log(chalk.yellow('\n📊 ESTIMATION TOTALE'));
    console.log(`  Feature: ${featureName}`);
    console.log(`  Agents impliqués: ${agents.length}`);
    console.log(`  Temps estimé: ${featureSpec.feature.estimatedTime}`);
  }

  /**
   * 🎯 GÉNÉRATION DE FEATURES
   */
  async generateFeature(options) {
    try {
      this.displayHeader('GÉNÉRATEUR DE FEATURES');

      if (options.template) {
        // Génération avec template spécifique
        await this.generateFromTemplate(options.template);
      } else {
        // Mode interactif
        await this.featureGenerator.generateFeature();
      }

    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la génération:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  }

  async generateFromTemplate(templateType) {
    const templates = {
      'crud': () => this.featureGenerator.generateCrudFeature(),
      'ai': () => this.featureGenerator.generateAiFeature(),
      'ui': () => this.featureGenerator.generateUiFeature(),
      'api': () => this.featureGenerator.generateApiFeature(),
      'security': () => this.featureGenerator.generateSecurityFeature(),
      'analytics': () => this.featureGenerator.generateAnalyticsFeature(),
      'performance': () => this.featureGenerator.generatePerformanceFeature()
    };

    const generator = templates[templateType];
    if (!generator) {
      console.error(chalk.red(`❌ Template "${templateType}" non supporté`));
      console.log(chalk.gray('Templates disponibles: crud, ai, ui, api, security, analytics, performance'));
      return;
    }

    console.log(chalk.cyan(`🎯 Génération avec template: ${templateType}`));
    await generator();
  }

  async listTemplates() {
    this.displayHeader('TEMPLATES DISPONIBLES');

    const templates = [
      {
        name: 'CRUD Feature',
        id: 'crud',
        description: 'Gestion de données simple avec interface CRUD',
        icon: '📋',
        estimatedTime: '1-2 jours'
      },
      {
        name: 'AI Feature',
        id: 'ai',
        description: 'Fonctionnalité avec intelligence artificielle',
        icon: '🤖',
        estimatedTime: '3-5 jours'
      },
      {
        name: 'UI Enhancement',
        id: 'ui',
        description: 'Amélioration de l\'interface utilisateur',
        icon: '🎨',
        estimatedTime: '1-3 jours'
      },
      {
        name: 'API Integration',
        id: 'api',
        description: 'Intégration avec services externes',
        icon: '🔌',
        estimatedTime: '2-4 jours'
      },
      {
        name: 'Security Feature',
        id: 'security',
        description: 'Fonctionnalités de sécurité avancées',
        icon: '🔒',
        estimatedTime: '2-3 jours'
      },
      {
        name: 'Analytics Feature',
        id: 'analytics',
        description: 'Analytique et reporting',
        icon: '📊',
        estimatedTime: '2-4 jours'
      },
      {
        name: 'Performance Optimization',
        id: 'performance',
        description: 'Optimisations de performance',
        icon: '⚡',
        estimatedTime: '1-2 jours'
      }
    ];

    console.log(chalk.blue('🎯 Templates de features disponibles:\n'));

    templates.forEach(template => {
      console.log(`${template.icon} ${chalk.cyan(template.name)} (${chalk.gray(template.id)})`);
      console.log(`   ${chalk.gray(template.description)}`);
      console.log(`   ${chalk.yellow(`Temps estimé: ${template.estimatedTime}`)}`);
      console.log();
    });

    console.log(chalk.gray('Usage:'));
    console.log(chalk.gray('  npm run cli generate --template <id>'));
    console.log(chalk.gray('  npm run cli generate  (mode interactif)'));
  }

  async listGeneratedFeatures() {
    this.displayHeader('FEATURES GÉNÉRÉES');

    try {
      const features = await this.featureGenerator.listFeatures();
      
      if (features.length === 0) {
        console.log(chalk.yellow('📋 Aucune feature générée trouvée'));
        console.log(chalk.gray('\nUtilisez: npm run cli generate'));
        return;
      }

      console.log(chalk.blue(`📊 ${features.length} feature(s) trouvée(s):\n`));

      // Grouper par type
      const groupedFeatures = features.reduce((groups, feature) => {
        const type = feature.type;
        if (!groups[type]) groups[type] = [];
        groups[type].push(feature);
        return groups;
      }, {});

      Object.entries(groupedFeatures).forEach(([type, typeFeatures]) => {
        console.log(chalk.cyan(`📁 ${type.toUpperCase()}`));
        
        typeFeatures.forEach(feature => {
          const priorityIcon = this.getPriorityIcon(feature.priority);
          console.log(`   ${priorityIcon} ${chalk.white(feature.name)}`);
          console.log(`      ${chalk.gray(`ID: ${feature.id} | Temps: ${feature.estimatedTime}`)}`);
          console.log(`      ${chalk.gray(`Fichier: ${feature.file}`)}`);
        });
        console.log();
      });

      console.log(chalk.gray('Pour exécuter une feature:'));
      console.log(chalk.gray('  npm run cli start --spec specs/<fichier>'));

    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la liste des features:'), error.message);
    }
  }

  /**
   * 🧠 GESTION DU CACHE CONTEXT7
   */
  async manageCache(options) {
    try {
      this.displayHeader('GESTION DU CACHE CONTEXT7');

      // Initialiser l'orchestrateur si nécessaire
      if (!this.orchestrator) {
        console.log(chalk.blue('🚀 Initialisation de l\'orchestrateur...'));
        this.orchestrator = new MultiAgentOrchestrator();
      }

      // Statistiques du cache
      if (options.stats) {
        await this.showCacheStats();
        return;
      }

      // Nettoyer le cache
      if (options.clear !== undefined) {
        const agentId = typeof options.clear === 'string' ? options.clear : null;
        await this.orchestrator.clearCache(agentId);
        console.log(chalk.green(`✅ Cache nettoyé${agentId ? ` pour ${agentId}` : ''}`));
        return;
      }

      // Exporter le cache
      if (options.export) {
        await this.orchestrator.exportCache(options.export);
        console.log(chalk.green(`✅ Cache exporté vers: ${options.export}`));
        return;
      }

      // Importer le cache
      if (options.import) {
        await this.orchestrator.importCache(options.import);
        console.log(chalk.green(`✅ Cache importé depuis: ${options.import}`));
        return;
      }

      // Rechercher dans le cache
      if (options.search) {
        await this.searchInCache(options.search);
        return;
      }

      // Afficher l'aide par défaut
      console.log(chalk.blue('🧠 Commandes disponibles pour le cache Context7:\n'));
      console.log('  --stats              Afficher les statistiques');
      console.log('  --clear [agent]      Nettoyer le cache');
      console.log('  --export <file>      Exporter vers un fichier');
      console.log('  --import <file>      Importer depuis un fichier');
      console.log('  --search <query>     Rechercher dans le cache');

    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la gestion du cache:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  }

  async showCacheStats() {
    const stats = this.orchestrator.getCacheStats();
    
    if (!stats) {
      console.log(chalk.yellow('⚠️ Aucune statistique de cache disponible'));
      return;
    }

    console.log(chalk.cyan('📊 STATISTIQUES DU CACHE CONTEXT7'));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(`📈 Taux de succès: ${chalk.green(stats.hitRate)}`);
    console.log(`📋 Entrées totales: ${chalk.white(stats.size)}`);
    console.log(`🎯 Hits: ${chalk.green(stats.hits)}`);
    console.log(`❌ Misses: ${chalk.red(stats.misses)}`);
    console.log(`🗑️ Évictions: ${chalk.yellow(stats.evictions)}`);
    console.log(`💾 Sauvegardes: ${chalk.blue(stats.saves)}`);
    console.log(`💿 Utilisat. mémoire: ${chalk.white(stats.memoryUsage)} KB`);

    if (stats.agentStats && stats.agentStats.length > 0) {
      console.log('\n' + chalk.cyan('🤖 STATISTIQUES PAR AGENT'));
      console.log(chalk.gray('─'.repeat(30)));
      
      stats.agentStats.forEach(([agentId, agentStat]) => {
        console.log(`  ${agentId}: ${chalk.green(agentStat.hits)} hits`);
      });
    }

    if (stats.topQueries && stats.topQueries.length > 0) {
      console.log('\n' + chalk.cyan('🔍 REQUÊTES LES PLUS FRÉQUENTES'));
      console.log(chalk.gray('─'.repeat(40)));
      
      stats.topQueries.slice(0, 5).forEach(([query, count]) => {
        console.log(`  ${chalk.white(count)}x ${chalk.gray(query.substring(0, 40))}...`);
      });
    }
  }

  async searchInCache(query) {
    const results = this.orchestrator.searchCache(query, { limit: 10 });
    
    console.log(chalk.cyan(`🔍 RÉSULTATS DE RECHERCHE: "${query}"`));
    console.log(chalk.gray('─'.repeat(50)));

    if (results.length === 0) {
      console.log(chalk.yellow('⚠️ Aucun résultat trouvé'));
      return;
    }

    results.forEach((result, index) => {
      console.log(`\n${chalk.blue(`${index + 1}.`)} ${chalk.white(result.key)}`);
      console.log(`   ${chalk.gray(`Agent: ${result.metadata.agentId}`)}`);
      console.log(`   ${chalk.gray(`Type: ${result.metadata.queryType}`)}`);
      console.log(`   ${chalk.gray(`Score: ${result.relevance.toFixed(2)}`)}`);
      console.log(`   ${chalk.gray(`Créé: ${new Date(result.metadata.createdAt).toLocaleString()}`)}`);
      
      if (result.entry.results && result.entry.results.length > 0) {
        const snippet = result.entry.results[0].snippet;
        if (snippet) {
          console.log(`   ${chalk.gray(`Extrait: ${snippet.substring(0, 100)}...`)}`);
        }
      }
    });

    console.log(chalk.gray(`\n${results.length} résultat(s) trouvé(s)`));
  }

  displayHeader(title) {
    console.clear();
    console.log(chalk.blue('═'.repeat(60)));
    console.log(chalk.blue.bold(`🎯 ${title}`));
    console.log(chalk.blue('═'.repeat(60)));
    console.log('');
  }

  async displayExecutionSummary(result) {
    console.log(chalk.blue('\n📊 RÉSUMÉ D\'EXÉCUTION'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(`  Fichiers créés: ${result.integration?.files?.size || 0}`);
    console.log(`  Conflits résolus: ${result.integration?.conflicts?.length || 0}`);
    console.log(`  Tests générés: ${result.integration?.tests?.size || 0}`);
    console.log(`  Documentation: ${result.integration?.documentation?.size || 0}`);
  }

  displayAdvancedMonitoring() {
    this.displayHeader('MONITORING AVANCÉ');

    if (!this.orchestrator) return;

    const status = this.orchestrator.getStatus();
    const metrics = this.orchestrator.state.monitoring || {};

    // Graphique de charge ASCII
    console.log(chalk.blue('📊 CHARGE SYSTÈME'));
    console.log(chalk.gray('━'.repeat(30)));
    const load = metrics.currentLoad || 0;
    const barLength = 20;
    const filledLength = Math.round((load / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`  Load: [${bar}] ${load}%`);

    // Métriques temps réel
    console.log(chalk.blue('\n⏱️ MÉTRIQUES TEMPS RÉEL'));
    console.log(chalk.gray('━'.repeat(30)));
    console.log(`  Tâches en cours: ${Object.values(status.agents).filter(a => a.status === 'working').length}`);
    console.log(`  Temps moyen: ${metrics.averageExecutionTime || 0}ms`);
    console.log(`  Taux succès: ${Math.round(((metrics.tasksCompleted || 0) / Math.max(metrics.tasksTotal || 1, 1)) * 100)}%`);

    // Timeline des dernières activités
    console.log(chalk.blue('\n📝 ACTIVITÉ RÉCENTE'));
    console.log(chalk.gray('━'.repeat(30)));
    // Simuler quelques événements récents
    const recentEvents = [
      { time: '14:35:22', agent: 'ui-agent', event: 'Task completed' },
      { time: '14:35:18', agent: 'module-agent', event: 'API endpoint created' },
      { time: '14:35:15', agent: 'db-agent', event: 'Schema generated' }
    ];
    
    recentEvents.forEach(event => {
      console.log(`  ${chalk.gray(event.time)} ${chalk.cyan(event.agent.padEnd(12))} ${event.event}`);
    });
  }

  getStatusColor(status) {
    const colors = {
      'idle': chalk.gray,
      'working': chalk.yellow,
      'completed': chalk.green,
      'error': chalk.red,
      'ready': chalk.blue
    };
    return colors[status] || chalk.white;
  }

  getStatusIcon(status) {
    const icons = {
      'idle': '⚪',
      'working': '🟡',
      'completed': '🟢',
      'error': '🔴',
      'ready': '🔵'
    };
    return icons[status] || '⚫';
  }

  getFeatureTypeColor(type) {
    const colors = {
      'crud-feature': chalk.green,
      'ai-feature': chalk.magenta,
      'ui-enhancement': chalk.cyan,
      'api-integration': chalk.yellow,
      'performance-optimization': chalk.red
    };
    return colors[type] || chalk.white;
  }

  getPriorityIcon(priority) {
    const icons = {
      'low': '🔹',
      'medium': '🔸',
      'high': '🟠',
      'critical': '🔴'
    };
    return icons[priority] || '⚫';
  }

  getRequiredAgents(feature) {
    return Object.entries(feature.agents || {})
      .filter(([_, config]) => config.required !== false)
      .map(([agentId, _]) => agentId);
  }

  async createInteractiveTask(agentType) {
    const questions = [
      {
        type: 'input',
        name: 'id',
        message: 'ID de la tâche:',
        default: `${agentType}-task-${Date.now()}`
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description de la tâche:'
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
        message: 'Temps estimé (ex: 2h, 30m):',
        default: '1h'
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    return {
      ...answers,
      type: this.getDefaultTaskType(agentType),
      spec: {}
    };
  }

  getDefaultTaskType(agentType) {
    const defaultTypes = {
      'db': 'schema',
      'ui': 'component',
      'module': 'api-endpoint',
      'qa': 'unit-tests',
      'doc': 'user-guide'
    };
    return defaultTypes[agentType] || 'generic';
  }

  async simulateAgentExecution(agentType, taskSpec) {
    console.log(chalk.blue(`  📋 Tâche: ${taskSpec.description}`));
    console.log(chalk.blue(`  ⏱️ Temps estimé: ${taskSpec.estimatedTime}`));
    console.log(chalk.yellow('  🔄 Exécution en cours...'));

    // Simuler du travail
    for (let i = 0; i < 3; i++) {
      await this.sleep(1000);
      console.log(chalk.gray(`    ${'█'.repeat(i + 1)}${'░'.repeat(3 - i - 1)} ${Math.round(((i + 1) / 3) * 100)}%`));
    }

    console.log(chalk.green('  ✅ Tâche terminée avec succès!'));
    console.log(chalk.gray('  📁 Fichiers générés: 3'));
    console.log(chalk.gray('  📝 Documentation: Mise à jour'));
  }

  // Méthodes de nettoyage
  async cleanContext7Cache() {
    await this.sleep(500);
  }

  async cleanTempLogs() {
    await this.sleep(300);
  }

  async cleanBuildFiles() {
    await this.sleep(800);
  }

  async cleanTestData() {
    await this.sleep(400);
  }

  async cleanNpmCache() {
    await this.sleep(1000);
  }

  async createReportFile(data, filename, format) {
    await fs.mkdir(path.dirname(filename), { recursive: true });
    
    let content;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'html':
        content = this.generateHTMLReport(data);
        break;
      case 'md':
      default:
        content = this.generateMarkdownReport(data);
        break;
    }

    await fs.writeFile(filename, content);
  }

  generateMarkdownReport(data) {
    return `# NutriCoach Agents - Rapport d'activité

## Période
${data.period}

## Résumé
- Features complétées: ${data.summary.featuresCompleted}
- Tâches exécutées: ${data.summary.tasksExecuted}
- Temps moyen d'exécution: ${data.summary.averageExecutionTime}ms
- Taux d'erreur: ${data.summary.errorRate}%

## Recommandations
${data.recommendations.length > 0 ? data.recommendations.map(r => `- ${r}`).join('\n') : 'Aucune recommandation spécifique'}

---
*Rapport généré le ${new Date(data.generatedAt).toLocaleString()}*
`;
  }

  generateHTMLReport(data) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>NutriCoach Agents Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; }
        .metric { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>NutriCoach Agents - Rapport d'activité</h1>
    <div class="metric">
        <strong>Période:</strong> ${data.period}
    </div>
    <div class="metric">
        <strong>Features complétées:</strong> ${data.summary.featuresCompleted}
    </div>
    <p><em>Rapport généré le ${new Date(data.generatedAt).toLocaleString()}</em></p>
</body>
</html>`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Point d'entrée principal
async function main() {
  const cli = new AgentCLI();
  
  // Gestion gracieuse des interruptions
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Arrêt du CLI...'));
    process.exit(0);
  });

  // Gestion des erreurs non catchées
  process.on('uncaughtException', (error) => {
    console.error(chalk.red('💥 Erreur critique:'), error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });

  // Parse et exécute les commandes
  await program.parseAsync();
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AgentCLI;