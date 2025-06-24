# 🤖 NutriCoach Multi-Agent System

Système d'orchestration multi-agents pour automatiser le développement de fonctionnalités complexes dans NutriCoach.

## 🌟 Vue d'ensemble

Le système multi-agents NutriCoach décompose automatiquement les features complexes en tâches spécialisées, les distribue aux agents appropriés, et coordonne leur exécution avec validation croisée et intégration automatique.

### 🎯 Agents Spécialisés

| Agent | Spécialisation | Responsabilités |
|-------|---------------|-----------------|
| **🗄️ DB Agent** | Base de données | Schémas, migrations, RLS, optimisation |
| **🎨 UI Agent** | Interface & Design | Composants React, Tailwind, accessibilité |
| **⚙️ Module Agent** | Logique métier | APIs, services, intégrations IA |
| **🧪 QA Agent** | Tests & Qualité | Tests unitaires, E2E, performance |
| **📚 Doc Agent** | Documentation | API docs, guides, tutoriels |

## 🚀 Installation

```bash
cd dev-agents
npm install

# Rendre le CLI global (optionnel)
npm link
```

## 📋 Utilisation

### Commandes principales

```bash
# Lister les features disponibles
nutricoach-agents list

# Valider les spécifications
nutricoach-agents validate

# Démarrer une feature
nutricoach-agents start --feature "recipe-recommendation-ai"

# Monitoring en temps réel
nutricoach-agents monitor

# Status des agents
nutricoach-agents status --watch
```

### Exécution d'une feature complète

```bash
# Mode interactif - sélection de feature
nutricoach-agents start

# Feature spécifique
nutricoach-agents start -f "nutrition-tracking"

# Simulation (dry-run)
nutricoach-agents start -f "recipe-recommendation-ai" --dry-run

# Validation préalable + exécution
nutricoach-agents validate && nutricoach-agents start
```

### Agents individuels

```bash
# Exécuter un agent spécifique
nutricoach-agents agent --type db --file task.json

# Mode interactif pour créer une tâche
nutricoach-agents agent --type ui
```

## 📁 Structure

```
dev-agents/
├── agents/                     # Agents spécialisés
│   ├── db-agent.js            # Agent base de données
│   ├── ui-agent.js            # Agent interface
│   ├── module-agent.js        # Agent logique métier
│   ├── qa-agent.js            # Agent tests
│   └── doc-agent.js           # Agent documentation
├── lib/                       # Bibliothèques communes
│   ├── base-agent.js          # Classe de base pour agents
│   └── spec-validator.js      # Validateur de spécifications
├── specs/                     # Spécifications de features
│   ├── feature-template.json  # Template de base
│   └── nutricoach-features.json # Features NutriCoach
├── orchestrator.js            # Orchestrateur principal
├── cli.js                     # Interface CLI
└── package.json               # Dépendances
```

## 🎯 Définition d'une Feature

### Structure de base

```json
{
  "feature": {
    "name": "Ma Feature",
    "description": "Description détaillée",
    "type": "crud-feature",
    "priority": "high",
    "estimatedTime": "8h",
    "tags": ["nutrition", "ai"]
  },
  "agents": {
    "db-agent": {
      "required": true,
      "tasks": [...]
    },
    "ui-agent": {
      "required": true,
      "tasks": [...]
    }
  },
  "validation": {
    "qualityGates": [...]
  }
}
```

### Types de features supportés

- **`crud-feature`** : CRUD complet avec base de données
- **`ai-feature`** : Intégration d'intelligence artificielle
- **`ui-enhancement`** : Amélioration d'interface utilisateur
- **`api-integration`** : Intégration d'API externe
- **`performance-optimization`** : Optimisation de performance

### Exemple de tâche pour DB Agent

```json
{
  "id": "db-user-profiles",
  "type": "schema",
  "description": "Créer le schéma pour les profils utilisateur",
  "priority": "critical",
  "estimatedTime": "2h",
  "spec": {
    "tableName": "user_profiles",
    "columns": [
      { "name": "id", "type": "uuid", "primaryKey": true },
      { "name": "user_id", "type": "uuid", "notNull": true },
      { "name": "display_name", "type": "text", "notNull": true }
    ],
    "policies": [
      { "name": "Users can view own profile", "operation": "select", "condition": "auth.uid() = user_id" }
    ]
  }
}
```

## 🔧 Configuration

### Variables d'environnement

```bash
# Context7 API (optionnel)
export CONTEXT7_API_KEY="your-api-key"
export CONTEXT7_PROJECT_ID="nutricoach"

# OpenAI pour intégrations IA
export OPENAI_API_KEY="your-openai-key"

# Anthropic pour Claude
export ANTHROPIC_API_KEY="your-anthropic-key"

# Ollama local
export OLLAMA_BASE_URL="http://localhost:11434"

# Mode debug
export DEBUG=true
```

### Intégration Context7

Le système consulte automatiquement Context7 avant d'exécuter des tâches critiques pour récupérer les meilleures pratiques et éviter les erreurs communes.

