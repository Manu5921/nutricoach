#!/usr/bin/env node

/**
 * 📚 DOC AGENT - DOCUMENTATION
 * 
 * Spécialisation: Documentation technique, guides utilisateur, API docs
 * Responsabilités: Markdown, JSDoc, guides, tutoriels, troubleshooting
 */

import { BaseAgent } from '../lib/base-agent.js';
import chalk from 'chalk';

class DocAgent extends BaseAgent {
  constructor() {
    super({
      id: 'doc-agent',
      name: 'Doc Agent',
      specialization: 'Documentation',
      color: 'blue',
      capabilities: [
        'markdown',
        'jsdoc',
        'api-documentation',
        'user-guides',
        'tutorials',
        'troubleshooting',
        'changelog',
        'readme',
        'wiki',
        'openapi-specs'
      ],
      dependencies: ['ui-agent', 'module-agent', 'db-agent', 'qa-agent'], // Documente tout
      outputPaths: {
        docs: 'docs/',
        guides: 'docs/guides/',
        api: 'docs/api/',
        tutorials: 'docs/tutorials/',
        troubleshooting: 'docs/troubleshooting/',
        changelog: 'CHANGELOG.md',
        readme: 'README.md',
        wiki: 'docs/wiki/'
      }
    });

    this.docTypes = {
      technical: 'Documentation technique',
      user: 'Guide utilisateur',
      api: 'Documentation API',
      tutorial: 'Tutoriel',
      troubleshooting: 'Guide de dépannage',
      changelog: 'Journal des modifications',
      readme: 'Fichier README'
    };

    this.templates = new Map();
    this.generatedDocs = new Map();
    this.crossReferences = new Map();
  }

