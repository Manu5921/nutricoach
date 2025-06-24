#!/usr/bin/env node

/**
 * 🧪 TEST SYSTÈME MULTI-AGENTS
 * 
 * Tests d'intégration pour valider le bon fonctionnement du système
 */

import chalk from 'chalk';
import MultiAgentOrchestrator from './orchestrator.js';
import SpecValidator from './lib/spec-validator.js';

class SystemTester {
  constructor() {
    this.tests = [
      { name: 'Validation des spécifications', test: () => this.testSpecValidation() },
      { name: 'Initialisation des agents', test: () => this.testAgentInitialization() },
      { name: 'Communication inter-agents', test: () => this.testInterAgentCommunication() },
      { name: 'Gestion des erreurs', test: () => this.testErrorHandling() },
      { name: 'Orchestration simple', test: () => this.testSimpleOrchestration() }
    ];
    
    this.results = [];
  }

  async runAll() {
    console.log(chalk.blue('🧪 TESTS SYSTÈME MULTI-AGENTS'));
    console.log(chalk.blue('═'.repeat(40)));

    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      console.log(chalk.yellow(`\n🔍 ${test.name}...`));
      
      try {
        const startTime = Date.now();
        await test.test();
        const duration = Date.now() - startTime;
        
        console.log(chalk.green(`✅ ${test.name} - OK (${duration}ms)`));
        this.results.push({ name: test.name, status: 'PASS', duration });
        passed++;
      } catch (error) {
        console.log(chalk.red(`❌ ${test.name} - ÉCHEC`));
        console.log(chalk.red(`   Erreur: ${error.message}`));
        this.results.push({ name: test.name, status: 'FAIL', error: error.message });
        failed++;
      }
    }

