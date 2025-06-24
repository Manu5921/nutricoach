# 🥗 NUTRICOACH DEVBOOK - ARCHITECTURE MULTI-AGENTS

## 📋 OVERVIEW PROJET

**Nom :** NutriCoach Anti-Inflammatoire  
**Objectif :** Plateforme de plans alimentaires personnalisés + blog bien-être  
**Stack :** Next.js 15 + Supabase + TypeScript + Tailwind CSS  
**Architecture :** Monorepo avec agents spécialisés orchestrés par Claude Code  
**Déploiement :** Vercel + GitHub Actions CI/CD  

---

## 🏗️ ARCHITECTURE MULTI-AGENTS

### Claude Code Orchestrateur
**Rôle :** Chef d'orchestre, coordination, intégration finale  
**Responsabilités :**
- Décomposition des features complexes en tâches parallèles
- Coordination des agents spécialisés
- Intégration des PRs et validation globale
- Recherche Context7 systématique avant actions critiques

### 🎨 UI Agent - Interface & Design
**Spécialisation :** Composants React, UI/UX, Design System  
**Missions :**
- Création composants React/Next.js réutilisables
- Implémentation design system Tailwind CSS
- Pages et layouts responsifs
- Intégration Radix UI/Shadcn components

### 🗄️ DB Agent - Base de Données
**Spécialisation :** Supabase, schémas, migrations, sécurité  
**Missions :**
- Design schémas PostgreSQL optimisés
- Migrations Supabase versionnées
- Politiques RLS (Row Level Security)
- Relations et contraintes données nutrition

### 🧱 Module Agent - Logique Métier
**Spécialisation :** APIs, services, validation, business logic  
**Missions :**
- Services de génération de menus IA
- APIs REST/GraphQL robustes
- Validation TypeScript stricte
- Intégration Ollama/Claude pour IA

### 📃 Doc Agent - Documentation
**Spécialisation :** Documentation auto, guides, README  
**Missions :**
- Documentation technique automatisée
- Guides d'installation et déploiement
- README détaillés par package
- Exemples d'usage et API docs

### 🧪 QA Agent - Tests & Qualité
**Spécialisation :** Tests, couverture, validation, CI/CD  
**Missions :**
- Tests unitaires Vitest/Jest
- Tests d'intégration Supabase
- Tests e2e Playwright
- Validation TypeScript stricte

---

## 📂 ARCHITECTURE MONOREPO

```
nutricoach/
├── apps/
│   └── web/                      # Next.js 15 App Router
│       ├── app/
│       │   ├── layout.tsx        # Root layout
│       │   ├── page.tsx          # Landing page
│       │   ├── dashboard/        # User dashboard
│       │   ├── blog/             # Blog system
│       │   └── api/              # API routes
│       ├── components/           # UI Components
│       │   ├── ui/               # Base UI components
│       │   ├── forms/            # Forms components
│       │   ├── nutrition/        # Nutrition specific
│       │   └── blog/             # Blog components
│       ├── lib/                  # Client utilities
│       ├── styles/               # Tailwind + globals
│       └── public/               # Static assets
├── packages/
│   ├── ai-services/              # IA Services
│   │   ├── menu-generator.ts     # Menu generation IA
│   │   ├── article-generator.ts  # Article generation IA
│   │   ├── ollama-client.ts      # Ollama integration
│   │   └── claude-client.ts      # Claude API fallback
│   ├── core-nutrition/           # Business Logic
│   │   ├── types/                # TypeScript types
│   │   ├── services/             # Business services
│   │   ├── validators/           # Zod validators
│   │   └── utils/                # Utilities nutrition
│   ├── ui/                       # Design System
│   │   ├── components/           # Shared components
│   │   ├── hooks/                # Custom hooks
│   │   └── styles/               # Tailwind config
│   └── database/                 # Database utilities
│       ├── supabase/             # Supabase client
│       ├── types/                # DB types auto-gen
│       └── queries/              # SQL queries
├── supabase/
│   ├── migrations/               # DB migrations
│   ├── functions/                # Edge functions
│   ├── config.toml               # Supabase config
│   └── seed.sql                  # Initial data
├── scripts/
│   ├── generate-menu.ts          # Menu generation script
│   ├── generate-article.ts       # Article generation script
│   ├── db-validate.ts            # DB validation
│   └── deploy/                   # Deployment scripts
├── dev-agents/                   # Multi-agent system
│   ├── orchestrator.js           # Claude orchestrateur
│   ├── agents/                   # Agents spécialisés
│   └── specs/                    # Feature specifications
└── docs/                         # Documentation
    ├── api/                      # API documentation
    ├── deployment/               # Deploy guides
    └── development/              # Dev guides
```

