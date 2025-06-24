# 🏗️ NutriCoach Architecture Guide

## 📊 Vue d'ensemble

NutriCoach utilise une architecture **packages/core** extensible conçue pour supporter plusieurs types de projets (nutrition, économie, santé, etc.). Cette architecture favorise la réutilisabilité, la maintenabilité et la scalabilité.

## 🎯 Principes architecturaux

### 1. **Separation of Concerns**
- Chaque package a une responsabilité claire et définie
- Les services métier sont séparés des utilitaires
- La logique d'interface est découplée de la logique métier

### 2. **Extensibilité**
- Types génériques réutilisables pour différents domaines
- Configurations modulaires et composables
- Services avec interfaces standardisées

### 3. **Type Safety**
- TypeScript strict pour tous les packages
- Types partagés centralisés
- Validation runtime avec Zod

### 4. **Performance**
- Cache intelligent avec TTL
- Lazy loading des modules
- Optimisations de bundle

## 📦 Structure des packages

```
packages/
├── core-services/          # Services métier universels
├── shared-types/           # Types TypeScript partagés
├── utils/                  # Utilitaires universels
├── config/                 # Configurations extensibles
├── ui/                     # Composants UI réutilisables
├── database/               # Helpers base de données
├── core-nutrition/         # Logique métier nutrition (héritage)
└── blog-preview/           # Module blog (exemple)
```

## 🔧 Packages Core

### `@nutricoach/core-services`

**Responsabilité**: Services métier universels et patterns réutilisables

#### Services inclus:
- **Data Fetching**: API client avec retry, cache, et rate limiting
- **Notification System**: Email, push, SMS, webhooks avec templates
- **Session Management**: Authentification multi-provider avec MFA
- **Plan Builder**: Planification générique (nutrition, finances, etc.)
- **User Management**: Gestion utilisateurs et permissions
- **Content Management**: CMS headless pour contenu dynamique

#### Exemple d'utilisation:
```typescript
import { 
  createNotificationService, 
  createSessionService, 
  ApiClient 
} from '@nutricoach/core-services';

// Service de notifications multi-canal
const notificationService = createNotificationService({
  providers: {
    email: emailProvider,
    push: pushProvider,
    sms: smsProvider,
  },
  rateLimiting: { enabled: true, maxPerHour: 50 },
  analytics: { enabled: true, trackDelivery: true },
});

// Envoi de notification avec template
await notificationService.send({
  type: 'welcome',
  recipient: 'user@example.com',
  channels: ['email', 'push'],
  template: 'welcome_nutrition',
  templateData: {
    name: 'John',
    goalType: 'Weight Loss',
    targetCalories: '2000'
  }
});
```

### `@nutricoach/shared-types`

**Responsabilité**: Types TypeScript centralisés et extensibles

#### Modules inclus:
- **Common**: Types de base (BaseEntity, TimestampedEntity, etc.)
- **API**: Interfaces pour requêtes/réponses HTTP
- **Nutrition**: Types spécifiques nutrition et santé
- **Economics**: Types finance et économie
- **System**: Types administration et monitoring
- **User**: Gestion utilisateurs et permissions
- **Content**: CMS et gestion de contenu
- **Validation**: Schémas Zod pour validation

#### Exemple d'utilisation:
```typescript
import type { 
  Asset, 
  Portfolio, 
  NutritionInfo, 
  Recipe,
  SystemHealth 
} from '@nutricoach/shared-types';

// Types pour application financière
const portfolio: Portfolio = {
  id: 'portfolio_1',
  name: 'Growth Portfolio',
  currency: 'USD',
  currentValue: 50000,
  positions: [...],
  riskProfile: { tolerance: 'moderate', timeHorizon: 'long_term' }
};

// Types pour application nutrition
const recipe: Recipe = {
  id: 'recipe_1',
  name: 'Protein Smoothie',
  nutrition: { calories: 300, protein: 25, carbohydrates: 15, fat: 8 },
  mealTypes: ['breakfast', 'post_workout'],
  difficulty: 'easy'
};
```

