# 🏗️ Architecture packages/core - NutriCoach

## 📊 Vue d'ensemble

Architecture modulaire extensible pour l'écosystème NutriCoach avec packages métier réutilisables pour projets multiples (nutrition, économie, fitness, etc.).

### 🎯 Objectifs
- **Modularité** : Packages indépendants et composables
- **Extensibilité** : Support multi-domaines métier
- **Réutilisabilité** : Code centralisé et versionné
- **Maintenabilité** : Séparation claire des responsabilités
- **Developer Experience** : Types TypeScript complets, configs standardisées

## 📦 Structure des Packages

```
packages/
├── 📦 core-services/        # Services métier universels
├── 🔧 shared-types/         # Types TypeScript centralisés
├── 🛠️ utils/               # Utilitaires de manipulation
├── ⚙️ config/              # Configurations partagées
├── 🗄️ database/            # Helpers base de données
├── 🎨 ui/                  # Composants UI réutilisables
├── 🍽️ core-nutrition/      # Services nutrition spécialisés
└── 📝 blog-preview/        # Module blog extensible
```

## 🏛️ Architecture Clean avec Separation of Concerns

### Layer 1: Types & Validation (@nutricoach/shared-types)
```typescript
// Types communs pour tous projets
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Schémas validation Zod
export const UserProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  // ...
});
```

### Layer 2: Business Logic (@nutricoach/core-services)
```typescript
// Services métier réutilisables
export class DataFetchingService<T> {
  async fetchWithRetry(endpoint: string): Promise<T> {
    // Logic universelle avec cache et retry
  }
}

export class PlanBuilderService {
  calculateNutrition(metrics: PersonalMetrics): NutritionTargets {
    // Calculateur nutrition extensible
  }
}
```

### Layer 3: Data Access (@nutricoach/database)
```typescript
// Helpers base de données universels
export class QueryBuilder<T> {
  paginate(page: number, limit: number): this {
    // Pagination universelle
  }
  
  search(query: string, fields: string[]): this {
    // Recherche full-text
  }
}
```

### Layer 4: Utils & Config (@nutricoach/utils, @nutricoach/config)
```typescript
// Utilitaires cross-domaines
export const formatCurrency = (amount: number, locale: string) => {
  // Pour projets économie
};

export const formatNutrition = (value: number, unit: string) => {
  // Pour projets nutrition
};
```

## 📦 Détail des Packages

### 🔧 @nutricoach/core-services

**Services métier universels adaptables**

#### Data Fetching
```typescript
import { createApiClient } from '@nutricoach/core-services/data-fetching';

// Client API universel avec cache et retry
const nutritionClient = createApiClient({
  baseUrl: 'https://api.nutrition.com',
  cache: { enabled: true, ttl: 300000 },
  retryAttempts: 3
});

const economicsClient = createApiClient({
  baseUrl: 'https://api.economics.com',
  cache: { enabled: true, ttl: 600000 },
  retryAttempts: 2
});
```

#### Plan Builder
```typescript
import { NutritionCalculator } from '@nutricoach/core-services/plan-builder';

const calculator = new NutritionCalculator('mifflinStJeor');
const targets = calculator.calculateNutritionTargets(metrics, goals);
```

#### User Management
```typescript
import { ProfileService } from '@nutricoach/core-services/user-management';

const profileService = new ProfileService();
await profileService.updatePreferences(userId, {
  dietary: ['vegan', 'gluten-free'],
  notifications: { email: true, push: false }
});
```

#### Content Management
```typescript
import { ContentService } from '@nutricoach/core-services/content-management';

const cms = new ContentService();
await cms.createContent({
  type: 'recipe',
  category: 'healthy',
  tags: ['low-carb', 'high-protein']
});
```

#### Notification System
```typescript
import { NotificationService } from '@nutricoach/core-services/notification-system';

const notifications = new NotificationService({
  providers: ['email', 'push', 'sms'],
  templates: new Map()
});
```

### 🔧 @nutricoach/shared-types

**Types TypeScript centralisés avec validation Zod**

#### Types API
```typescript
// Contracts API universels
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}
```

#### Types Nutrition
```typescript
// Types spécifiques nutrition
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  // ... micronutriments
}

export interface Recipe extends BaseEntity {
  name: string;
  ingredients: RecipeIngredient[];
  nutrition: NutritionInfo;
  difficulty: DifficultyLevel;
}
```