  /**
   * 🎯 TRAITEMENT DES TÂCHES DOC
   */
  async processTask(task) {
    this.log(`📚 Traitement tâche Doc: ${task.description}`);

    try {
      switch (task.type) {
        case 'api-docs':
          return await this.createAPIDocumentation(task);
        case 'user-guide':
          return await this.createUserGuide(task);
        case 'tutorial':
          return await this.createTutorial(task);
        case 'technical-doc':
          return await this.createTechnicalDoc(task);
        case 'troubleshooting':
          return await this.createTroubleshooting(task);
        case 'changelog':
          return await this.updateChangelog(task);
        case 'readme':
          return await this.createReadme(task);
        case 'jsdoc':
          return await this.generateJSDoc(task);
        case 'openapi-spec':
          return await this.createOpenAPISpec(task);
        default:
          throw new Error(`Type de tâche Doc non supporté: ${task.type}`);
      }
    } catch (error) {
      this.logError(`Erreur traitement tâche ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * 📖 DOCUMENTATION API
   */
  async createAPIDocumentation(task) {
    const { endpoints, schemas, authentication, examples } = task.spec;
    
    this.log('📖 Création documentation API');

    const docFiles = [];

    // Documentation globale de l'API
    const apiOverview = this.generateAPIOverview(authentication, endpoints.length);
    docFiles.push({
      path: `${this.config.outputPaths.api}overview.md`,
      content: apiOverview
    });

    // Documentation par endpoint
    for (const endpoint of endpoints) {
      const endpointDoc = this.generateEndpointDoc(endpoint, examples);
      docFiles.push({
        path: `${this.config.outputPaths.api}endpoints/${endpoint.name}.md`,
        content: endpointDoc
      });
    }

    // Schémas de données
    if (schemas) {
      const schemasDoc = this.generateSchemasDoc(schemas);
      docFiles.push({
        path: `${this.config.outputPaths.api}schemas.md`,
        content: schemasDoc
      });
    }

    // Guide d'authentification
    if (authentication) {
      const authDoc = this.generateAuthDoc(authentication);
      docFiles.push({
        path: `${this.config.outputPaths.api}authentication.md`,
        content: authDoc
      });
    }

    // Postman Collection
    const postmanCollection = this.generatePostmanCollection(endpoints, authentication);
    docFiles.push({
      path: `${this.config.outputPaths.api}NutriCoach.postman_collection.json`,
      content: JSON.stringify(postmanCollection, null, 2)
    });

    return {
      success: true,
      files: docFiles,
      endpoints: endpoints.length,
      documentation: `Documentation API créée pour ${endpoints.length} endpoints`
    };
  }

  /**
   * 👤 GUIDE UTILISATEUR
   */
  async createUserGuide(task) {
    const { feature, audience, steps, screenshots } = task.spec;
    
    this.log(`👤 Création guide utilisateur: ${feature}`);

    const guideContent = this.generateUserGuide(feature, audience, steps, screenshots);
    
    const files = [
      {
        path: `${this.config.outputPaths.guides}${feature.toLowerCase().replace(/\s+/g, '-')}.md`,
        content: guideContent
      }
    ];

    // Index des guides
    await this.updateGuidesIndex(feature);

    return {
      success: true,
      files,
      feature,
      audience,
      steps: steps.length,
      documentation: `Guide utilisateur créé pour ${feature}`
    };
  }

  /**
   * 🎓 TUTORIEL
   */
  async createTutorial(task) {
    const { title, difficulty, duration, prerequisites, steps, code } = task.spec;
    
    this.log(`🎓 Création tutoriel: ${title}`);

    const tutorialContent = this.generateTutorial(title, difficulty, duration, prerequisites, steps, code);
    
    const files = [
      {
        path: `${this.config.outputPaths.tutorials}${title.toLowerCase().replace(/\s+/g, '-')}.md`,
        content: tutorialContent
      }
    ];

    // Code d'exemple si fourni
    if (code) {
      for (const codeFile of code) {
        files.push({
          path: `${this.config.outputPaths.tutorials}examples/${title.toLowerCase().replace(/\s+/g, '-')}/${codeFile.name}`,
          content: codeFile.content
        });
      }
    }

    return {
      success: true,
      files,
      title,
      difficulty,
      duration,
      steps: steps.length,
      documentation: `Tutoriel ${title} créé (difficulté: ${difficulty})`
    };
  }

  /**
   * 🔧 DOCUMENTATION TECHNIQUE
   */
  async createTechnicalDoc(task) {
    const { component, architecture, apis, dependencies, deployment } = task.spec;
    
    this.log(`🔧 Création documentation technique: ${component}`);

    const techDocContent = this.generateTechnicalDoc(component, architecture, apis, dependencies, deployment);
    
    const files = [
      {
        path: `${this.config.outputPaths.docs}technical/${component.toLowerCase().replace(/\s+/g, '-')}.md`,
        content: techDocContent
      }
    ];

    // Diagrammes d'architecture si fournis
    if (architecture?.diagrams) {
      for (const diagram of architecture.diagrams) {
        files.push({
          path: `${this.config.outputPaths.docs}technical/diagrams/${diagram.name}.md`,
          content: this.generateDiagram(diagram)
        });
      }
    }

    return {
      success: true,
      files,
      component,
      documentation: `Documentation technique créée pour ${component}`
    };
  }

  /**
   * 🚨 GUIDE DE DÉPANNAGE
   */
  async createTroubleshooting(task) {
    const { category, issues, solutions } = task.spec;
    
    this.log(`🚨 Création guide dépannage: ${category}`);

    const troubleshootingContent = this.generateTroubleshooting(category, issues, solutions);
    
    const files = [
      {
        path: `${this.config.outputPaths.troubleshooting}${category.toLowerCase().replace(/\s+/g, '-')}.md`,
        content: troubleshootingContent
      }
    ];

    return {
      success: true,
      files,
      category,
      issues: issues.length,
      documentation: `Guide de dépannage créé pour ${category} (${issues.length} problèmes)`
    };
  }

  /**
   * 📝 CHANGELOG
   */
  async updateChangelog(task) {
    const { version, date, changes, type } = task.spec;
    
    this.log(`📝 Mise à jour changelog: v${version}`);

    const changelogEntry = this.generateChangelogEntry(version, date, changes, type);
    
    // Lire le changelog existant et ajouter la nouvelle entrée
    const existingChangelog = await this.readExistingChangelog();
    const updatedChangelog = this.prependToChangelog(existingChangelog, changelogEntry);

    const files = [
      {
        path: this.config.outputPaths.changelog,
        content: updatedChangelog
      }
    ];

    return {
      success: true,
      files,
      version,
      changes: changes.length,
      documentation: `Changelog mis à jour pour la version ${version}`
    };
  }

  /**
   * 📄 README
   */
  async createReadme(task) {
    const { project, description, features, installation, usage, contributing } = task.spec;
    
    this.log(`📄 Création README: ${project}`);

    const readmeContent = this.generateReadme(project, description, features, installation, usage, contributing);
    
    const files = [
      {
        path: this.config.outputPaths.readme,
        content: readmeContent
      }
    ];

    return {
      success: true,
      files,
      project,
      documentation: `README créé pour ${project}`
    };
  }

  /**
   * 💾 JSDoc
   */
  async generateJSDoc(task) {
    const { sourceFiles, outputFormat, includePrivate } = task.spec;
    
    this.log('💾 Génération JSDoc');

    const jsdocConfig = this.generateJSDocConfig(sourceFiles, outputFormat, includePrivate);
    
    const files = [
      {
        path: 'jsdoc.config.json',
        content: JSON.stringify(jsdocConfig, null, 2)
      },
      {
        path: `${this.config.outputPaths.docs}jsdoc/.gitkeep`,
        content: '# JSDoc generated files will be placed here'
      }
    ];

    return {
      success: true,
      files,
      sourceFiles: sourceFiles.length,
      documentation: `Configuration JSDoc créée pour ${sourceFiles.length} fichiers`
    };
  }

  /**
   * 🔗 SPÉCIFICATION OPENAPI
   */
  async createOpenAPISpec(task) {
    const { title, version, description, servers, paths, components } = task.spec;
    
    this.log('🔗 Création spécification OpenAPI');

    const openApiSpec = this.generateOpenAPISpec(title, version, description, servers, paths, components);
    
    const files = [
      {
        path: `${this.config.outputPaths.api}openapi.yaml`,
        content: openApiSpec
      },
      {
        path: `${this.config.outputPaths.api}openapi.json`,
        content: JSON.stringify(this.yamlToJson(openApiSpec), null, 2)
      }
    ];

    return {
      success: true,
      files,
      title,
      version,
      paths: Object.keys(paths).length,
      documentation: `Spécification OpenAPI ${version} créée`
    };
  }

  /**
   * 🏗️ GÉNÉRATEURS DE DOCUMENTATION
   */
  generateAPIOverview(authentication, endpointsCount) {
    return `# NutriCoach API Documentation

## Vue d'ensemble

L'API NutriCoach permet d'accéder aux fonctionnalités de l'application de coaching nutritionnel.

### Informations générales

- **Version**: 1.0.0
- **Base URL**: \`https://api.nutricoach.com/v1\`
- **Endpoints**: ${endpointsCount}
- **Format**: JSON
- **Encodage**: UTF-8

### Authentification

${authentication ? `
L'API utilise l'authentification par ${authentication.type}.

${authentication.type === 'JWT' ? `
#### JWT Token

1. Obtenir un token via \`POST /auth/login\`
2. Inclure le token dans l'en-tête: \`Authorization: Bearer <token>\`
3. Le token expire après ${authentication.expiry || '24 heures'}

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     https://api.nutricoach.com/v1/recipes
\`\`\`
` : ''}
` : 'Aucune authentification requise pour cette API.'}

### Codes de réponse

| Code | Description |
|------|-------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 400  | Requête invalide |
| 401  | Non autorisé |
| 403  | Accès interdit |
| 404  | Ressource non trouvée |
| 500  | Erreur serveur |

### Format des erreurs

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description de l'erreur",
    "details": {
      "field": "Détail spécifique"
    }
  }
}
\`\`\`

### Rate Limiting

- **Limite**: 1000 requêtes par heure par IP
- **En-têtes de réponse**:
  - \`X-RateLimit-Limit\`: Limite totale
  - \`X-RateLimit-Remaining\`: Requêtes restantes
  - \`X-RateLimit-Reset\`: Timestamp de reset

### Support

- **Email**: api-support@nutricoach.com
- **Documentation**: [https://docs.nutricoach.com](https://docs.nutricoach.com)
- **Status**: [https://status.nutricoach.com](https://status.nutricoach.com)
`;
  }

  generateEndpointDoc(endpoint, examples) {
    return `# ${endpoint.name}

## ${endpoint.method.toUpperCase()} ${endpoint.path}

${endpoint.description}

### Paramètres

${endpoint.parameters ? endpoint.parameters.map(param => `
#### ${param.name}
- **Type**: ${param.type}
- **Requis**: ${param.required ? 'Oui' : 'Non'}
- **Description**: ${param.description}
${param.example ? `- **Exemple**: \`${param.example}\`` : ''}
`).join('\n') : 'Aucun paramètre requis.'}

### Corps de la requête

${endpoint.requestBody ? `
\`\`\`json
${JSON.stringify(endpoint.requestBody, null, 2)}
\`\`\`
` : 'Aucun corps de requête.'}

### Réponse

#### Succès (${endpoint.successCode || 200})

\`\`\`json
${JSON.stringify(endpoint.responseExample, null, 2)}
\`\`\`

#### Erreurs possibles

${endpoint.errors ? endpoint.errors.map(error => `
- **${error.code}**: ${error.description}
`).join('') : '- **400**: Requête invalide\n- **500**: Erreur serveur'}

### Exemples

${examples ? examples.map(example => `
#### ${example.title}

\`\`\`bash
${example.curl}
\`\`\`

**Réponse:**
\`\`\`json
${JSON.stringify(example.response, null, 2)}
\`\`\`
`).join('\n') : ''}

### Notes

${endpoint.notes || 'Aucune note spécifique.'}
`;
  }

  generateUserGuide(feature, audience, steps, screenshots) {
    return `# Guide utilisateur - ${feature}

## Public cible
${audience}

## Objectif
Ce guide vous accompagne dans l'utilisation de la fonctionnalité ${feature} de NutriCoach.

## Prérequis
- Compte NutriCoach actif
- Connexion Internet
- Navigateur web moderne

## Étapes

${steps.map((step, index) => `
### ${index + 1}. ${step.title}

${step.description}

${step.action ? `
**Action à effectuer :**
${step.action}
` : ''}

${step.screenshot ? `
![${step.title}](../images/${step.screenshot})
` : ''}

${step.tip ? `
> 💡 **Astuce :** ${step.tip}
` : ''}

${step.warning ? `
> ⚠️ **Attention :** ${step.warning}
` : ''}
`).join('\n')}

## Problèmes fréquents

### Le bouton ne répond pas
1. Vérifiez votre connexion Internet
2. Rechargez la page
3. Contactez le support si le problème persiste

### Données non sauvegardées
1. Vérifiez que tous les champs obligatoires sont remplis
2. Attendez la confirmation de sauvegarde
3. En cas d'erreur, réessayez

## Aide supplémentaire

- [FAQ](../faq.md)
- [Guides vidéo](../videos/)
- [Support technique](mailto:support@nutricoach.com)
`;
  }

  generateTutorial(title, difficulty, duration, prerequisites, steps, code) {
    return `# Tutoriel - ${title}

## Informations

- **Difficulté :** ${difficulty}
- **Durée estimée :** ${duration}
- **Prérequis :** ${prerequisites.join(', ')}

## Introduction

${steps[0]?.introduction || `Ce tutoriel vous guide dans l'implémentation de ${title}.`}

## Étapes du tutoriel

${steps.map((step, index) => `
### Étape ${index + 1}: ${step.title}

${step.description}

${step.code ? `
\`\`\`${step.language || 'javascript'}
${step.code}
\`\`\`
` : ''}

${step.explanation ? `
**Explication :**
${step.explanation}
` : ''}

${step.checkpoint ? `
#### ✅ Point de contrôle
${step.checkpoint}
` : ''}
`).join('\n')}

## Code complet

${code ? code.map(file => `
### ${file.name}

\`\`\`${file.language || 'javascript'}
${file.content}
\`\`\`
`).join('\n') : 'Le code complet est disponible dans les exemples.'}

