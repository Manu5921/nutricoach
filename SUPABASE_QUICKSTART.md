# 🚀 NutriCoach Supabase Quick Start

## ⚡ Setup en 3 minutes

### 1. Initialisation
```bash
# Donne les permissions d'exécution
chmod +x supabase/init.sh

# Lance l'initialisation complète
./supabase/init.sh
```

### 2. Configuration Environment
```bash
# Copie le template d'environnement
cp .env.example .env.local

# Configure les variables (auto-remplies après init)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<généré-automatiquement>
```

### 3. Test rapide
```bash
# Test de l'API
curl "http://localhost:54321/rest/v1/ingredients?select=name,anti_inflammatory_score&anti_inflammatory_score=gte.7" \
  -H "apikey: <your-anon-key>"

# Ouvre le Dashboard
open http://localhost:54323
```

## 🔧 Commands Utiles

### Gestion du serveur
```bash
supabase start    # Démarre Supabase
supabase stop     # Arrête Supabase  
supabase status   # Affiche le statut
supabase logs     # Affiche les logs
```

### Développement
```bash
# Réinitialise la DB avec les dernières migrations
supabase db reset

# Génère les types TypeScript
supabase gen types typescript --local > types.ts

# Crée une nouvelle migration
supabase db diff -f nom_migration
```

## 📊 Données de Test Disponibles

### 🥗 Ingrédients Anti-Inflammatoires
- **25+ ingrédients** avec scores scientifiques
- **Données USDA** vérifiées
- **Composés antioxydants** détaillés

### 🍽️ Recettes Complètes
1. **Bowl de Saumon au Curcuma** (score: 7.8/10)
2. **Smoothie Bowl aux Baies** (score: 8.2/10)  
3. **Soupe de Lentilles Méditerranéenne** (score: 6.5/10)

### 👤 Profil Utilisateur Demo
- Email: `demo@nutricoach.com`
- Objectif: Anti-inflammatoire
- Préférences: Sans gluten, Méditerranéen

## 🔍 Requêtes d'Exemple

### TypeScript avec Client Supabase
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Top ingrédients anti-inflammatoires
const { data: ingredients } = await supabase
  .from('ingredients')
  .select('name, anti_inflammatory_score, category')
  .gte('anti_inflammatory_score', 7)
  .order('anti_inflammatory_score', { ascending: false })

// Recettes pour utilisateur avec préférences
const { data: recipes } = await supabase
  .from('recipes')
  .select('*, recipe_ingredients(*, ingredients(*))')
  .contains('dietary_tags', ['gluten_free'])
  .eq('inflammation_category', 'anti_inflammatory')
```

## 🔐 Sécurité RLS

### Patterns Implémentés
- ✅ **Isolation utilisateur** - Chaque utilisateur voit uniquement ses données
- ✅ **Données publiques** - Ingrédients et recettes publiques accessibles
- ✅ **Contributions contrôlées** - Utilisateurs peuvent suggérer du contenu
- ✅ **Validation automatique** - Contraintes DB pour intégrité

### Test de Sécurité
```sql
-- En tant qu'utilisateur authentifié
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid';

-- Ne retourne que les données autorisées
SELECT * FROM user_profiles; -- Seulement le profil de l'utilisateur
SELECT * FROM recipes WHERE created_by = auth.uid(); -- Seulement ses recettes
```

## 🎯 Fonctionnalités Clés

### 🧮 Calculs Automatiques
- **Nutrition des recettes** calculée depuis les ingrédients
- **Scores anti-inflammatoires** mis à jour en temps réel
- **Catégorisation automatique** (anti-inflammatoire/neutre/inflammatoire)

### 📈 Performance
- **Index optimisés** pour recherches fréquentes
- **Triggers efficaces** pour cohérence des données
- **Requêtes typées** avec TypeScript

### 🔄 Évolutivité
- **Schema déclaratif** pour migrations simples
- **Structure modulaire** pour nouvelles fonctionnalités
- **APIs standards** REST + GraphQL

## 🚨 Troubleshooting

### Port déjà utilisé
```bash
supabase stop
lsof -ti:54321 | xargs kill -9  # Si port bloqué
supabase start
```

### Reset complet
```bash
supabase stop
rm -rf supabase/.branches  # Reset l'état local
supabase start
```

### Données corrompues
```bash
supabase db reset --debug  # Force reset avec debug
```

## 📚 Prochaines Étapes

1. **Authentification** - Intégrer Supabase Auth
2. **UI Components** - Créer les composants de recettes
3. **Search & Filter** - Implémenter la recherche avancée
4. **Meal Planning** - Ajouter la planification de repas
5. **Progress Tracking** - Tracking nutrition et inflammation

---

**🎉 Database créée par le DB Agent spécialisé Supabase**
**📖 Documentation complète: `supabase/README.md`**