#### Types Utilisateur
```typescript
// Profils utilisateur extensibles
export interface UserProfile extends BaseEntity {
  personalInfo: PersonalInfo;
  preferences: UserPreferences;
  goals: UserGoals;
  settings: UserSettings;
}

// Extensible pour différents domaines
export interface UserGoals {
  nutrition?: NutritionGoals;
  economics?: EconomicsGoals;
  fitness?: FitnessGoals;
}
```

#### Schémas Validation
```typescript
import { z } from 'zod';

export const RecipeSchema = z.object({
  name: z.string().min(2).max(100),
  servings: z.number().positive(),
  prepTime: z.number().positive(),
  ingredients: z.array(IngredientSchema).min(1)
});
```

### 🛠️ @nutricoach/utils

**Utilitaires universels pour manipulation de données**

#### Date & Time
```typescript
import { formatDate, addDays, isWeekend } from '@nutricoach/utils/date';

// Formatage timezone-aware
const formatted = formatDate(new Date(), 'fr-FR', 'Europe/Paris');

// Calculs de dates
const nextWeek = addDays(new Date(), 7);
const isWeekendDay = isWeekend(new Date());
```

#### Formatting
```typescript
import { 
  formatCurrency, 
  formatNumber, 
  formatPhoneNumber 
} from '@nutricoach/utils/formatting';

// Multi-locale formatting
const price = formatCurrency(29.99, 'EUR', 'fr-FR');
const nutrition = formatNumber(125.5, { decimals: 1, unit: 'g' });
const phone = formatPhoneNumber('+33123456789', 'FR');
```

#### Validation
```typescript
import { 
  validateEmail, 
  validatePassword, 
  validateUrl 
} from '@nutricoach/utils/validation';

const isValidEmail = validateEmail('user@example.com');
const passwordStrength = validatePassword('myPassword123!');
```

#### Performance
```typescript
import { 
  debounce, 
  throttle, 
  memoize 
} from '@nutricoach/utils/performance';

// Optimisation performance
const debouncedSearch = debounce(searchFunction, 300);
const throttledScroll = throttle(scrollHandler, 16);
const memoizedCalculation = memoize(expensiveFunction);
```

### ⚙️ @nutricoach/config

**Configurations partagées pour cohérence projet**

#### ESLint Config
```javascript
// packages/config/eslint.config.js
module.exports = {
  extends: [
    '@nutricoach/config/eslint',
    // Règles TypeScript, React, Next.js préonfigurées
  ],
  rules: {
    // Règles personnalisées NutriCoach
  }
};
```

#### Tailwind Config
```javascript
// Design system NutriCoach
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          500: '#10b981',
          900: '#064e3b'
        },
        // Palette complète marque
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

#### TypeScript Config
```json
{
  "extends": "@nutricoach/config/typescript",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/ui": ["../ui/components"]
    }
  }
}
```

### 🗄️ @nutricoach/database

**Helpers base de données avec Supabase**

#### Client Universel
```typescript
import { createSupabaseClient } from '@nutricoach/database/client';

const supabase = createSupabaseClient({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_ANON_KEY,
  healthCheck: true
});
```

#### Query Helpers
```typescript
import { QueryBuilder } from '@nutricoach/database/helpers';

const recipes = await new QueryBuilder('recipes')
  .select('*')
  .filter('category', 'eq', 'healthy')
  .range(0, 10)
  .orderBy('created_at', 'desc')
  .execute();
```

#### Migrations
```typescript
import { MigrationRunner } from '@nutricoach/database/migrations';

const migrationRunner = new MigrationRunner(supabase);
await migrationRunner.runPending();
```

## 🚀 Utilisation Pratique

### Installation
```bash
# Dans un projet NutriCoach
pnpm add @nutricoach/core-services @nutricoach/shared-types
pnpm add @nutricoach/utils @nutricoach/database
pnpm add -D @nutricoach/config
```

### Configuration projet
```json
// package.json
{
  "extends": "@nutricoach/config/typescript",
  "scripts": {
    "lint": "eslint . --config @nutricoach/config/eslint",
    "format": "prettier --config @nutricoach/config/prettier"
  }
}
```

### Exemple d'implémentation
```typescript
// apps/nutrition-app/src/services/meal-planner.ts
import { PlanBuilderService } from '@nutricoach/core-services/plan-builder';
import { NutritionGoals, PersonalMetrics } from '@nutricoach/shared-types/nutrition';
import { formatNutrition } from '@nutricoach/utils/formatting';