---

## 🔧 STACK TECHNIQUE DÉTAILLÉ

### Frontend (UI Agent)
- **Framework :** Next.js 15 + App Router + TypeScript
- **Styling :** Tailwind CSS + CSS Variables
- **UI Components :** Radix UI + Shadcn/ui
- **Forms :** React Hook Form + Zod validation
- **State :** Zustand + React Query
- **SEO :** Next.js SEO optimisé + sitemap.xml

### Backend & Database (DB Agent)
- **Database :** Supabase PostgreSQL + Edge Functions
- **Auth :** Supabase Auth + RLS policies
- **Storage :** Supabase Storage pour images recettes
- **Migrations :** Supabase CLI + versioning
- **Cache :** Redis (Upstash) pour performances

### IA & Services (Module Agent)
- **IA Locale :** Ollama (localhost:4003) - modèles nutrition
- **IA Cloud :** Claude API (fallback + analyse complexe)
- **Génération :** Scripts TypeScript pour menus/articles
- **Context7 :** Recherche patterns avant actions
- **Validation :** Zod schemas pour données nutrition

### DevOps & CI/CD (QA Agent)
- **Tests :** Vitest + Testing Library + Playwright
- **Linting :** ESLint + Prettier + TypeScript strict
- **CI/CD :** GitHub Actions + Vercel deployment
- **Monitoring :** Sentry + Vercel Analytics
- **Performance :** Lighthouse CI + Core Web Vitals

---

## 🚀 FONCTIONNALITÉS CLÉS

### 🥗 Système de Menus Anti-Inflammatoires
- **Génération IA :** Personnalisation selon profil utilisateur
- **Base données :** 500+ recettes catégorisées par bienfaits
- **Filtres :** Régimes (végan, sans gluten, keto, etc.)
- **Export :** PDF menus + listes de courses automatiques

### 📝 Blog & Content Management
- **CMS Hybride :** Markdown + Supabase pour flexibilité
- **SEO Optimisé :** Meta tags, Open Graph, JSON-LD
- **Catégories :** Nutrition, Sport, Bien-être, Recettes
- **Génération IA :** Brouillons articles via scripts backoffice

### 👤 Profils Utilisateurs & Personnalisation
- **Auth Supabase :** Signup/login sécurisé + OAuth
- **Préférences :** Objectifs, restrictions alimentaires, allergies
- **Dashboard :** Suivi menus, favoris, historique
- **Notifications :** Rappels menus, nouveaux articles

### 🔍 Recherche & Découverte
- **Recherche full-text :** Recettes, articles, ingrédients
- **Recommandations :** IA basée sur historique utilisateur
- **Tags intelligents :** Auto-tagging contenu
- **Filtres avancés :** Multi-critères nutrition

---

## 🛠️ CONFIGURATION DEVELOPMENT

### Variables d'Environnement
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA Services
OLLAMA_HOST=http://localhost:4003
CLAUDE_API_KEY=
CONTEXT7_API_KEY=

# Database
DATABASE_URL=
REDIS_URL=

# Monitoring
SENTRY_DSN=
VERCEL_TOKEN=
```

### Scripts Utiles
```bash
# Development
npm run dev              # Start Next.js dev server
npm run db:start         # Start Supabase local
npm run ollama:start     # Start Ollama server

# Testing
npm run test             # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# AI Scripts
npm run ai:generate-menu     # Generate sample menus
npm run ai:generate-article  # Generate article draft
npm run ai:validate-content  # Validate AI content

