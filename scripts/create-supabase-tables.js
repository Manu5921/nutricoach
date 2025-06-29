#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = 'https://sgombrccebqutpompbjj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgzOTk1NSwiZXhwIjoyMDY2NDE1OTU1fQ.C96QktQzrTbZ4lm1gQPT6sJ9doSaIpXrHakxiyw2MXU'

console.log('🚀 Création des tables Supabase NutriCoach...\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Créer les tables de base directement
async function createTables() {
  console.log('📋 Création des tables essentielles...')

  // 1. User profiles
  console.log('  👤 Création table user_profiles...')
  try {
    const { error: profileError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email text UNIQUE NOT NULL,
          full_name text,
          avatar_url text,
          age integer CHECK (age > 0 AND age < 150),
          gender text CHECK (gender IN ('male', 'female', 'other')),
          height_cm integer CHECK (height_cm > 50 AND height_cm < 300),
          weight_kg numeric(5,2) CHECK (weight_kg > 20 AND weight_kg < 500),
          activity_level text CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
          primary_goal text CHECK (primary_goal IN ('weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'anti_inflammatory')),
          health_conditions text[],
          dietary_preferences text[],
          food_allergies text[],
          disliked_foods text[],
          daily_calories_target integer,
          daily_protein_target_g numeric(6,2),
          daily_carbs_target_g numeric(6,2),
          daily_fat_target_g numeric(6,2),
          daily_fiber_target_g numeric(5,2),
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        );
      `
    })
    
    if (profileError) {
      console.log(`    ❌ ${profileError.message}`)
    } else {
      console.log('    ✅ user_profiles créée')
    }
  } catch (err) {
    console.log(`    ❌ Exception: ${err.message}`)
  }

  // 2. Categories
  console.log('  🏷️ Création table categories...')
  try {
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.categories (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          description text,
          parent_id uuid REFERENCES public.categories(id),
          created_at timestamptz DEFAULT now() NOT NULL
        );
      `
    })
    
    if (!error) console.log('    ✅ categories créée')
    else console.log(`    ❌ ${error.message}`)
  } catch (err) {
    console.log(`    ❌ Exception: ${err.message}`)
  }

  // 3. Ingredients
  console.log('  🥕 Création table ingredients...')
  try {
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.ingredients (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          category text,
          calories_per_100g integer,
          protein_per_100g numeric(5,2),
          carbs_per_100g numeric(5,2),
          fat_per_100g numeric(5,2),
          fiber_per_100g numeric(5,2),
          anti_inflammatory_score integer DEFAULT 0,
          is_allergen boolean DEFAULT false,
          allergen_types text[],
          dietary_flags text[],
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        );
      `
    })
    
    if (!error) console.log('    ✅ ingredients créée')
    else console.log(`    ❌ ${error.message}`)
  } catch (err) {
    console.log(`    ❌ Exception: ${err.message}`)
  }

  // 4. Recipes
  console.log('  📖 Création table recipes...')
  try {
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.recipes (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          description text,
          instructions text[],
          prep_time_minutes integer,
          cook_time_minutes integer,
          servings integer DEFAULT 1,
          difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
          cuisine_type text,
          meal_type text[],
          dietary_tags text[],
          total_calories integer,
          protein_per_serving numeric(5,2),
          carbs_per_serving numeric(5,2),
          fat_per_serving numeric(5,2),
          fiber_per_serving numeric(5,2),
          anti_inflammatory_score integer DEFAULT 0,
          created_by uuid REFERENCES auth.users(id),
          is_public boolean DEFAULT true,
          image_url text,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        );
      `
    })
    
    if (!error) console.log('    ✅ recipes créée')
    else console.log(`    ❌ ${error.message}`)
  } catch (err) {
    console.log(`    ❌ Exception: ${err.message}`)
  }

  // 5. Recipe ingredients junction table
  console.log('  🔗 Création table recipe_ingredients...')
  try {
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
          ingredient_id uuid REFERENCES public.ingredients(id),
          quantity numeric(8,2) NOT NULL,
          unit text NOT NULL,
          notes text,
          created_at timestamptz DEFAULT now() NOT NULL
        );
      `
    })
    
    if (!error) console.log('    ✅ recipe_ingredients créée')
    else console.log(`    ❌ ${error.message}`)
  } catch (err) {
    console.log(`    ❌ Exception: ${err.message}`)
  }
}

// Activer RLS
async function enableRLS() {
  console.log('\n🔒 Configuration Row Level Security...')
  
  const tables = ['user_profiles', 'recipes', 'recipe_ingredients']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('exec', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      })
      
      if (!error) {
        console.log(`  ✅ RLS activé pour ${table}`)
      } else {
        console.log(`  ❌ RLS ${table}: ${error.message}`)
      }
    } catch (err) {
      console.log(`  ❌ RLS ${table}: ${err.message}`)
    }
  }
}

// Insérer quelques données de base
async function seedBasicData() {
  console.log('\n🌱 Chargement des données de base...')
  
  // Vérifier si on a déjà des ingrédients
  const { data: existingIngredients } = await supabase
    .from('ingredients')
    .select('id')
    .limit(1)

  if (existingIngredients && existingIngredients.length > 0) {
    console.log('  ℹ️ Données déjà présentes, seed ignoré')
    return
  }

  // Insérer quelques ingrédients de base
  console.log('  🥕 Ajout d\'ingrédients de base...')
  
  const basicIngredients = [
    {
      name: 'Saumon',
      category: 'Poisson',
      calories_per_100g: 208,
      protein_per_100g: 25.4,
      fat_per_100g: 12.4,
      anti_inflammatory_score: 9,
      dietary_flags: ['high_protein', 'omega3']
    },
    {
      name: 'Brocolis',
      category: 'Légume',
      calories_per_100g: 34,
      protein_per_100g: 2.8,
      carbs_per_100g: 7,
      fiber_per_100g: 2.6,
      anti_inflammatory_score: 8,
      dietary_flags: ['vegetarian', 'vegan', 'high_fiber']
    },
    {
      name: 'Avocat',
      category: 'Fruit',
      calories_per_100g: 160,
      fat_per_100g: 14.7,
      fiber_per_100g: 6.7,
      anti_inflammatory_score: 7,
      dietary_flags: ['vegetarian', 'vegan', 'healthy_fats']
    }
  ]

  const { error: seedError } = await supabase
    .from('ingredients')
    .insert(basicIngredients)

  if (!seedError) {
    console.log(`  ✅ ${basicIngredients.length} ingrédients ajoutés`)
  } else {
    console.log(`  ❌ Seed error: ${seedError.message}`)
  }
}

// Test final
async function testTables() {
  console.log('\n🔍 Vérification finale...')
  
  const tables = ['user_profiles', 'ingredients', 'recipes', 'recipe_ingredients', 'categories']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`  ❌ Table ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ Table ${table}: OK`)
      }
    } catch (err) {
      console.log(`  ❌ Table ${table}: ${err.message}`)
    }
  }

  // Test final avec ingrédients
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('name')
    .limit(3)

  if (!ingredientsError && ingredients) {
    console.log(`  📊 ${ingredients.length} ingrédients disponibles`)
  }
}

// Exécution principale
async function main() {
  try {
    await createTables()
    await enableRLS()
    await seedBasicData()
    await testTables()

    console.log('\n🎉 Configuration Supabase terminée !')
    console.log('🔗 Test maintenant: https://nutricoach-production.up.railway.app/api/health')
    console.log('📝 Puis: https://nutricoach-production.up.railway.app/signup')

  } catch (error) {
    console.error('\n💥 Erreur critique:', error.message)
    process.exit(1)
  }
}

main()