# 🗄️ Configuration Manuelle Supabase - NutriCoach

## 🚨 **PROBLÈME IDENTIFIÉ**
Les tables de la base de données n'existent pas, empêchant l'authentification de fonctionner.

## ✅ **SOLUTION IMMÉDIATE (5 minutes)**

### **1. Accéder au Dashboard Supabase**
1. Aller sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Ouvrir le projet `sgombrccebqutpompbjj`
3. Cliquer sur **"SQL Editor"** dans le menu gauche

### **2. Exécuter le SQL de Création des Tables**

Copier-coller ce code dans l'éditeur SQL et cliquer **"Run"** :

```sql
-- =============================================
-- Tables essentielles NutriCoach
-- =============================================

-- 1. Profiles utilisateurs
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

-- 2. Catégories d'aliments
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Ingrédients
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

-- 4. Recettes
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

-- 5. Liaison recettes-ingrédients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES public.ingredients(id),
  quantity numeric(8,2) NOT NULL,
  unit text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

### **3. Configurer Row Level Security**

Exécuter ce deuxième script :

```sql
-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Activer RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Policies pour user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policies pour recipes
CREATE POLICY "Users can view public recipes" 
  ON public.recipes FOR SELECT 
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create recipes" 
  ON public.recipes FOR INSERT 
  TO authenticated 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own recipes" 
  ON public.recipes FOR UPDATE 
  USING (created_by = auth.uid());

-- Policies pour recipe_ingredients
CREATE POLICY "Users can manage ingredients for their recipes" 
  ON public.recipe_ingredients FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE id = recipe_id AND created_by = auth.uid()
  ));

-- Permissions publiques pour les tables de référence
GRANT SELECT ON public.ingredients TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.ingredients TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
```

### **4. Insérer Données de Base**

Exécuter ce troisième script pour avoir quelques ingrédients :

```sql
-- =============================================
-- Données de base
-- =============================================

-- Ingrédients anti-inflammatoires
INSERT INTO public.ingredients (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, anti_inflammatory_score, dietary_flags) VALUES
('Saumon', 'Poisson', 208, 25.4, 0, 12.4, 0, 9, ARRAY['high_protein', 'omega3']),
('Brocolis', 'Légume', 34, 2.8, 7, 0.4, 2.6, 8, ARRAY['vegetarian', 'vegan', 'high_fiber']),
('Avocat', 'Fruit', 160, 2, 8.5, 14.7, 6.7, 7, ARRAY['vegetarian', 'vegan', 'healthy_fats']),
('Épinards', 'Légume', 23, 2.9, 3.6, 0.4, 2.2, 8, ARRAY['vegetarian', 'vegan', 'iron_rich']),
('Myrtilles', 'Fruit', 57, 0.7, 14.5, 0.3, 2.4, 9, ARRAY['vegetarian', 'vegan', 'antioxidants']),
('Noix', 'Oléagineux', 654, 15.2, 13.7, 65.2, 6.7, 6, ARRAY['vegetarian', 'vegan', 'healthy_fats']),
('Huile d''olive', 'Huile', 884, 0, 0, 100, 0, 8, ARRAY['vegetarian', 'vegan', 'healthy_fats']),
('Curcuma', 'Épice', 354, 7.8, 64.9, 9.9, 21, 10, ARRAY['vegetarian', 'vegan', 'anti_inflammatory']),
('Quinoa', 'Céréale', 368, 14.1, 64.2, 6.1, 7, 5, ARRAY['vegetarian', 'vegan', 'gluten_free']),
('Chia', 'Graine', 486, 16.5, 42.1, 30.7, 34.4, 7, ARRAY['vegetarian', 'vegan', 'omega3'])
ON CONFLICT DO NOTHING;

-- Catégories
INSERT INTO public.categories (name, description) VALUES
('Poisson', 'Sources de protéines marines'),
('Légume', 'Légumes frais et surgelés'),
('Fruit', 'Fruits frais et secs'),
('Oléagineux', 'Noix, amandes, graines'),
('Huile', 'Huiles végétales'),
('Épice', 'Épices et aromates'),
('Céréale', 'Céréales complètes'),
('Graine', 'Graines nutritives')
ON CONFLICT DO NOTHING;
```

---

## 🔍 **VÉRIFICATION APRÈS CONFIGURATION**

### **Test 1: Vérifier les tables**
Dans l'éditeur SQL Supabase, exécuter :
```sql
SELECT 'user_profiles' as table_name, count(*) as count FROM public.user_profiles
UNION ALL
SELECT 'ingredients', count(*) FROM public.ingredients
UNION ALL  
SELECT 'recipes', count(*) FROM public.recipes
UNION ALL
SELECT 'categories', count(*) FROM public.categories;
```

**Résultat attendu :**
```
table_name     | count
user_profiles  | 0
ingredients    | 10
recipes        | 0  
categories     | 8
```

### **Test 2: Health Check API**
```bash
curl https://nutricoach-production.up.railway.app/api/health
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "supabase": {
    "status": "connected"
  }
}
```

### **Test 3: Créer un compte**
1. Aller sur https://nutricoach-production.up.railway.app/signup
2. Créer un compte test
3. ✅ Plus d'erreur "Failed to fetch"
4. ✅ Redirection vers dashboard

---

## 🎉 **RÉSULTAT ATTENDU**

Une fois les tables créées :

✅ **Base de données configurée**  
✅ **Tables user_profiles, ingredients, recipes créées**  
✅ **Row Level Security activé** 
✅ **Données de base chargées**
✅ **API Health retourne "connected"**
✅ **Création de comptes fonctionnelle**
✅ **Authentification complète**

**Le site sera alors 100% opérationnel !** 🚀

---

## 📞 **Support**

Si problème persiste après création des tables :
1. Vérifier dans Supabase Dashboard > SQL Editor que les 5 tables existent
2. Tester Health Check API 
3. Essayer création de compte

**L'authentification devrait fonctionner parfaitement après cette configuration !** ✨