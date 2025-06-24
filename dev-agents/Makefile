# 🤖 NutriCoach Multi-Agent System - Makefile
# Commandes simplifiées pour l'orchestration des agents

.PHONY: help setup install test validate clean start status monitor dashboard report generate templates features cache-stats cache-clear cache-search

# Configuration
FEATURE ?= 
SPEC_FILE ?= specs/nutricoach-features.json
FORMAT ?= md
QUERY ?= react

# Couleurs pour l'affichage
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Afficher l'aide
	@echo "$(BLUE)🤖 NutriCoach Multi-Agent System$(RESET)"
	@echo "$(BLUE)================================$(RESET)"
	@echo ""
	@echo "$(YELLOW)📋 COMMANDES PRINCIPALES:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)💡 EXEMPLES:$(RESET)"
	@echo "  make start FEATURE=nutrition-tracking    # Démarrer une feature spécifique"
	@echo "  make test                                # Tests complets du système"
	@echo "  make monitor                             # Monitoring en temps réel"
	@echo "  make report FORMAT=html                  # Rapport en HTML"

setup: ## Initialiser le système (première utilisation)
	@echo "$(BLUE)🚀 Setup du système multi-agents...$(RESET)"
	@npm install
	@node setup.js
	@echo "$(GREEN)✅ Setup terminé!$(RESET)"

install: setup ## Alias pour setup

test: ## Exécuter tous les tests du système
	@echo "$(BLUE)🧪 Tests du système...$(RESET)"
	@node test-system.js
	@echo "$(GREEN)✅ Tests terminés$(RESET)"

validate: ## Valider les spécifications de features
	@echo "$(BLUE)🔍 Validation des spécifications...$(RESET)"
	@node cli.js validate --file $(SPEC_FILE)

list: ## Lister toutes les features disponibles
	@echo "$(BLUE)📋 Features disponibles:$(RESET)"
	@node cli.js list --spec $(SPEC_FILE)

start: ## Démarrer l'orchestration d'une feature
ifdef FEATURE
	@echo "$(BLUE)🚀 Démarrage feature: $(FEATURE)$(RESET)"
	@node cli.js start --feature $(FEATURE) --spec $(SPEC_FILE)
else
	@echo "$(BLUE)🚀 Démarrage interactif...$(RESET)"
	@node cli.js start --spec $(SPEC_FILE)
endif

start-dry: ## Simulation (dry-run) d'une feature
ifdef FEATURE
	@echo "$(YELLOW)🏃 Simulation feature: $(FEATURE)$(RESET)"
	@node cli.js start --feature $(FEATURE) --dry-run --spec $(SPEC_FILE)
else
	@echo "$(RED)❌ Spécifiez une feature: make start-dry FEATURE=nom-feature$(RESET)"
endif

status: ## Afficher le statut des agents
	@echo "$(BLUE)📊 Statut des agents:$(RESET)"
	@node cli.js status

status-watch: ## Monitoring du statut en continu
	@echo "$(BLUE)👀 Surveillance continue (Ctrl+C pour arrêter)$(RESET)"
	@node cli.js status --watch

monitor: ## Monitoring avancé en temps réel
	@echo "$(BLUE)📊 Monitoring avancé (Ctrl+C pour arrêter)$(RESET)"
	@node cli.js monitor

dashboard: ## Dashboard de monitoring interactif
	@echo "$(BLUE)📊 Dashboard de monitoring interactif$(RESET)"
	@node cli.js dashboard

clean: ## Nettoyer les caches et fichiers temporaires
	@echo "$(BLUE)🧹 Nettoyage...$(RESET)"
	@node cli.js clean
	@echo "$(GREEN)✅ Nettoyage terminé$(RESET)"