### `@nutricoach/utils`

**Responsabilité**: Utilitaires universels et fonctions helpers

#### Modules inclus:
- **Date**: Manipulation et formatage de dates
- **Formatting**: Formatage de nombres, devises, etc.
- **Validation**: Validateurs et sanitizers
- **Performance**: Optimisations et mesures
- **Testing**: Utilitaires pour tests
- **Cryptography**: Hachage, chiffrement, tokens
- **HTTP**: Helpers pour requêtes HTTP et APIs
- **Data**: Traitement et transformation de données

#### Exemple d'utilisation:
```typescript
import { 
  dataUtils,
  crypto,
  httpUtils,
  formatCurrency,
  validateEmail 
} from '@nutricoach/utils';

// Manipulation de données
const grouped = dataUtils.Array.groupBy(users, user => user.role);
const sorted = dataUtils.Array.sortBy(products, p => p.price, p => p.name);

// Cryptographie sécurisée
const hashedPassword = await crypto.hashPassword(password);
const isValid = await crypto.verifyPassword(password, hashedPassword);
const token = crypto.generateSecureToken(32);

// Utilitaires HTTP
const apiResponse = httpUtils.Response.createResponse(data, 200, 'Success');
const corsHeaders = httpUtils.CORS.createCORSHeaders({
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true
});
```

### `@nutricoach/config`

**Responsabilité**: Configurations extensibles pour différents types de projets

#### Configurations incluses:
- **TypeScript**: Configs pour Next.js, Node.js, React Native, etc.
- **ESLint**: Rules pour React, Node.js, librairies, tests
- **Tailwind**: Thèmes nutrition, économie, mobile, etc.
- **Prettier**: Formatage standardisé
- **Vitest**: Configuration de tests

#### Exemple d'utilisation:
```typescript
// tsconfig.json pour app Next.js
{
  "extends": "@nutricoach/config/typescript/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// eslint.config.js pour app React
module.exports = {
  extends: ['@nutricoach/config/eslint/react'],
  rules: {
    // Overrides spécifiques
  }
};

// tailwind.config.js pour app nutrition
module.exports = {
  presets: ['@nutricoach/config/tailwind/nutrition'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Customisations
    }
  }
};
```

## 🚀 Patterns d'utilisation

### 1. **Nouveau projet nutrition**

```bash
# Installation des packages core
pnpm add @nutricoach/core-services @nutricoach/shared-types @nutricoach/utils

# Configuration
cp @nutricoach/config/typescript/nextjs.json tsconfig.json
cp @nutricoach/config/eslint/react.js eslint.config.js
cp @nutricoach/config/tailwind/nutrition.js tailwind.config.js
```

```typescript
// app/layout.tsx
import { createNotificationService } from '@nutricoach/core-services';
import type { NutritionGoals } from '@nutricoach/shared-types';

const notificationService = createNutritionNotificationService({
  providers: { email: emailProvider },
  analytics: { enabled: true }
});
```

### 2. **Nouveau projet économie**

```typescript
// services/portfolio.ts
import type { Portfolio, Asset, MarketData } from '@nutricoach/shared-types/economics';
import { createApiClient } from '@nutricoach/core-services/data-fetching';

const marketApi = createApiClient({
  baseUrl: 'https://api.market-data.com',
  cache: { enabled: true, ttl: 300000 },
  retryAttempts: 3
});

export class PortfolioService {
  async getMarketData(symbol: string): Promise<MarketData> {
    const response = await marketApi.get(`/quotes/${symbol}`);
    return response.data;
  }
  
  async calculatePortfolioValue(portfolio: Portfolio): Promise<number> {
    // Logique de calcul...
  }
}
```

### 3. **Service générique avec types extensibles**