## Prochaines étapes

- Explorez les variations possibles
- Consultez la documentation API
- Rejoignez la communauté des développeurs

## Ressources supplémentaires

- [Documentation officielle](../api/)
- [Exemples de code](../examples/)
- [Forum communautaire](https://forum.nutricoach.com)
`;
  }

  generateTechnicalDoc(component, architecture, apis, dependencies, deployment) {
    return `# Documentation technique - ${component}

## Architecture

${architecture ? `
### Vue d'ensemble
${architecture.overview}

### Composants principaux
${architecture.components ? architecture.components.map(comp => `
- **${comp.name}**: ${comp.description}
`).join('') : ''}

### Flux de données
${architecture.dataFlow || 'À documenter'}

### Diagrammes
${architecture.diagrams ? architecture.diagrams.map(diag => `
- [${diag.name}](./diagrams/${diag.name}.md)
`).join('') : 'Aucun diagramme disponible'}
` : ''}

## APIs

${apis ? apis.map(api => `
### ${api.name}
- **Endpoint**: ${api.endpoint}
- **Méthode**: ${api.method}
- **Description**: ${api.description}
- **Documentation**: [Voir détails](../api/endpoints/${api.name}.md)
`).join('\n') : 'Aucune API exposée'}

## Dépendances

${dependencies ? `
### Dépendances externes
${dependencies.external ? dependencies.external.map(dep => `
- **${dep.name}** (${dep.version}): ${dep.description}
`).join('') : 'Aucune dépendance externe'}

### Dépendances internes
${dependencies.internal ? dependencies.internal.map(dep => `
- **${dep.name}**: ${dep.description}
`).join('') : 'Aucune dépendance interne'}
` : ''}

## Déploiement

${deployment ? `
### Environnements
${deployment.environments ? deployment.environments.map(env => `
#### ${env.name}
- **URL**: ${env.url}
- **Configuration**: ${env.config}
- **Notes**: ${env.notes || 'Aucune note spécifique'}
`).join('\n') : ''}

### Processus de déploiement
${deployment.process ? `
1. ${deployment.process.join('\n2. ')}
` : 'Processus automatisé via CI/CD'}
` : ''}

## Configuration

### Variables d'environnement
\`\`\`bash
# Configuration ${component}
COMPONENT_API_KEY=your_api_key
COMPONENT_DEBUG=false
COMPONENT_TIMEOUT=30000
\`\`\`

## Monitoring

### Métriques surveillées
- Temps de réponse
- Taux d'erreur
- Utilisation mémoire
- Charge CPU

### Logs
Les logs sont disponibles dans \`/logs/${component.toLowerCase()}/\`

## Maintenance

### Tâches régulières
- Mise à jour des dépendances
- Nettoyage des logs anciens
- Vérification des métriques de performance

### Contacts
- **Équipe responsable**: ${component} Team
- **Email**: ${component.toLowerCase()}@nutricoach.com
- **Slack**: #${component.toLowerCase()}-support
`;
  }

  generateTroubleshooting(category, issues, solutions) {
    return `# Guide de dépannage - ${category}

## Problèmes fréquents

${issues.map((issue, index) => `
### ${index + 1}. ${issue.title}

**Symptômes :**
${issue.symptoms.map(symptom => `- ${symptom}`).join('\n')}

**Causes possibles :**
${issue.causes.map(cause => `- ${cause}`).join('\n')}

**Solutions :**
${issue.solutions.map(solution => `
#### ${solution.title}
${solution.steps.map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join('\n')}

${solution.code ? `
\`\`\`bash
${solution.code}
\`\`\`
` : ''}
`).join('\n')}

**Prévention :**
${issue.prevention || 'Aucune mesure préventive spécifique'}

---
`).join('\n')}

