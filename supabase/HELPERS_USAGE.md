# 🛠️ NutriCoach Client Helpers - Guide d'Utilisation

## 📦 Import des Helpers

```typescript
// Import complet
import nutricoach from './supabase/client-helpers'

// Import sélectif
import { ingredientHelpers, recipeHelpers, userHelpers } from './supabase/client-helpers'

// Import des types
import type { Recipe, Ingredient, UserProfile } from './supabase/client-helpers'
```

## 🥗 Ingredient Helpers

### Recherche d'ingrédients anti-inflammatoires
```typescript
// Top 10 ingrédients anti-inflammatoires
const { data: topIngredients } = await nutricoach.ingredients.getTopAntiInflammatory(10)

// Affichage
topIngredients?.forEach(ingredient => {
  console.log(`${ingredient.name}: ${ingredient.anti_inflammatory_score}/10`)
})
```

### Recherche par nom ou catégorie
```typescript
// Recherche générale
const { data: results } = await nutricoach.ingredients.searchIngredients('curcuma')

// Recherche dans une catégorie spécifique
const { data: spices } = await nutricoach.ingredients.searchIngredients('ginger', 'herbs_spices')

// Tous les légumes
const { data: vegetables } = await nutricoach.ingredients.getByCategory('vegetables')
```

### Détails nutritionnels complets
```typescript
const { data: ingredient } = await nutricoach.ingredients.getNutritionDetails(ingredientId)

if (ingredient) {
  console.log('Portions courantes:', ingredient.common_serving_sizes)
  console.log('Composés antioxydants:', ingredient.antioxidant_compounds)
  console.log('Oméga-3:', ingredient.omega3_g_per_100g, 'g/100g')
}
```

## 🍽️ Recipe Helpers

### Récupérer une recette complète
```typescript
const { data: recipe } = await nutricoach.recipes.getRecipeWithIngredients(recipeId)

if (recipe) {
  console.log(`Recette: ${recipe.title}`)
  console.log(`Score anti-inflammatoire: ${recipe.anti_inflammatory_score}`)
  
  // Parcourir les ingrédients
  recipe.recipe_ingredients?.forEach(ri => {
    console.log(`- ${ri.quantity} ${ri.unit} de ${ri.ingredients.name}`)
  })
}
```

### Filtrer par préférences alimentaires
```typescript
// Recettes végétariennes et sans gluten
const { data: recipes } = await nutricoach.recipes.getByDietaryPreferences(
  ['vegetarian', 'gluten_free'], 
  true // Anti-inflammatoire uniquement
)

// Recettes rapides (moins de 30 min)
const { data: quickRecipes } = await nutricoach.recipes.getQuickRecipes(30)

// Recettes pour le petit-déjeuner
const { data: breakfastRecipes } = await nutricoach.recipes.getByMealType('breakfast')
```

### Éviter certains ingrédients
```typescript
// Obtenir les IDs des ingrédients à éviter
const { data: shellfishIngredients } = await nutricoach.ingredients.searchIngredients('shellfish')
const shellfishIds = shellfishIngredients?.map(i => i.id) || []

// Recettes sans fruits de mer
const { data: safeRecipes } = await nutricoach.recipes.getRecipesAvoidingIngredients(shellfishIds)
```

## 👤 User Profile Helpers

### Gestion du profil utilisateur
```typescript
// Récupérer le profil actuel
const { data: profile } = await nutricoach.users.getCurrentUserProfile()

// Mettre à jour le profil
await nutricoach.users.updateProfile({
  dietary_preferences: ['vegetarian', 'gluten_free'],
  food_allergies: ['nuts'],
  primary_goal: 'anti_inflammatory'
})

// Créer un profil initial pour un nouvel utilisateur
await nutricoach.users.createInitialProfile({
  email: 'user@example.com',
  full_name: 'John Doe',
  dietary_preferences: ['mediterranean'],
  primary_goal: 'weight_loss'
})
```

### Recommandations personnalisées
```typescript
// Recettes adaptées au profil utilisateur
const { data: personalizedRecipes } = await nutricoach.users.getPersonalizedRecipes(10)

personalizedRecipes?.forEach(recipe => {
  console.log(`${recipe.title} - Score: ${recipe.anti_inflammatory_score}`)
})
```

## 🔍 Search Helpers

### Recherche globale
```typescript
const results = await nutricoach.search.globalSearch('turmeric')

console.log('Ingrédients trouvés:', results.ingredients.length)
console.log('Recettes trouvées:', results.recipes.length)
```