```typescript
// services/generic-planner.ts
import type { BaseEntity } from '@nutricoach/shared-types/common';

interface PlanItem extends BaseEntity {
  name: string;
  type: string;
  data: Record<string, any>;
}

interface Plan<T extends PlanItem> extends BaseEntity {
  items: T[];
  schedule: Date[];
  metadata: Record<string, any>;
}

export class GenericPlanService<T extends PlanItem> {
  async createPlan(items: T[]): Promise<Plan<T>> {
    // Logique générique de planification
  }
  
  async optimizePlan(plan: Plan<T>): Promise<Plan<T>> {
    // Algorithmes d'optimisation
  }
}

// Utilisation pour nutrition
type MealPlanItem = PlanItem & {
  type: 'meal';
  data: { calories: number; macros: any };
};

const mealPlanner = new GenericPlanService<MealPlanItem>();

// Utilisation pour finances
type InvestmentPlanItem = PlanItem & {
  type: 'investment';
  data: { amount: number; risk: string };
};

const investmentPlanner = new GenericPlanService<InvestmentPlanItem>();
```

## 🔄 Intégration avec projets existants

### Migration progressive

1. **Étape 1**: Installation des packages core
```bash
pnpm add @nutricoach/shared-types @nutricoach/utils
```

2. **Étape 2**: Remplacement des types existants
```typescript
// Avant
interface User {
  id: string;
  email: string;
  // ...
}

// Après
import type { User } from '@nutricoach/shared-types/user';
```

3. **Étape 3**: Utilisation des utilitaires
```typescript
// Avant
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(price);

// Après
import { formatCurrency } from '@nutricoach/utils/formatting';
const formatted = formatCurrency(price, 'USD');
```

4. **Étape 4**: Intégration des services
```typescript
// Remplacement progressif des services existants
import { createNotificationService } from '@nutricoach/core-services';
```

## 🧪 Testing Strategy

### 1. **Tests unitaires par package**
```typescript
// packages/utils/src/data/__tests__/array-utils.test.ts
import { describe, it, expect } from 'vitest';
import { ArrayUtils } from '../array-utils';

describe('ArrayUtils', () => {
  it('should group array by key', () => {
    const users = [
      { name: 'John', role: 'admin' },
      { name: 'Jane', role: 'user' },
      { name: 'Bob', role: 'admin' }
    ];
    
    const grouped = ArrayUtils.groupBy(users, user => user.role);
    
    expect(grouped.admin).toHaveLength(2);
    expect(grouped.user).toHaveLength(1);
  });
});
```

### 2. **Tests d'intégration**
```typescript
// apps/web/__tests__/integration/services.test.ts
import { createNotificationService } from '@nutricoach/core-services';
import type { NotificationMessage } from '@nutricoach/shared-types';

describe('Notification Service Integration', () => {
  it('should send notification with template', async () => {
    const service = createNotificationService(testConfig);
    
    const result = await service.send({
      type: 'welcome',
      recipient: 'test@example.com',
      template: 'welcome_nutrition',
      templateData: { name: 'Test User' },
      channels: ['email']
    });
    
    expect(result[0].success).toBe(true);
  });
});
```

### 3. **Tests E2E**
```typescript
// apps/web/__tests__/e2e/nutrition-flow.test.ts
import { test, expect } from '@playwright/test';

test('nutrition goal setting flow', async ({ page }) => {
  await page.goto('/onboarding');
  
  // Test utilisant les types partagés et services
  await page.fill('[data-testid=weight-input]', '70');
  await page.selectOption('[data-testid=goal-select]', 'weight_loss');
  
  await page.click('[data-testid=submit-button]');
  
  await expect(page.locator('[data-testid=success-message]')).toBeVisible();
});
```

## 📈 Performance et optimisation

### 1. **Lazy loading des services**
```typescript
// Chargement à la demande des services lourds
const loadNotificationService = () => 
  import('@nutricoach/core-services/notification-system');

// Utilisation
const { createNotificationService } = await loadNotificationService();
```