## Diagnostics avancés

### Outils de diagnostic
- Logs de l'application : \`/logs/app/\`
- Métriques système : Dashboard Grafana
- Traces : Jaeger UI

### Commandes utiles

\`\`\`bash
# Vérifier le statut des services
npm run health-check

# Consulter les logs en temps réel
tail -f logs/app/current.log

# Redémarrer un service spécifique
npm run restart:${category.toLowerCase()}
\`\`\`

## Escalade

Si aucune solution ne fonctionne :

1. **Niveau 1** : Support utilisateur (support@nutricoach.com)
2. **Niveau 2** : Équipe technique (tech@nutricoach.com)
3. **Niveau 3** : Équipe DevOps (devops@nutricoach.com)

## Contacts d'urgence

- **Astreinte technique** : +33 1 23 45 67 89
- **Slack urgence** : #incidents
- **Status page** : https://status.nutricoach.com
`;
  }

  generateChangelogEntry(version, date, changes, type) {
    const typeEmojis = {
      major: '🚀',
      minor: '✨',
      patch: '🐛',
      security: '🔒'
    };

    return `## [${version}] - ${date}

${changes.map(change => `
### ${typeEmojis[change.type] || '•'} ${change.category}

${change.items.map(item => `- ${item}`).join('\n')}
`).join('\n')}

${changes.some(change => change.breaking) ? `
### ⚠️ Breaking Changes

${changes.filter(change => change.breaking).map(change => `
- **${change.category}**: ${change.breakingDescription}
`).join('')}
` : ''}
`;
  }

  generateReadme(project, description, features, installation, usage, contributing) {
    return `# ${project}

${description}

## ✨ Fonctionnalités

${features.map(feature => `- ${feature}`).join('\n')}

## 🚀 Installation

${installation.prerequisites ? `
### Prérequis

${installation.prerequisites.map(req => `- ${req}`).join('\n')}
` : ''}

### Installation rapide

\`\`\`bash
${installation.commands.join('\n')}
\`\`\`

## 📖 Utilisation

${usage.examples ? usage.examples.map(example => `
### ${example.title}

${example.description}

\`\`\`${example.language || 'bash'}
${example.code}
\`\`\`
`).join('\n') : ''}