### Recherche avancée de recettes
```typescript
const { data: filteredRecipes } = await nutricoach.search.advancedRecipeFilter({
  dietary_tags: ['vegan', 'gluten_free'],
  max_prep_time: 45,
  difficulty_level: 'easy',
  anti_inflammatory_only: true,
  search_term: 'salmon'
})
```

## 📊 Utility Functions

### Calcul des besoins caloriques
```typescript
const dailyCalories = nutricoach.utils.calculateDailyCalories({
  age: 30,
  gender: 'female',
  height_cm: 165,
  weight_kg: 65,
  activity_level: 'moderately_active'
})

console.log(`Besoins quotidiens: ${dailyCalories} calories`)
```

### Formatage des valeurs nutritionnelles
```typescript
const formattedProtein = nutricoach.utils.formatNutrition(25.4, 'g', 1)
// Output: "25.4g"

const formattedCalories = nutricoach.utils.formatNutrition(387, ' cal', 0)
// Output: "387 cal"
```

### Couleurs et emojis pour l'UI
```typescript
const color = nutricoach.utils.getInflammationColor('anti_inflammatory')
// Output: "#22c55e" (green)

const emoji = nutricoach.utils.getDifficultyEmoji('easy')
// Output: "👶"
```

## 📡 Real-time Subscriptions

### S'abonner aux changements de recettes
```typescript
const subscription = nutricoach.subscriptions.subscribeToRecipes((payload) => {
  console.log('Changement détecté:', payload)
  
  if (payload.eventType === 'INSERT') {
    console.log('Nouvelle recette:', payload.new)
  }
})

// Se désabonner plus tard
subscription.unsubscribe()
```

### S'abonner aux changements de profil
```typescript
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  const profileSub = nutricoach.subscriptions.subscribeToUserProfile(
    user.id,
    (payload) => {
      console.log('Profil mis à jour:', payload.new)
      // Mettre à jour l'UI en conséquence
    }
  )
}
```

## 🎯 Exemples d'Intégration React

### Hook personnalisé pour ingrédients
```typescript
import { useState, useEffect } from 'react'

export function useAntiInflammatoryIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIngredients() {
      const { data } = await nutricoach.ingredients.getTopAntiInflammatory(20)
      setIngredients(data || [])
      setLoading(false)
    }
    
    fetchIngredients()
  }, [])

  return { ingredients, loading }
}
```

### Component de recherche de recettes
```typescript
import { useState } from 'react'

export function RecipeSearch() {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])

  const handleSearch = async () => {
    const results = await nutricoach.search.globalSearch(query)
    setRecipes(results.recipes)
  }

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher des recettes..."
      />
      <button onClick={handleSearch}>Rechercher</button>
      
      {recipes.map(recipe => (
        <div key={recipe.id}>
          <h3>{recipe.title}</h3>
          <p>Score: {recipe.anti_inflammatory_score}/10</p>
        </div>
      ))}
    </div>
  )
}
```

### Context pour l'utilisateur
```typescript
import { createContext, useContext, useEffect, useState } from 'react'

const UserContext = createContext<{
  profile: UserProfile | null
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}>({
  profile: null,
  updateProfile: async () => {}
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data } = await nutricoach.users.getCurrentUserProfile()
      setProfile(data)
    }
    
    loadProfile()
  }, [])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const { data } = await nutricoach.users.updateProfile(updates)
    if (data) setProfile(data)
  }

  return (
    <UserContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
```

## ⚡ Bonnes Pratiques

### Gestion d'Erreur
```typescript
try {
  const { data, error } = await nutricoach.recipes.getRecipeWithIngredients(id)
  
  if (error) {
    console.error('Erreur Supabase:', error)
    return
  }
  
  if (!data) {
    console.log('Aucune recette trouvée')
    return
  }
  
  // Utiliser les données
  setRecipe(data)
} catch (err) {
  console.error('Erreur réseau:', err)
}
```

### Cache et Performance
```typescript
// Utiliser React Query pour le cache
import { useQuery } from '@tanstack/react-query'

export function useTopIngredients() {
  return useQuery({
    queryKey: ['top-ingredients'],
    queryFn: () => nutricoach.ingredients.getTopAntiInflammatory(10),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Type Safety
```typescript
// Toujours typer les réponses
interface RecipeWithNutrition extends Recipe {
  nutritionCalculated?: boolean
}

const enhanceRecipe = async (recipe: Recipe): Promise<RecipeWithNutrition> => {
  const { data: nutrition } = await nutricoach.recipes.calculateNutrition(recipe.id)
  
  return {
    ...recipe,
    nutritionCalculated: nutrition !== null
  }
}
```

---

**🎯 Ces helpers couvrent 90% des besoins frontend pour NutriCoach !**