clean-all: ## Nettoyage complet (incluant node_modules)
	@echo "$(BLUE)🧹 Nettoyage complet...$(RESET)"
	@node cli.js clean --all
	@rm -rf node_modules
	@rm -rf logs/*
	@rm -rf tmp/*
	@echo "$(GREEN)✅ Nettoyage complet terminé$(RESET)"

report: ## Générer un rapport d'activité
	@echo "$(BLUE)📊 Génération rapport $(FORMAT)...$(RESET)"
	@node cli.js report --format $(FORMAT)
	@echo "$(GREEN)✅ Rapport généré$(RESET)"

# Génération de features
generate: ## Générer une nouvelle feature (mode interactif)
	@echo "$(BLUE)🎯 Générateur de features...$(RESET)"
	@node cli.js generate

generate-crud: ## Générer une feature CRUD
	@echo "$(BLUE)📋 Génération feature CRUD...$(RESET)"
	@node cli.js generate --template crud

generate-ai: ## Générer une feature IA
	@echo "$(BLUE)🤖 Génération feature IA...$(RESET)"
	@node cli.js generate --template ai

generate-ui: ## Générer une feature UI
	@echo "$(BLUE)🎨 Génération feature UI...$(RESET)"
	@node cli.js generate --template ui

generate-api: ## Générer une feature API
	@echo "$(BLUE)🔌 Génération feature API...$(RESET)"
	@node cli.js generate --template api

generate-security: ## Générer une feature sécurité
	@echo "$(BLUE)🔒 Génération feature sécurité...$(RESET)"
	@node cli.js generate --template security

templates: ## Lister les templates disponibles
	@echo "$(BLUE)📋 Templates disponibles:$(RESET)"
	@node cli.js templates

features: ## Lister toutes les features générées
	@echo "$(BLUE)📊 Features générées:$(RESET)"
	@node cli.js features

# Gestion du cache Context7
cache-stats: ## Afficher les statistiques du cache Context7
	@echo "$(BLUE)📊 Statistiques du cache Context7:$(RESET)"
	@node cli.js cache --stats

cache-clear: ## Nettoyer le cache Context7
	@echo "$(BLUE)🧹 Nettoyage du cache Context7:$(RESET)"
	@node cli.js cache --clear

cache-search: ## Rechercher dans le cache Context7 (usage: make cache-search QUERY="search term")
	@echo "$(BLUE)🔍 Recherche dans le cache Context7:$(RESET)"
	@node cli.js cache --search "$(QUERY)"

# Agents individuels
db-agent: ## Exécuter le DB Agent individuellement
	@echo "$(BLUE)🗄️ DB Agent...$(RESET)"
	@node cli.js agent --type db

ui-agent: ## Exécuter l'UI Agent individuellement
	@echo "$(BLUE)🎨 UI Agent...$(RESET)"
	@node cli.js agent --type ui

module-agent: ## Exécuter le Module Agent individuellement
	@echo "$(BLUE)⚙️ Module Agent...$(RESET)"
	@node cli.js agent --type module

qa-agent: ## Exécuter le QA Agent individuellement
	@echo "$(BLUE)🧪 QA Agent...$(RESET)"
	@node cli.js agent --type qa

doc-agent: ## Exécuter le Doc Agent individuellement
	@echo "$(BLUE)📚 Doc Agent...$(RESET)"
	@node cli.js agent --type doc

# Tests spécifiques
test-specs: ## Tester uniquement la validation des specs
	@echo "$(BLUE)🧪 Test validation specs...$(RESET)"
	@node test-system.js "validation"

test-agents: ## Tester uniquement l'initialisation des agents
	@echo "$(BLUE)🧪 Test initialisation agents...$(RESET)"
	@node test-system.js "initialisation"

test-communication: ## Tester la communication inter-agents
	@echo "$(BLUE)🧪 Test communication...$(RESET)"
	@node test-system.js "communication"

# Exemples et démos
demo: ## Démo complète du système
	@echo "$(BLUE)🎬 Démo du système multi-agents$(RESET)"
	@echo "$(YELLOW)1. Validation des specs...$(RESET)"
	@make validate
	@echo ""
	@echo "$(YELLOW)2. Liste des features...$(RESET)"
	@make list
	@echo ""
	@echo "$(YELLOW)3. Simulation d'une feature...$(RESET)"
	@make start-dry FEATURE=nutrition-tracking
	@echo ""
	@echo "$(GREEN)🎉 Démo terminée!$(RESET)"

example-simple: ## Exécuter l'exemple simple
	@echo "$(BLUE)📝 Exemple simple...$(RESET)"
	@node cli.js start --feature "nutrition-tracking" --dry-run

example-ai: ## Exécuter l'exemple avec IA
	@echo "$(BLUE)🤖 Exemple avec IA...$(RESET)"
	@node cli.js start --feature "recipe-recommendation-ai" --dry-run

# Développement
dev: ## Mode développement avec rechargement automatique
	@echo "$(BLUE)🔧 Mode développement...$(RESET)"
	@npm run dev

lint: ## Vérifier le code (ESLint si configuré)
	@echo "$(BLUE)🔍 Vérification du code...$(RESET)"
	@npm run lint 2>/dev/null || echo "$(YELLOW)⚠️ ESLint non configuré$(RESET)"

# Documentation
docs: ## Générer la documentation
	@echo "$(BLUE)📚 Génération documentation...$(RESET)"
	@node cli.js agent --type doc --file examples/doc-task-example.json

readme: ## Afficher le README
	@echo "$(BLUE)📖 README:$(RESET)"
	@cat README.md

# Utilitaires
check: ## Vérifier l'état du système
	@echo "$(BLUE)🔍 Vérification système...$(RESET)"
	@echo "$(YELLOW)Node.js:$(RESET) $(shell node --version)"
	@echo "$(YELLOW)NPM:$(RESET) $(shell npm --version)"
	@echo "$(YELLOW)Dossier:$(RESET) $(shell pwd)"
	@echo "$(YELLOW)Agents:$(RESET) $(shell ls agents/ | wc -l | tr -d ' ') fichiers"
	@echo "$(YELLOW)Specs:$(RESET) $(shell ls specs/ | wc -l | tr -d ' ') fichiers"

logs: ## Afficher les logs récents
	@echo "$(BLUE)📝 Logs récents:$(RESET)"
	@find logs/ -name "*.log" -exec tail -n 10 {} \; 2>/dev/null || echo "$(YELLOW)⚠️ Aucun log trouvé$(RESET)"

# Installation globale
global: ## Installer le CLI globalement
	@echo "$(BLUE)🌐 Installation globale du CLI...$(RESET)"
	@npm link
	@echo "$(GREEN)✅ CLI installé globalement: nutricoach-agents$(RESET)"

# Configuration
config: ## Afficher/créer la configuration
	@echo "$(BLUE)⚙️ Configuration système:$(RESET)"
	@echo "$(YELLOW)Variables d'environnement recommandées:$(RESET)"
	@echo "  export CONTEXT7_API_KEY=\"your-api-key\""
	@echo "  export OPENAI_API_KEY=\"your-openai-key\""
	@echo "  export ANTHROPIC_API_KEY=\"your-anthropic-key\""
	@echo "  export OLLAMA_BASE_URL=\"http://localhost:11434\""
	@echo ""
	@echo "$(YELLOW)Variables actuelles:$(RESET)"
	@echo "  CONTEXT7_API_KEY: $(if $(CONTEXT7_API_KEY),✅ Définie,❌ Non définie)"
	@echo "  OPENAI_API_KEY: $(if $(OPENAI_API_KEY),✅ Définie,❌ Non définie)"
	@echo "  ANTHROPIC_API_KEY: $(if $(ANTHROPIC_API_KEY),✅ Définie,❌ Non définie)"

# Par défaut, afficher l'aide
.DEFAULT_GOAL := help