# Build & Deploy
npm run build            # Production build
npm run lint             # Lint code
npm run type-check       # TypeScript check
```

---

## 📊 MÉTRIQUES & KPIs

### Performance
- **Core Web Vitals :** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Lighthouse Score :** > 90 Performance, SEO, Accessibility
- **Bundle Size :** < 500KB initial JS bundle
- **API Response :** < 200ms average response time

### Business
- **Génération Menus :** > 1000 menus/jour générés par IA
- **Engagement Blog :** > 5min temps moyen sur article
- **Conversion :** > 15% visiteurs vers comptes créés
- **Retention :** > 60% utilisateurs actifs 7 jours

### Technique
- **Test Coverage :** > 80% couverture code
- **TypeScript :** 100% typé, zero `any`
- **Uptime :** > 99.9% disponibilité
- **Security :** Zero vulnérabilités critiques

---

## 🔒 SÉCURITÉ & COMPLIANCE

### Authentification & Autorisation
- **Supabase Auth :** JWT + Row Level Security
- **OAuth Providers :** Google, GitHub, Apple
- **2FA Support :** TOTP + SMS optionnel
- **Session Management :** Rotation tokens automatique

### Protection Données
- **RGPD Compliance :** Consentement + droit à l'oubli
- **Chiffrement :** TLS 1.3 + données sensibles chiffrées
- **Validation Input :** Zod + sanitization
- **Rate Limiting :** DDoS protection + API throttling

### Monitoring & Alertes
- **Sentry :** Error tracking + performance monitoring
- **Logs Structurés :** JSON logs + recherche
- **Alertes :** Slack/email pour incidents critiques
- **Audit Trail :** Actions utilisateurs tracées

---

## 🎯 PHASES DE DÉVELOPPEMENT

### Phase 1 : Infrastructure (Semaine 1-2)
- Setup monorepo + Next.js 15
- Configuration Supabase + migrations
- CI/CD GitHub Actions + Vercel
- Architecture multi-agents opérationnelle

### Phase 2 : Core Features (Semaine 3-5)
- Système d'auth + profils utilisateurs
- Base de données recettes + nutrition
- Génération menus IA basique
- Interface utilisateur principale

### Phase 3 : Blog & Content (Semaine 6-7)
- CMS hybride markdown/Supabase
- SEO optimization + sitemap
- Génération articles IA
- Interface administration

### Phase 4 : Advanced Features (Semaine 8-10)
- Personnalisation avancée IA
- Recherche full-text + recommandations
- Export PDF + listes courses
- Notifications + emails

### Phase 5 : Polish & Launch (Semaine 11-12)
- Tests e2e complets + performance
- Documentation utilisateur
- Monitoring + analytics setup
- Déploiement production + rollout

---

## 📚 RESOURCES & DOCUMENTATION

### Context7 Research Mandatory
- **Avant toute action critique :** `context7 search "[action] [technology]"`
- **Patterns nutrition apps :** Recherche architectures similaires
- **Best practices Next.js 15 :** Supabase integration patterns
- **IA nutrition prompts :** Optimisation génération contenu

### Supabase Integration (from Context7 docs)
- **Auth Setup :** Next.js 15 + App Router patterns
- **RLS Policies :** Security-first approach
- **Edge Functions :** Serverless nutrition calculations  
- **Real-time :** Live updates dashboard utilisateur

### Documentation Links
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ⚡ QUICK START COMMANDS

```bash
# Clone & Setup
git clone <repo-url> nutricoach
cd nutricoach
npm install

# Environment
cp .env.example .env.local
# Edit .env.local with your keys

# Database
npm run db:start
npm run db:migrate
npm run db:seed

# Development
npm run dev
npm run ollama:start

# First Menu Generation Test
npm run ai:generate-menu -- --profile="vegetarian,anti-inflammatory"
```

---

**🎯 OBJECTIF :** Environnement de développement optimisé avec architecture multi-agents, Context7 recherche systématique, et déploiement production-ready pour NutriCoach Anti-Inflammatoire.**