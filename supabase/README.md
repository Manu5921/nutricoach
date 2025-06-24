# 🍃 NutriCoach Database Architecture

## 📊 Vue d'Ensemble

NutriCoach utilise Supabase (PostgreSQL) pour une architecture de base de données optimisée pour les applications de nutrition anti-inflammatoire. Cette documentation détaille le schéma, les meilleures pratiques de sécurité, et les patterns d'utilisation.

## 🏗️ Architecture des Tables

### 1. **user_profiles** - Profils Utilisateurs Enrichis
```sql
-- Stocke les données utilisateurs avec préférences nutritionnelles
-- RLS: Chaque utilisateur ne peut voir que son propre profil
```

**Caractéristiques Clés:**
- Calculs nutritionnels personnalisés (BMR, besoins caloriques)
- Préférences alimentaires multiples (végétarien, sans gluten, etc.)
- Objectifs de santé spécialisés (anti-inflammatoire, etc.)
- Restrictions et allergies alimentaires
- Cibles nutritionnelles automatiques ou manuelles

### 2. **ingredients** - Base de Données Nutritionnelle
```sql
-- Master database d'ingrédients avec données USDA
-- RLS: Lecture publique, création restreinte aux utilisateurs authentifiés
```

**Données Spécialisées:**
- **Score anti-inflammatoire** (-10 à +10) basé sur la recherche
- **Composés antioxydants** spécifiques (curcumine, quercétine, etc.)
- **Micronutriments clés** (Vitamines C, D, E, Oméga-3/6)
- **Index glycémique** pour la gestion de la glycémie
- **Portions communes** en JSONB pour flexibilité

### 3. **recipes** - Recettes avec Calculs Automatiques
```sql
-- Recettes avec calculs nutritionnels en temps réel
-- RLS: Recettes publiques + recettes privées par utilisateur
```

**Fonctionnalités Avancées:**
- **Calcul automatique** des valeurs nutritionnelles depuis les ingrédients
- **Score anti-inflammatoire** calculé en temps réel
- **Catégorisation automatique** (anti-inflammatoire/neutre/inflammatoire)
- **Tags diététiques** flexibles (végan, sans gluten, etc.)
- **Système de notation** communautaire

### 4. **recipe_ingredients** - Junction Table Optimisée
```sql
-- Liaison recettes-ingrédients avec quantités normalisées
-- RLS: Hérite des permissions de la recette parente
```

**Normalisation des Données:**
- **Quantités en grammes** pour calculs précis
- **Notes de préparation** spécifiques par ingrédient
- **Ordre des ingrédients** dans les instructions

### 5. **categories** - Système de Classification Flexible
```sql
-- Catégorisation hiérarchique pour ingrédients, recettes, conditions
-- RLS: Données publiques en lecture seule
```

## 🔐 Sécurité Row Level Security (RLS)

### Patterns de Sécurité Implémentés

#### 1. **Isolation des Données Utilisateur**
```sql
create policy "Users can view their own profile"
    on public.user_profiles for select
    using ( (select auth.uid()) = id );
```

#### 2. **Données Publiques avec Contributions Contrôlées**
```sql
-- Ingrédients: lecture publique, ajouts par utilisateurs authentifiés
create policy "Anyone can view ingredients"
    on public.ingredients for select
    using ( true );

create policy "Authenticated users can suggest ingredients"
    on public.ingredients for insert
    to authenticated
    with check ( verified = false );
```

#### 3. **Contenu Mixte Public/Privé**
```sql
-- Recettes: publiques + privées par utilisateur
create policy "Anyone can view public recipes"
    on public.recipes for select
    using ( is_public = true );

create policy "Users can view their own recipes"
    on public.recipes for select
    using ( created_by = (select auth.uid()) );
```

## ⚡ Fonctions et Triggers Automatiques

### 1. **Calculs Nutritionnels en Temps Réel**
```sql
-- Fonction qui recalcule automatiquement la nutrition des recettes
create or replace function calculate_recipe_nutrition(recipe_uuid uuid)
returns jsonb
```

**Déclencheurs:**
- Ajout/modification/suppression d'ingrédients dans une recette
- Mise à jour automatique des valeurs nutritionnelles
- Calcul du score anti-inflammatoire moyen

### 2. **Gestion des Timestamps**
```sql
-- Trigger automatique pour updated_at
create trigger update_recipes_updated_at
    before update on public.recipes
    for each row execute function update_updated_at_column();
```

## 📈 Index de Performance

### Index Strategiques Créés

```sql
-- Recherche d'ingrédients anti-inflammatoires
create index idx_ingredients_anti_inflammatory_score 
    on public.ingredients(anti_inflammatory_score);

-- Filtrage de recettes par tags diététiques
create index idx_recipes_dietary_tags 
    on public.recipes using gin(dietary_tags);

-- Recherche par préférences utilisateur
create index idx_user_profiles_dietary_preferences 
    on public.user_profiles using gin(dietary_preferences);
```