export class MealPlannerService extends PlanBuilderService {
  async generateWeeklyPlan(
    userId: string,
    metrics: PersonalMetrics,
    goals: NutritionGoals
  ) {
    const targets = this.calculateNutritionTargets(metrics, goals);
    
    // Logic spécifique meal planning
    const plan = await this.buildMealPlan(targets);
    
    return {
      ...plan,
      formattedTargets: {
        calories: formatNutrition(targets.macros.calories, 'kcal'),
        protein: formatNutrition(targets.macros.protein, 'g'),
        // ...
      }
    };
  }
}
```

## 🌐 Extensibilité Multi-Projets

### Nouveau Projet Économie
```typescript
// apps/economics-app/src/services/portfolio-analyzer.ts
import { DataFetchingService } from '@nutricoach/core-services/data-fetching';
import { createApiClient } from '@nutricoach/core-services/data-fetching';
import { formatCurrency } from '@nutricoach/utils/formatting';

// Réutilisation infrastructure avec nouveau domaine
export class PortfolioService extends DataFetchingService {
  private economicsClient = createApiClient({
    baseUrl: 'https://api.economics.com',
    cache: { enabled: true, ttl: 600000 }
  });

  async analyzePortfolio(investments: Investment[]) {
    const marketData = await this.economicsClient.get('/market-data');
    
    // Logic spécifique économie
    return {
      totalValue: formatCurrency(calculateTotal(investments), 'EUR'),
      // ...
    };
  }
}
```

### Extension Types
```typescript
// packages/shared-types/src/economics/types.ts
export interface Investment extends BaseEntity {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  marketData: MarketData;
}

// packages/shared-types/index.ts
export * from './nutrition/types.js';
export * from './economics/types.js';
export * from './fitness/types.js';
```

## 📊 Avantages Architecture

### 1. Modularité
- **Packages indépendants** : Chaque package peut être développé et versionné séparément
- **Composition flexible** : Combinaison de packages selon besoins projet
- **Maintenance isolée** : Corrections bugs sans impact autres packages

### 2. Réutilisabilité
- **Code DRY** : Logique métier centralisée et partagée
- **Consistency** : Même patterns et conventions partout
- **Productivity** : Développement plus rapide nouveaux projets

### 3. Extensibilité
- **Multi-domaines** : Nutrition, économie, fitness, etc.
- **Nouveaux packages** : Facile d'ajouter de nouveaux domaines
- **Évolution** : Architecture qui grandit avec besoins

### 4. Developer Experience
- **TypeScript complet** : Autocomplete et validation types
- **Configs partagées** : ESLint, Prettier, Tailwind standardisés
- **Documentation** : Exemples et guides d'utilisation
- **Testing** : Outils test intégrés

## 🔄 Versioning & Releases

### Stratégie Versioning
```json
{
  "@nutricoach/core-services": "1.2.0",
  "@nutricoach/shared-types": "1.1.5",
  "@nutricoach/utils": "1.0.8",
  "@nutricoach/config": "1.0.3",
  "@nutricoach/database": "1.1.2"
}
```

### Release Process
1. **Tests automatisés** sur tous packages
2. **Versioning sémantique** (major.minor.patch)
3. **Changelog automatique** avec conventional commits
4. **Documentation** mise à jour automatiquement

## 🔮 Évolution Future

### Packages Prévus
- `@nutricoach/ai-services` - Services IA/ML
- `@nutricoach/analytics` - Analytics et reporting
- `@nutricoach/payments` - Gestion paiements
- `@nutricoach/fitness` - Services fitness et sport
- `@nutricoach/economics` - Services analyse économique

### Améliorations
- **Tree shaking** optimisé pour bundle size
- **Lazy loading** des modules lourds
- **Performance monitoring** intégré
- **A/B testing** framework
- **Internationalisation** (i18n) complète

---

**Cette architecture modulaire donne une base solide et extensible pour l'écosystème NutriCoach, facilitant le développement de nouveaux projets tout en maintenant cohérence et qualité du code.**