    this.displaySummary(passed, failed);
    return failed === 0;
  }

  async testSpecValidation() {
    const validator = new SpecValidator();
    
    // Charger le template
    await validator.loadTemplate();
    
    // Test avec une spec valide
    const validSpec = {
      feature: {
        name: 'Test Feature',
        description: 'Feature de test',
        type: 'crud-feature',
        priority: 'medium',
        estimatedTime: '2h'
      },
      agents: {
        'db-agent': {
          required: true,
          tasks: [{
            id: 'test-task',
            type: 'schema',
            description: 'Tâche de test',
            priority: 'medium',
            estimatedTime: '1h',
            spec: { tableName: 'test_table' }
          }]
        }
      }
    };

    const result = await validator.validateFeature(validSpec, 'test-feature');
    
    if (!result.valid) {
      throw new Error(`Validation échoué: ${result.errors.map(e => e.message).join(', ')}`);
    }

    // Test avec une spec invalide
    const invalidSpec = {
      feature: {
        name: 'Invalid Feature'
        // Champs manquants intentionnellement
      }
    };

    const invalidResult = await validator.validateFeature(invalidSpec, 'invalid-feature');
    
    if (invalidResult.valid) {
      throw new Error('La validation devrait échouer pour une spec invalide');
    }

    console.log('  ✓ Validation des specs valides et invalides');
  }

  async testAgentInitialization() {
    const orchestrator = new MultiAgentOrchestrator();
    
    // Vérifier que tous les agents sont initialisés
    const expectedAgents = ['db-agent', 'ui-agent', 'module-agent', 'qa-agent', 'doc-agent'];
    
    for (const agentId of expectedAgents) {
      if (!orchestrator.agents.has(agentId)) {
        throw new Error(`Agent ${agentId} non initialisé`);
      }
      
      const agent = orchestrator.agents.get(agentId);
      if (!agent.instance) {
        throw new Error(`Instance de ${agentId} non créée`);
      }
    }

    console.log(`  ✓ ${expectedAgents.length} agents initialisés correctement`);
    
    // Vérifier les capacités des agents
    const dbAgent = orchestrator.agents.get('db-agent');
    if (!dbAgent.capabilities.includes('postgresql')) {
      throw new Error('DB Agent devrait avoir la capacité postgresql');
    }

    console.log('  ✓ Capacités des agents vérifiées');
  }

  async testInterAgentCommunication() {
    const orchestrator = new MultiAgentOrchestrator();
    
    // Test de routage de message
    let messageReceived = false;
    
    // Mock de la réception de message
    const originalReceiveMessage = orchestrator.agentInstances.get('ui-agent').receiveMessage;
    orchestrator.agentInstances.get('ui-agent').receiveMessage = async (from, message) => {
      messageReceived = true;
      console.log(`  ✓ Message reçu: ${from} → ui-agent (${message.type})`);
    };

    // Envoyer un message de test
    await orchestrator.routeMessage({
      from: 'db-agent',
      to: 'ui-agent',
      message: {
        type: 'dependency-ready',
        data: { dependency: 'test-schema' }
      }
    });

    if (!messageReceived) {
      throw new Error('Message non reçu par l\'agent destinataire');
    }

    // Restaurer la méthode originale
    orchestrator.agentInstances.get('ui-agent').receiveMessage = originalReceiveMessage;
  }

  async testErrorHandling() {
    const orchestrator = new MultiAgentOrchestrator();
    
    // Test de gestion d'erreur avec retry
    const testTask = {
      id: 'error-test-task',
      type: 'test',
      description: 'Tâche de test d\'erreur',
      priority: 'low',
      estimatedTime: '1m',
      maxRetries: 2
    };

    // Mock d'une tâche qui échoue
    let attemptCount = 0;
    const originalExecuteTask = orchestrator.agentInstances.get('db-agent').executeTask;
    orchestrator.agentInstances.get('db-agent').executeTask = async (task) => {
      attemptCount++;
      if (attemptCount <= 2) {
        throw new Error('Erreur simulée');
      }
      return { success: true };
    };

    try {
      await orchestrator.executeTask('db-agent', testTask);
      console.log(`  ✓ Retry fonctionnel: ${attemptCount} tentatives`);
    } catch (error) {
      // Restaurer la méthode originale
      orchestrator.agentInstances.get('db-agent').executeTask = originalExecuteTask;
      throw new Error(`Gestion d'erreur échouée: ${error.message}`);
    }

    // Restaurer la méthode originale
    orchestrator.agentInstances.get('db-agent').executeTask = originalExecuteTask;
  }

  async testSimpleOrchestration() {
    const orchestrator = new MultiAgentOrchestrator();
    
    // Feature de test très simple
    const testFeature = {
      feature: {
        name: 'Test Simple',
        description: 'Test d\'orchestration basique',
        type: 'crud-feature',
        priority: 'low',
        estimatedTime: '1h'
      },
      agents: {
        'db-agent': {
          required: true,
          tasks: [{
            id: 'test-db-task',
            type: 'schema',
            description: 'Tâche DB de test',
            priority: 'medium',
            estimatedTime: '30m',
            spec: { tableName: 'test_orchestration' }
          }]
        }
      }
    };

    // Mock des méthodes d'exécution pour éviter les vraies opérations
    const originalProcessTask = orchestrator.agentInstances.get('db-agent').processTask;
    orchestrator.agentInstances.get('db-agent').processTask = async (task) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simuler du travail
      return {
        success: true,
        files: ['test-schema.sql'],
        documentation: 'Test schema created'
      };
    };

    try {
      // Tester la décomposition
      const decomposition = await orchestrator.decomposeFeature(testFeature);
      
      if (!decomposition.tasks['db-agent'] || decomposition.tasks['db-agent'].length === 0) {
        throw new Error('Décomposition échouée - pas de tâches DB');
      }

      console.log('  ✓ Décomposition de feature');

      // Tester la création du plan d'exécution
      const plan = await orchestrator.createExecutionPlan(decomposition);
      
      if (!plan.phases || plan.phases.length === 0) {
        throw new Error('Plan d\'exécution vide');
      }

      console.log(`  ✓ Plan d'exécution: ${plan.phases.length} phases`);

      // Restaurer la méthode originale
      orchestrator.agentInstances.get('db-agent').processTask = originalProcessTask;

    } catch (error) {
      // Restaurer en cas d'erreur
      orchestrator.agentInstances.get('db-agent').processTask = originalProcessTask;
      throw error;
    }
  }

  displaySummary(passed, failed) {
    console.log(chalk.blue('\n📊 RÉSUMÉ DES TESTS'));
    console.log(chalk.blue('═'.repeat(30)));
    
    console.log(`Total: ${passed + failed} tests`);
    console.log(chalk.green(`Réussis: ${passed}`));
    console.log(failed > 0 ? chalk.red(`Échoués: ${failed}`) : `Échoués: ${failed}`);
    
    const successRate = Math.round((passed / (passed + failed)) * 100);
    const rateColor = successRate >= 100 ? chalk.green : successRate >= 80 ? chalk.yellow : chalk.red;
    console.log(`Taux de réussite: ${rateColor(successRate + '%')}`);

    if (failed === 0) {
      console.log(chalk.green('\n🎉 Tous les tests sont passés! Le système est opérationnel.'));
    } else {
      console.log(chalk.red('\n⚠️ Certains tests ont échoué. Vérifiez la configuration.'));
    }

    // Détail des résultats
    console.log(chalk.blue('\n📋 DÉTAIL DES RÉSULTATS:'));
    for (const result of this.results) {
      const statusColor = result.status === 'PASS' ? chalk.green : chalk.red;
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`  ${statusColor(result.status)} ${result.name}${duration}`);
      
      if (result.error) {
        console.log(chalk.gray(`       ${result.error}`));
      }
    }
  }

  // Test individuel
  async runSingle(testName) {
    const test = this.tests.find(t => t.name.toLowerCase().includes(testName.toLowerCase()));
    
    if (!test) {
      console.log(chalk.red(`❌ Test "${testName}" non trouvé`));
      console.log(chalk.gray('Tests disponibles:'));
      this.tests.forEach(t => console.log(`  - ${t.name}`));
      return false;
    }

    console.log(chalk.blue(`🧪 TEST: ${test.name}`));
    
    try {
      await test.test();
      console.log(chalk.green(`✅ ${test.name} - RÉUSSI`));
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ ${test.name} - ÉCHOUÉ`));
      console.log(chalk.red(`Erreur: ${error.message}`));
      return false;
    }
  }
}

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SystemTester();
  
  const testName = process.argv[2];
  
  if (testName) {
    // Test individuel
    tester.runSingle(testName).then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // Tous les tests
    tester.runAll().then(success => {
      process.exit(success ? 0 : 1);
    });
  }
}

export default SystemTester;