-- =============================================
-- NutriCoach Database Schema - Phase 1
-- =============================================
-- Anti-inflammatory nutrition coaching platform
-- Based on Supabase best practices and nutrition app patterns

-- Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- =============================================
-- 1. USER PROFILES & PREFERENCES
-- =============================================

-- Enhanced user profiles with nutrition preferences
create table public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    full_name text,
    avatar_url text,
    
    -- Demographic info for nutrition calculations
    age integer check (age > 0 and age < 150),
    gender text check (gender in ('male', 'female', 'other')),
    height_cm integer check (height_cm > 50 and height_cm < 300),
    weight_kg numeric(5,2) check (weight_kg > 20 and weight_kg < 500),
    activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
    
    -- Health goals and conditions
    primary_goal text check (primary_goal in ('weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'anti_inflammatory')),
    health_conditions text[], -- Array of conditions like ['arthritis', 'diabetes', 'hypertension']
    
    -- Dietary preferences and restrictions
    dietary_preferences text[], -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'mediterranean']
    food_allergies text[], -- ['nuts', 'shellfish', 'eggs', 'soy']
    disliked_foods text[], -- Foods to avoid in recommendations
    
    -- Nutrition targets (calculated or manually set)
    daily_calories_target integer check (daily_calories_target > 500 and daily_calories_target < 5000),
    daily_protein_target_g numeric(6,2),
    daily_carbs_target_g numeric(6,2),
    daily_fat_target_g numeric(6,2),
    daily_fiber_target_g numeric(5,2),
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- RLS Policies
create policy "Users can view their own profile"
    on public.user_profiles for select
    using ( (select auth.uid()) = id );

create policy "Users can insert their own profile"
    on public.user_profiles for insert
    with check ( (select auth.uid()) = id );

create policy "Users can update their own profile"
    on public.user_profiles for update
    using ( (select auth.uid()) = id );

-- =============================================
-- 2. INGREDIENTS & NUTRITIONAL DATA
-- =============================================

-- Master ingredients table with comprehensive nutritional data
create table public.ingredients (
    id uuid primary key default uuid_generate_v4(),
    
    -- Basic info
    name text not null unique,
    name_scientific text, -- Scientific name if applicable
    category text not null check (category in (
        'vegetables', 'fruits', 'grains', 'legumes', 'nuts_seeds', 
        'proteins', 'dairy', 'fats_oils', 'herbs_spices', 'beverages', 'other'
    )),
    
    -- Nutritional data per 100g
    calories_per_100g numeric(7,2) not null check (calories_per_100g >= 0),
    protein_g_per_100g numeric(6,2) default 0 check (protein_g_per_100g >= 0),
    carbs_g_per_100g numeric(6,2) default 0 check (carbs_g_per_100g >= 0),
    fat_g_per_100g numeric(6,2) default 0 check (fat_g_per_100g >= 0),
    fiber_g_per_100g numeric(6,2) default 0 check (fiber_g_per_100g >= 0),
    sugar_g_per_100g numeric(6,2) default 0 check (sugar_g_per_100g >= 0),
    sodium_mg_per_100g numeric(8,2) default 0 check (sodium_mg_per_100g >= 0),
    
    -- Micronutrients (key ones for anti-inflammatory focus)
    vitamin_c_mg_per_100g numeric(7,2) default 0,
    vitamin_d_mcg_per_100g numeric(7,2) default 0,
    vitamin_e_mg_per_100g numeric(7,2) default 0,
    omega3_g_per_100g numeric(6,3) default 0,
    omega6_g_per_100g numeric(6,3) default 0,
    
    -- Anti-inflammatory properties
    anti_inflammatory_score integer check (anti_inflammatory_score between -10 and 10), -- -10 (very inflammatory) to +10 (very anti-inflammatory)
    antioxidant_compounds text[], -- ['quercetin', 'resveratrol', 'curcumin', etc.]
    
    -- Additional metadata
    glycemic_index integer check (glycemic_index between 1 and 100),
    common_serving_sizes jsonb, -- {"1 cup": 150, "1 medium": 80} in grams
    storage_tips text,
    seasonality text[], -- ['spring', 'summer', 'fall', 'winter']
    
    -- Data source and quality
    data_source text default 'manual', -- 'usda', 'manual', 'estimated'
    verified boolean default false,
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.ingredients enable row level security;

-- RLS Policies (ingredients are public data)
create policy "Anyone can view ingredients"
    on public.ingredients for select
    using ( true );

-- Only authenticated users can suggest new ingredients (for future admin approval)
create policy "Authenticated users can suggest ingredients"
    on public.ingredients for insert
    to authenticated
    with check ( verified = false );

-- =============================================
-- 3. RECIPES & MEAL PLANS
-- =============================================

-- Recipes with anti-inflammatory focus
create table public.recipes (
    id uuid primary key default uuid_generate_v4(),
    
    -- Basic info
    title text not null,
    description text,
    instructions text not null,
    
    -- Recipe metadata
    servings integer not null check (servings > 0),
    prep_time_minutes integer check (prep_time_minutes >= 0),
    cook_time_minutes integer check (cook_time_minutes >= 0),
    difficulty_level text check (difficulty_level in ('easy', 'medium', 'hard')),
    
    -- Categorization
    meal_type text[] not null, -- ['breakfast', 'lunch', 'dinner', 'snack']
    cuisine_type text, -- 'mediterranean', 'asian', 'mexican', etc.
    dietary_tags text[], -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto']
    
    -- Anti-inflammatory properties (calculated from ingredients)
    anti_inflammatory_score numeric(4,2), -- Calculated average from ingredients
    inflammation_category text check (inflammation_category in ('anti_inflammatory', 'neutral', 'inflammatory')),
    
    -- Nutritional data (calculated from ingredients)
    calories_per_serving numeric(7,2),
    protein_g_per_serving numeric(6,2),
    carbs_g_per_serving numeric(6,2),
    fat_g_per_serving numeric(6,2),
    fiber_g_per_serving numeric(6,2),
    
    -- Media and presentation
    image_url text,
    video_url text,
    
    -- Community features
    created_by uuid references public.user_profiles(id),
    is_public boolean default true,
    rating_average numeric(3,2) check (rating_average between 1 and 5),
    rating_count integer default 0,
    
    -- Timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.recipes enable row level security;

-- RLS Policies
create policy "Anyone can view public recipes"
    on public.recipes for select
    using ( is_public = true );

create policy "Users can view their own recipes"
    on public.recipes for select
    using ( created_by = (select auth.uid()) );

create policy "Users can create recipes"
    on public.recipes for insert
    to authenticated
    with check ( created_by = (select auth.uid()) );

create policy "Users can update their own recipes"
    on public.recipes for update
    using ( created_by = (select auth.uid()) );

-- =============================================
-- 4. RECIPE INGREDIENTS (Junction Table)
-- =============================================

-- Links recipes to ingredients with quantities
create table public.recipe_ingredients (
    id uuid primary key default uuid_generate_v4(),
    recipe_id uuid not null references public.recipes(id) on delete cascade,
    ingredient_id uuid not null references public.ingredients(id) on delete cascade,
    
    -- Quantity and measurements
    quantity numeric(8,3) not null check (quantity > 0),
    unit text not null, -- 'grams', 'cups', 'tablespoons', 'pieces', etc.
    quantity_in_grams numeric(8,3), -- Normalized to grams for calculations
    
    -- Recipe-specific notes
    preparation_notes text, -- 'chopped', 'diced', 'optional'
    ingredient_order integer, -- Order in recipe instructions
    
    -- Timestamps
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.recipe_ingredients enable row level security;

-- RLS Policies (inherit from recipe permissions)
create policy "Users can view recipe ingredients for accessible recipes"
    on public.recipe_ingredients for select
    using (
        recipe_id in (
            select id from public.recipes
            where is_public = true or created_by = (select auth.uid())
        )
    );

create policy "Users can manage ingredients for their recipes"
    on public.recipe_ingredients for all
    using (
        recipe_id in (
            select id from public.recipes
            where created_by = (select auth.uid())
        )
    );

-- =============================================
-- 5. CATEGORIES & TAGS SYSTEM
-- =============================================

-- Flexible categorization system
create table public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    type text not null check (type in ('ingredient', 'recipe', 'health_condition', 'dietary_preference')),
    description text,
    icon text, -- For UI representation
    color text, -- Hex color code
    parent_id uuid references public.categories(id), -- For hierarchical categories
    
    -- Timestamps
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- RLS Policies (categories are public data)
create policy "Anyone can view categories"
    on public.categories for select
    using ( true );

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================

-- User profiles indexes
create index idx_user_profiles_email on public.user_profiles(email);
create index idx_user_profiles_dietary_preferences on public.user_profiles using gin(dietary_preferences);

-- Ingredients indexes
create index idx_ingredients_name on public.ingredients(name);
create index idx_ingredients_category on public.ingredients(category);
create index idx_ingredients_anti_inflammatory_score on public.ingredients(anti_inflammatory_score);
create index idx_ingredients_calories on public.ingredients(calories_per_100g);

-- Recipes indexes
create index idx_recipes_meal_type on public.recipes using gin(meal_type);
create index idx_recipes_dietary_tags on public.recipes using gin(dietary_tags);
create index idx_recipes_anti_inflammatory_score on public.recipes(anti_inflammatory_score);
create index idx_recipes_created_by on public.recipes(created_by);
create index idx_recipes_public on public.recipes(is_public);

-- Recipe ingredients indexes
create index idx_recipe_ingredients_recipe_id on public.recipe_ingredients(recipe_id);
create index idx_recipe_ingredients_ingredient_id on public.recipe_ingredients(ingredient_id);

-- Categories indexes
create index idx_categories_type on public.categories(type);
create index idx_categories_parent_id on public.categories(parent_id);

-- =============================================
-- 7. FUNCTIONS FOR CALCULATIONS
-- =============================================

-- Function to calculate recipe nutritional data from ingredients
create or replace function calculate_recipe_nutrition(recipe_uuid uuid)
returns jsonb as $$
declare
    nutrition_data jsonb;
    total_calories numeric := 0;
    total_protein numeric := 0;
    total_carbs numeric := 0;
    total_fat numeric := 0;
    total_fiber numeric := 0;
    servings_count integer;
begin
    -- Get recipe servings
    select servings into servings_count
    from public.recipes
    where id = recipe_uuid;
    
    -- Calculate totals from ingredients
    select 
        sum((ri.quantity_in_grams / 100.0) * i.calories_per_100g),
        sum((ri.quantity_in_grams / 100.0) * i.protein_g_per_100g),
        sum((ri.quantity_in_grams / 100.0) * i.carbs_g_per_100g),
        sum((ri.quantity_in_grams / 100.0) * i.fat_g_per_100g),
        sum((ri.quantity_in_grams / 100.0) * i.fiber_g_per_100g)
    into 
        total_calories, total_protein, total_carbs, total_fat, total_fiber
    from public.recipe_ingredients ri
    join public.ingredients i on ri.ingredient_id = i.id
    where ri.recipe_id = recipe_uuid
    and ri.quantity_in_grams is not null;
    
    -- Build result JSON
    nutrition_data := jsonb_build_object(
        'calories_per_serving', round(total_calories / servings_count, 2),
        'protein_g_per_serving', round(total_protein / servings_count, 2),
        'carbs_g_per_serving', round(total_carbs / servings_count, 2),
        'fat_g_per_serving', round(total_fat / servings_count, 2),
        'fiber_g_per_serving', round(total_fiber / servings_count, 2)
    );
    
    return nutrition_data;
end;
$$ language plpgsql;

-- Function to calculate anti-inflammatory score for recipes
create or replace function calculate_recipe_anti_inflammatory_score(recipe_uuid uuid)
returns numeric as $$
declare
    avg_score numeric;
begin
    select avg(i.anti_inflammatory_score)
    into avg_score
    from public.recipe_ingredients ri
    join public.ingredients i on ri.ingredient_id = i.id
    where ri.recipe_id = recipe_uuid
    and i.anti_inflammatory_score is not null;
    
    return coalesce(avg_score, 0);
end;
$$ language plpgsql;

-- =============================================
-- 8. TRIGGERS FOR AUTO-UPDATES
-- =============================================

-- Update timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply timestamp triggers
create trigger update_user_profiles_updated_at
    before update on public.user_profiles
    for each row execute function update_updated_at_column();

create trigger update_ingredients_updated_at
    before update on public.ingredients
    for each row execute function update_updated_at_column();

create trigger update_recipes_updated_at
    before update on public.recipes
    for each row execute function update_updated_at_column();

-- Auto-calculate recipe nutrition when ingredients change
create or replace function update_recipe_nutrition()
returns trigger as $$
declare
    nutrition jsonb;
    anti_inflammatory_score numeric;
begin
    -- Calculate nutrition data
    nutrition := calculate_recipe_nutrition(coalesce(new.recipe_id, old.recipe_id));
    anti_inflammatory_score := calculate_recipe_anti_inflammatory_score(coalesce(new.recipe_id, old.recipe_id));
    
    -- Update recipe table
    update public.recipes
    set 
        calories_per_serving = (nutrition->>'calories_per_serving')::numeric,
        protein_g_per_serving = (nutrition->>'protein_g_per_serving')::numeric,
        carbs_g_per_serving = (nutrition->>'carbs_g_per_serving')::numeric,
        fat_g_per_serving = (nutrition->>'fat_g_per_serving')::numeric,
        fiber_g_per_serving = (nutrition->>'fiber_g_per_serving')::numeric,
        anti_inflammatory_score = anti_inflammatory_score,
        inflammation_category = case 
            when anti_inflammatory_score >= 3 then 'anti_inflammatory'
            when anti_inflammatory_score <= -3 then 'inflammatory'
            else 'neutral'
        end,
        updated_at = now()
    where id = coalesce(new.recipe_id, old.recipe_id);
    
    return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_recipe_nutrition_trigger
    after insert or update or delete on public.recipe_ingredients
    for each row execute function update_recipe_nutrition();

-- =============================================
-- SECURITY & PERFORMANCE NOTES
-- =============================================

-- All tables have RLS enabled with appropriate policies
-- Indexes are created for common query patterns
-- Functions use SECURITY DEFINER where needed
-- Triggers maintain data consistency automatically

-- Grant usage on schemas
grant usage on schema public to authenticated, anon;

-- Grant table permissions
grant all privileges on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Grant sequence permissions
grant usage on all sequences in schema public to authenticated;