### 2. **Cache intelligent**
```typescript
import { createApiClient } from '@nutricoach/core-services/data-fetching';

const api = createApiClient({
  baseUrl: process.env.API_URL,
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
  timeout: 10000,
  retryAttempts: 3
});

// Cache automatique avec invalidation
const nutritionData = await api.get('/nutrition/foods', {
  cache: true,
  cacheTtl: 3600000 // 1 heure pour données statiques
});
```

### 3. **Optimisation des bundles**
```typescript
// vite.config.ts / next.config.js
export default {
  build: {
    rollupOptions: {
      external: ['@nutricoach/core-services/heavy-module']
    }
  }
};

// Utilisation dynamique
const heavyModule = await import('@nutricoach/core-services/heavy-module');
```

## 🔒 Sécurité

### 1. **Cryptographie sécurisée**
```typescript
import { crypto } from '@nutricoach/utils/cryptography';

// Hachage de mots de passe
const hashedPassword = await crypto.hashPassword(password);

// Génération de tokens sécurisés
const sessionToken = crypto.generateSecureToken(32);
const apiKey = crypto.generateApiKey('ak');

// HMAC pour vérification d'intégrité
const signature = crypto.hmacSha256(data, secret);
const isValid = crypto.verifyHmac(data, secret, signature);
```

### 2. **Validation stricte**
```typescript
import { z } from 'zod';
import type { User } from '@nutricoach/shared-types/user';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(13).max(120)
});

// Validation runtime
const validatedData = CreateUserSchema.parse(formData);
```

### 3. **Sessions sécurisées**
```typescript
import { createSessionService } from '@nutricoach/core-services/session-management';

const sessionService = createSessionService({
  security: {
    tokenExpiry: 24 * 60 * 60 * 1000, // 24h
    maxSessions: 5,
    requireMFA: true,
    passwordStrength: {
      minLength: 12,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true
    }
  }
});
```

## 🚀 Déploiement et CI/CD

### 1. **Build optimisé**
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### 2. **Versioning des packages**
```bash
# Release des packages core
pnpm changeset add
pnpm changeset version
pnpm changeset publish
```

### 3. **Tests de non-régression**
```yaml
# .github/workflows/test.yml
name: Test packages core
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - run: pnpm test:integration
```

## 📚 Documentation et guides

### 1. **Documentation par package**
- Chaque package contient un README détaillé
- Exemples d'utilisation pour chaque fonction
- API reference générée automatiquement

### 2. **Guides thématiques**
- Guide migration vers packages core
- Best practices pour nouveaux projets
- Patterns avancés et optimisations

### 3. **Playground et exemples**
```typescript
// examples/nutrition-app/src/main.ts
import { createApp } from './app';
import { nutritionServices } from './services';

// Exemple complet d'application nutrition
const app = createApp({
  services: nutritionServices,
  theme: 'nutrition'
});
```

## 🔮 Roadmap et évolution

### Prochaines étapes:
1. **Packages additionnels**:
   - `@nutricoach/ai-services` (IA et ML)
   - `@nutricoach/real-time` (WebSockets, SSE)
   - `@nutricoach/analytics` (Tracking et métriques)

2. **Amélirations**:
   - Support React Native / Expo
   - Plugins Vite/Webpack
   - Templates de projets

3. **Écosystème**:
   - CLI pour génération de code
   - Storybook components
   - Documentation interactive

## 🤝 Contribution

### Guidelines:
1. Suivre les patterns établis
2. Tests obligatoires pour nouvelles fonctionnalités
3. Documentation mise à jour
4. Backward compatibility maintenue

### Process:
1. Fork et branche feature
2. Développement avec tests
3. PR avec description détaillée
4. Review et merge

---

Cette architecture packages/core offre une base solide et extensible pour développer des applications modernes, réutilisables et maintenables dans l'écosystème NutriCoach et au-delà.