## 🚀 Démarrage Rapide

### 1. **Installation et Setup**
```bash
# Cloner et naviguer vers le projet
cd nutricoach

# Initialiser la base de données
chmod +x supabase/init.sh
./supabase/init.sh
```

### 2. **Variables d'Environnement**
```bash
# Copier et configurer l'environnement
cp .env.example .env.local

# Configurer les URLs Supabase locales
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. **Vérification du Setup**
```bash
# Tester l'API REST
curl http://localhost:54321/rest/v1/ingredients?select=name,anti_inflammatory_score&anti_inflammatory_score=gte.7

# Accéder au Dashboard
open http://localhost:54323
```

## 💻 Utilisation avec TypeScript

### Types Générés Automatiquement
```typescript
import { Database } from './supabase/types'

// Types de base
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Ingredient = Database['public']['Tables']['ingredients']['Row']
type Recipe = Database['public']['Tables']['recipes']['Row']

// Types composites pour requêtes complexes
interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: (RecipeIngredient & {
    ingredients: Ingredient;
  })[];
}
```

### Client Supabase Typé
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 🔍 Exemples de Requêtes

### 1. **Rechercher des Ingrédients Anti-Inflammatoires**
```typescript
const { data: ingredients } = await supabase
  .from('ingredients')
  .select('*')
  .gte('anti_inflammatory_score', 7)
  .order('anti_inflammatory_score', { ascending: false })
```

### 2. **Récupérer une Recette avec ses Ingrédients**
```typescript
const { data: recipe } = await supabase
  .from('recipes')
  .select(`
    *,
    recipe_ingredients (
      *,
      ingredients (*)
    )
  `)
  .eq('id', recipeId)
  .single()
```

### 3. **Filtrer par Préférences Utilisateur**
```typescript
const { data: recipes } = await supabase
  .from('recipes')
  .select('*')
  .contains('dietary_tags', ['gluten_free'])
  .eq('inflammation_category', 'anti_inflammatory')
```

## 📊 Données de Test Incluses

### Ingrédients Anti-Inflammatoires (25+)
- **Superfoods:** Curcuma, Huile d'olive extra vierge, Saumon sauvage
- **Légumes:** Épinards, Brocolis, Chou frisé
- **Fruits:** Myrtilles, Cerises acidulées, Fraises
- **Noix/Graines:** Noix, Graines de chia, Amandes

### Recettes Complètes (3)
1. **Bowl de Saumon au Curcuma Doré** - Score anti-inflammatoire élevé
2. **Smoothie Bowl aux Baies** - Riche en antioxydants
3. **Soupe de Lentilles Méditerranéenne** - Haute teneur en fibres

### Profil Utilisateur Démo
- Femme, 35 ans, objectif anti-inflammatoire
- Préférences: Sans gluten, méditerranéen
- Allergies: Fruits de mer
- Cibles nutritionnelles calculées

## 🔧 Maintenance et Evolution

### Scripts de Maintenance
```bash
# Regénérer les types TypeScript
supabase gen types typescript --local > supabase/types.generated.ts

# Créer une nouvelle migration
supabase db diff -f add_new_feature

# Sauvegarder les données
supabase db dump > backup.sql
```

### Évolutions Prévues
- **Phase 2:** Tracking des repas et progrès
- **Phase 3:** Plans de repas automatisés
- **Phase 4:** Intégration IA pour recommandations
- **Phase 5:** Fonctionnalités communautaires

## 🎯 Points d'Attention

### Sécurité
- ✅ RLS activé sur toutes les tables
- ✅ Politiques restrictives par défaut
- ✅ Validation des données avec contraintes CHECK
- ✅ Timestamps automatiques pour audit

### Performance
- ✅ Index optimisés pour requêtes communes
- ✅ Calculs nutritionnels mis en cache
- ✅ Requêtes typées pour éviter les erreurs
- ✅ Pagination automatique avec Supabase

### Qualité des Données
- ✅ Données USDA vérifiées pour nutrition
- ✅ Scores anti-inflammatoires basés sur recherche
- ✅ Validation des contraintes au niveau DB
- ✅ Sources de données traçables

## 📚 Ressources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [USDA FoodData Central](https://fdc.nal.usda.gov/)

### Outils de Développement
- [Supabase CLI](https://supabase.com/docs/reference/cli)
- [pgAdmin](https://www.pgadmin.org/) pour administration avancée
- [Postman Collection](./postman/) pour tester l'API

---

**🎉 Architecture créée par le DB Agent spécialisé Supabase selon les meilleures pratiques Context7**