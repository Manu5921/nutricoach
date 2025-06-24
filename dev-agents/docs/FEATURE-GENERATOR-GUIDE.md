# 🎯 Guide du Générateur de Features NutriCoach

Ce guide explique comment utiliser le système de génération automatique de features pour accélérer le développement avec l'orchestrateur multi-agents.

## 🚀 Vue d'ensemble

Le générateur de features permet de créer rapidement des spécifications de features structurées et validées pour le système NutriCoach. Il propose plusieurs approches :

- **Templates prédéfinis** : Pour les patterns communs (CRUD, IA, UI, etc.)
- **Exemples adaptables** : Basés sur des features existantes
- **Création depuis zéro** : Mode interactif complet

## 📋 Commandes disponibles

### Via Make (recommandé)

```bash
# Génération interactive
make generate

# Templates spécialisés
make generate-crud      # Feature CRUD simple
make generate-ai        # Feature avec IA
make generate-ui        # Amélioration UI
make generate-api       # Intégration API
make generate-security  # Feature sécurité

# Gestion des features
make templates          # Lister les templates
make features          # Lister les features générées
```

### Via CLI direct

```bash
# Mode interactif
node cli.js generate

# Templates spécifiques
node cli.js generate --template crud
node cli.js generate --template ai

# Gestion
node cli.js templates
node cli.js features
```

## 🎨 Types de Templates

### 📋 CRUD Feature
**Idéal pour :** Gestion de données simples avec interface utilisateur

**Génère automatiquement :**
- Schema de base de données avec validation
- Interface CRUD complète (liste, formulaire, recherche)
- API REST avec validation Zod
- Tests unitaires et d'intégration
- Documentation API basique

**Temps estimé :** 1-2 jours

**Exemple d'usage :**
```bash
make generate-crud
# Vous guidera pour créer une gestion d'ingrédients, d'utilisateurs, etc.
```

### 🤖 AI Feature
**Idéal pour :** Fonctionnalités utilisant l'intelligence artificielle

**Génère automatiquement :**
- Intégration avec providers IA (OpenAI, Anthropic, etc.)
- Interface utilisateur pour les interactions IA
- Gestion des prompts et contextes
- Tests d'intégration IA
- Documentation technique

**Temps estimé :** 3-5 jours

**Fonctionnalités supportées :**
- Génération de texte
- Analyse d'images
- Moteur de recommandations
- Traitement du langage naturel
- Analyse de données
- Personalisation

### 🎨 UI Enhancement
**Idéal pour :** Améliorations de l'interface utilisateur

**Génère automatiquement :**
- Composants React optimisés
- Design system cohérent
- Animations et micro-interactions
- Tests d'accessibilité
- Documentation utilisateur

**Temps estimé :** 1-3 jours

### 🔌 API Integration
**Idéal pour :** Intégrations avec services externes

**Génère automatiquement :**
- Clients API avec gestion d'erreurs
- Gestion de l'authentification
- Cache et optimisations
- Tests d'intégration robustes
- Documentation technique

**Temps estimé :** 2-4 jours

### 🔒 Security Feature
**Idéal pour :** Fonctionnalités de sécurité avancées

**Génère automatiquement :**
- Authentification multi-facteurs (2FA)
- Audit logs structurés
- Rate limiting intelligent
- Politiques de sécurité (RLS)
- Tests de sécurité

**Temps estimé :** 2-3 jours

### 📊 Analytics Feature
**Idéal pour :** Analytique et reporting

**Génère automatiquement :**
- Collecte de métriques
- Dashboards interactifs
- Rapports automatisés
- Tests de performance
- Documentation analytique

**Temps estimé :** 2-4 jours

### ⚡ Performance Optimization
**Idéal pour :** Optimisations de performance

**Génère automatiquement :**
- Optimisations de base de données
- Mise en cache avancée
- Lazy loading et code splitting
- Tests de performance
- Monitoring

**Temps estimé :** 1-2 jours

## 🎯 Workflow de Génération

### 1. Choix de la méthode

Lorsque vous lancez `make generate`, trois options s'offrent à vous :

#### 📋 Partir d'un exemple existant
- Adapte une feature déjà implémentée
- Modifie les noms, descriptions et priorités
- Conserve la structure éprouvée
- **Recommandé pour :** Features similaires à l'existant

#### 🔧 Créer depuis un template
- Utilise un pattern prédéfini
- Pose des questions spécifiques au type
- Génère automatiquement la structure
- **Recommandé pour :** Patterns standards

#### ✨ Créer depuis zéro
- Mode interactif complet
- Définition de chaque agent et tâche
- Maximum de flexibilité
- **Recommandé pour :** Features uniques

### 2. Configuration de la feature

Le générateur vous demande :

- **ID de la feature** (kebab-case) : `user-authentication`
- **Nom descriptif** : "Système d'authentification utilisateur"
- **Description détaillée** : Explication complète de la feature
- **Type** : Selon le template choisi
- **Priorité** : low, medium, high, critical
- **Temps estimé** : Format `2d` ou `8h`

### 3. Sélection des agents

Pour chaque feature, vous pouvez choisir quels agents sont nécessaires :

- **🗄️ DB Agent** : Base de données (schemas, migrations, RLS)
- **🎨 UI Agent** : Interface utilisateur (composants, pages)
- **⚙️ Module Agent** : Logique métier (API, services)
- **🧪 QA Agent** : Tests et qualité (unit, integration, e2e)
- **📚 Doc Agent** : Documentation (API, guides utilisateur)