## 🛠️ Développement

### Configuration de l'environnement de développement

\`\`\`bash
# Cloner le repository
git clone https://github.com/nutricoach/${project.toLowerCase()}.git

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
\`\`\`

### Scripts disponibles

- \`npm run dev\` - Démarrage en mode développement
- \`npm run build\` - Construction pour la production
- \`npm run test\` - Exécution des tests
- \`npm run lint\` - Vérification du code

## 🤝 Contribution

${contributing ? `
${contributing.guidelines}

### Processus de contribution

1. ${contributing.process.join('\n2. ')}
` : `
Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus de détails.
`}

## 📋 Changelog

Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique des versions.

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](./LICENSE) pour plus de détails.

## 🆘 Support

- 📚 [Documentation](./docs/)
- 💬 [Forum communautaire](https://forum.nutricoach.com)
- 📧 [Support technique](mailto:support@nutricoach.com)
- 🐛 [Signaler un bug](https://github.com/nutricoach/${project.toLowerCase()}/issues)

## 👥 Équipe

Développé avec ❤️ par l'équipe NutriCoach.

---

Made with ❤️ in France 🇫🇷
`;
  }

  generateJSDocConfig(sourceFiles, outputFormat, includePrivate) {
    return {
      source: {
        include: sourceFiles,
        includePattern: "\\.(js|ts)x?$",
        exclude: ["node_modules/", "tests/", "*.test.js", "*.spec.js"]
      },
      opts: {
        destination: "./docs/jsdoc/",
        recurse: true,
        readme: "./README.md"
      },
      plugins: [
        "plugins/markdown",
        "plugins/typescript"
      ],
      templates: {
        cleverLinks: false,
        monospaceLinks: false
      },
      opts: {
        template: "docdash"
      }
    };
  }

  generateOpenAPISpec(title, version, description, servers, paths, components) {
    return `openapi: 3.0.3
info:
  title: ${title}
  description: ${description}
  version: ${version}
  contact:
    name: NutriCoach API Support
    email: api-support@nutricoach.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
${servers.map(server => `  - url: ${server.url}
    description: ${server.description}`).join('\n')}

paths:
${Object.entries(paths).map(([path, methods]) => `
  ${path}:
${Object.entries(methods).map(([method, spec]) => `    ${method}:
      summary: ${spec.summary}
      description: ${spec.description}
      tags:
        - ${spec.tag}
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${spec.responseSchema}'`).join('\n')}`).join('\n')}

components:
  schemas:
${Object.entries(components.schemas).map(([name, schema]) => `    ${name}:
      type: object
      properties:
${Object.entries(schema.properties).map(([prop, def]) => `        ${prop}:
          type: ${def.type}
          description: ${def.description}`).join('\n')}`).join('\n')}

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
`;
  }

  // Méthodes utilitaires
  async updateGuidesIndex(feature) {
    // Mettre à jour l'index des guides
    const indexPath = `${this.config.outputPaths.guides}index.md`;
    // Logique de mise à jour de l'index
  }

  async readExistingChangelog() {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(this.config.outputPaths.changelog, 'utf8');
    } catch (error) {
      return this.generateInitialChangelog();
    }
  }

  generateInitialChangelog() {
    return `# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }

  prependToChangelog(existingContent, newEntry) {
    const lines = existingContent.split('\n');
    const insertIndex = lines.findIndex(line => line.match(/^## \[/)) || 4;
    
    lines.splice(insertIndex, 0, newEntry);
    return lines.join('\n');
  }

  generateDiagram(diagram) {
    return `# ${diagram.name}

## Description
${diagram.description}

## Diagramme

\`\`\`mermaid
${diagram.mermaidCode}
\`\`\`

## Notes
${diagram.notes || 'Aucune note spécifique'}
`;
  }

  generatePostmanCollection(endpoints, authentication) {
    return {
      info: {
        name: "NutriCoach API",
        description: "Collection Postman pour l'API NutriCoach",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      auth: authentication ? {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: "{{access_token}}",
            type: "string"
          }
        ]
      } : null,
      item: endpoints.map(endpoint => ({
        name: endpoint.name,
        request: {
          method: endpoint.method.toUpperCase(),
          header: [
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          url: {
            raw: `{{base_url}}${endpoint.path}`,
            host: ["{{base_url}}"],
            path: endpoint.path.split('/').filter(Boolean)
          },
          body: endpoint.requestBody ? {
            mode: "raw",
            raw: JSON.stringify(endpoint.requestBody, null, 2)
          } : undefined
        }
      }))
    };
  }

  yamlToJson(yamlString) {
    // Conversion simplifiée YAML vers JSON
    // En production, utiliser une vraie librairie YAML
    return { converted: "Use yaml library for real conversion" };
  }
}

export { DocAgent };

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new DocAgent();
  
  const exampleTask = {
    id: 'doc-api-recipes',
    type: 'api-docs',
    description: 'Créer la documentation API pour les recettes',
    spec: {
      endpoints: [
        {
          name: 'getRecipes',
          method: 'GET',
          path: '/recipes',
          description: 'Récupérer la liste des recettes',
          parameters: [
            { name: 'search', type: 'string', required: false, description: 'Terme de recherche' },
            { name: 'category', type: 'string', required: false, description: 'Catégorie de recette' }
          ],
          responseExample: { recipes: [], total: 0 },
          successCode: 200
        }
      ],
      authentication: {
        type: 'JWT',
        expiry: '24 heures'
      },
      examples: [
        {
          title: 'Rechercher des recettes',
          curl: 'curl -H "Authorization: Bearer TOKEN" "https://api.nutricoach.com/v1/recipes?search=salade"',
          response: { recipes: [{ id: 1, name: 'Salade César' }], total: 1 }
        }
      ]
    }
  };

  agent.processTask(exampleTask)
    .then(result => {
      console.log('✅ Documentation créée:', result);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
    });
}