```javascript
// Automatique pour chaque tâche avec useContext7: true
task.useContext7 = true;  // Active la consultation Context7
```

## 📊 Monitoring et Métriques

### Dashboard en temps réel

```bash
# Monitoring avancé avec graphiques ASCII
nutricoach-agents monitor

# Status simple avec auto-refresh
nutricoach-agents status --watch --interval 5
```

### Métriques surveillées

- **Charge système** : Pourcentage d'agents actifs
- **Temps d'exécution** : Moyenne mobile des durées
- **Taux de succès** : Ratio tâches complétées/totales
- **Santé des agents** : Heartbeat et détection de timeout

### Gestion d'erreurs

- **Retry automatique** : 3 tentatives avec délai exponentiel
- **Récupération** : Réinitialisation d'agent en cas d'erreur
- **Délégation** : Basculement vers agent alternatif
- **Rollback** : Annulation en cas d'échec critique

## 🧪 Tests et Validation

### Validation des spécifications

```bash
# Validation complète
nutricoach-agents validate

# Validation avec template personnalisé
nutricoach-agents validate --template custom-template.json

# Validation d'un fichier spécifique
nutricoach-agents validate --file my-feature.json
```

### Quality Gates

Les quality gates sont appliqués automatiquement :

- **Coverage** : Seuil de couverture de tests (80%+)
- **Performance** : Score Lighthouse (90%+)
- **Security** : Audit de sécurité (0 vulnérabilité)
- **Accessibility** : Conformité WCAG (95%+)

## 🔄 Communication Inter-Agents

### Messages automatiques

Les agents communiquent automatiquement pour :

- **Dépendances prêtes** : Notifier quand une dépendance est terminée
- **Partage de ressources** : Échanger types TypeScript, schémas
- **Demande d'assistance** : Solliciter l'aide d'un autre agent
- **Validation croisée** : Vérifier la cohérence des implémentations

### Exemple de communication

```javascript
// Agent DB → Agent Module
await moduleAgent.receiveMessage('db-agent', {
  type: 'dependency-ready',
  data: {
    dependency: 'user-profiles-schema',
    types: 'UserProfile.ts',
    tables: ['user_profiles']
  }
});
```

## 🔍 Dépannage

### Logs détaillés

```bash
# Activer le mode debug
export DEBUG=true
nutricoach-agents start -f "ma-feature"

# Logs spécifiques par agent
export DEBUG_AGENT="db-agent,ui-agent"
```

### Problèmes courants

#### Agent ne répond plus
```bash
# Réinitialiser un agent spécifique
nutricoach-agents clean --agent db-agent

# Nettoyage complet
nutricoach-agents clean --all
```

#### Erreurs de validation
```bash
# Valider avant exécution
nutricoach-agents validate --file specs/ma-feature.json

# Vérifier le template
nutricoach-agents validate --template
```

#### Conflits de dépendances
```bash
# Analyser le graphe de dépendances
nutricoach-agents list --dependencies

# Mode dry-run pour détecter les problèmes
nutricoach-agents start --dry-run -f "ma-feature"
```

## 📈 Rapports et Analytics

### Génération de rapports

```bash
# Rapport hebdomadaire en Markdown
nutricoach-agents report --period 7 --format md

# Rapport HTML avec graphiques
nutricoach-agents report --period 30 --format html

# Export JSON pour analyse
nutricoach-agents report --format json
```

### Métriques disponibles

- Features complétées par période
- Temps d'exécution moyen par agent
- Taux d'erreur et types d'erreurs
- Recommandations d'optimisation

## 🤝 Contribution

### Ajouter un nouvel agent

1. Créer la classe héritant de `BaseAgent`
2. Implémenter `processTask(task)`
3. Ajouter dans l'orchestrateur
4. Mettre à jour les spécifications

### Ajouter un type de tâche

1. Définir le type dans le template
2. Implémenter la validation dans `SpecValidator`
3. Ajouter la logique dans l'agent concerné
4. Documenter les exemples

### Tests

```bash
# Tests unitaires des agents
npm test

# Test d'intégration complet
nutricoach-agents start --dry-run -f "test-feature"

# Validation de toutes les specs
nutricoach-agents validate
```

## 🏗️ Roadmap

### Version 1.1
- [ ] Support pour les agents externes (Ollama, GitHub Copilot)
- [ ] Interface web pour monitoring
- [ ] API REST pour intégration CI/CD
- [ ] Templates de features personnalisables

### Version 1.2
- [ ] Machine learning pour optimisation automatique
- [ ] Prédiction de temps d'exécution
- [ ] Auto-scaling des agents
- [ ] Intégration avec Kubernetes

## 📚 Ressources

- [Documentation Context7](https://context7.ai/docs)
- [Guide des agents IA](./docs/agents-guide.md)
- [Exemples de features](./specs/examples/)
- [Troubleshooting avancé](./docs/troubleshooting.md)

## 📄 Licence

MIT License - voir [LICENSE](../LICENSE) pour plus de détails.

---

**Développé avec ❤️ par l'équipe NutriCoach**

*Système d'agents autonomes pour accélérer le développement de fonctionnalités complexes*