### 4. Définition des tâches

Pour chaque agent sélectionné, le générateur :

- Propose des tâches adaptées au type de feature
- Demande les priorités et temps estimés
- Configure l'utilisation de Context7
- Définit les dépendances entre tâches

### 5. Génération du fichier

Le système crée un fichier JSON dans `specs/` avec :

- Structure validée selon le schema
- Tâches optimisées par agent
- Validation croisée configurée
- Prêt pour l'orchestrateur

## 📁 Structure générée

Chaque feature générée contient :

```json
{
  "project": "NutriCoach",
  "version": "1.0.0", 
  "features": {
    "feature-id": {
      "feature": {
        "name": "Nom de la feature",
        "description": "Description détaillée",
        "type": "crud-feature",
        "priority": "high",
        "estimatedTime": "2d",
        "tags": ["crud", "management"]
      },
      "agents": {
        "db-agent": {
          "required": true,
          "tasks": [
            {
              "id": "schema-creation",
              "type": "schema",
              "description": "Création du schéma",
              "priority": "critical",
              "estimatedTime": "2h",
              "useContext7": true,
              "spec": { /* Configuration spécifique */ }
            }
          ]
        },
        // Autres agents...
      },
      "validation": {
        "crossAgentChecks": [
          {
            "name": "Database-API Consistency",
            "type": "data-consistency",
            "agents": ["db-agent", "module-agent"],
            "rules": ["API endpoints match database schema"]
          }
        ],
        "qualityGates": [
          {
            "name": "Code Coverage",
            "type": "coverage",
            "threshold": 85,
            "blocking": true
          }
        ]
      }
    }
  }
}
```

## 🔄 Utilisation après génération

Une fois votre feature générée :

### 1. Validation
```bash
# Valider la feature générée
make validate SPEC_FILE=specs/ma-feature.json
```

### 2. Simulation
```bash
# Tester en mode dry-run
node cli.js start --feature ma-feature --dry-run --spec specs/ma-feature.json
```

### 3. Exécution
```bash
# Exécuter la feature
node cli.js start --feature ma-feature --spec specs/ma-feature.json
```

### 4. Monitoring
```bash
# Surveiller l'exécution
make status-watch
```

## 🛠️ Personnalisation avancée

### Modification des templates

Les templates sont définis dans `lib/feature-generator.js`. Vous pouvez :

- Ajouter de nouveaux types de features
- Modifier les questions posées
- Personnaliser les structures générées
- Adapter les validations

### Création de templates personnalisés

```javascript
// Dans feature-generator.js
async generateCustomFeature() {
  // Votre logique personnalisée
  const customTemplate = {
    // Structure de votre template
  };
  
  return await this.saveFeature(customTemplate, featureId);
}
```

### Extension des exemples

Ajoutez vos propres exemples dans `templates/feature-examples.json` :

```json
{
  "features": {
    "mon-exemple": {
      "feature": {
        "name": "Mon exemple",
        // Configuration...
      },
      "agents": {
        // Agents et tâches...
      }
    }
  }
}
```

## 📊 Bonnes pratiques

### Naming conventions

- **Feature ID** : `kebab-case` (ex: `user-authentication`)
- **Task ID** : `kebab-case` (ex: `user-schema`, `login-component`)
- **Noms descriptifs** : Clairs et spécifiques

### Estimation des temps

- **Tâches simples** : 1-4h
- **Tâches moyennes** : 4-8h
- **Tâches complexes** : 8h-2d
- **Features complètes** : 1-5d

### Priorités

- **Critical** : Bloquant pour la release
- **High** : Important pour l'UX
- **Medium** : Fonctionnel standard
- **Low** : Nice-to-have

### Dépendances

- Définir clairement les dépendances entre tâches
- Éviter les dépendances circulaires
- Préférer les tâches indépendantes quand possible

## 🧪 Exemples pratiques

### Exemple 1 : Gestion des recettes

```bash
make generate-crud
# Répondre aux questions :
# - Feature ID : recipe-management
# - Entité : Recipe
# - Table : recipes
# - Champs : name, description, ingredients, instructions
# - Inclure recherche : Oui
# - Inclure pagination : Oui
```

### Exemple 2 : Recommandations IA

```bash
make generate-ai
# Répondre aux questions :
# - Feature ID : ai-recommendations
# - Nom : Recommandations nutritionnelles IA
# - Provider : openai
# - Fonctionnalités : recommendation-engine, personalization
```

### Exemple 3 : Dashboard analytics

```bash
make generate --template analytics
# Configuration d'un dashboard de métriques nutritionnelles
```

## 🔍 Dépannage

### Erreurs courantes

**"Template non supporté"**
```bash
# Vérifier les templates disponibles
make templates
```

**"Format ID invalide"**
- Utiliser uniquement des lettres minuscules et tirets
- Commencer par une lettre
- Exemple valide : `my-feature-name`

**"Fichier existe déjà"**
- Le générateur demande confirmation pour écraser
- Ou changer l'ID de la feature

### Debug

```bash
# Mode debug pour plus d'informations
DEBUG=true node cli.js generate
```

## 📚 Ressources

- [Schema de validation](../specs/feature-template.json)
- [Exemples de features](../templates/feature-examples.json)
- [Documentation orchestrateur](./ORCHESTRATOR-GUIDE.md)
- [Guide CLI](./CLI-GUIDE.md)

---

**💡 Astuce :** Commencez par générer quelques features avec les templates pour comprendre la structure, puis adaptez selon vos besoins spécifiques !