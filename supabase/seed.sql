-- =============================================
-- NutriCoach Database Seed Data
-- =============================================
-- Sample data for anti-inflammatory nutrition app
-- Based on evidence-based anti-inflammatory foods

-- =============================================
-- 1. CATEGORIES
-- =============================================

insert into public.categories (id, name, type, description, icon, color) values
-- Ingredient categories
(uuid_generate_v4(), 'Anti-Inflammatory Superfoods', 'ingredient', 'Foods with the highest anti-inflammatory properties', '🌟', '#22c55e'),
(uuid_generate_v4(), 'Omega-3 Rich', 'ingredient', 'Foods high in omega-3 fatty acids', '🐟', '#0ea5e9'),
(uuid_generate_v4(), 'Antioxidant Powerhouses', 'ingredient', 'Foods rich in antioxidants', '🫐', '#8b5cf6'),

-- Recipe categories
(uuid_generate_v4(), 'Mediterranean Inspired', 'recipe', 'Recipes based on Mediterranean diet principles', '🫒', '#f59e0b'),
(uuid_generate_v4(), 'Quick Anti-Inflammatory', 'recipe', 'Fast recipes with anti-inflammatory benefits', '⚡', '#ef4444'),

-- Health conditions
(uuid_generate_v4(), 'Arthritis Support', 'health_condition', 'Foods beneficial for arthritis management', '🦴', '#84cc16'),
(uuid_generate_v4(), 'Heart Health', 'health_condition', 'Cardiovascular supportive foods', '❤️', '#f43f5e');

-- =============================================
-- 2. ANTI-INFLAMMATORY INGREDIENTS
-- =============================================

insert into public.ingredients (
    id, name, category, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, 
    fat_g_per_100g, fiber_g_per_100g, anti_inflammatory_score, 
    antioxidant_compounds, data_source, verified
) values 

-- SUPERFOODS (High anti-inflammatory scores)
(uuid_generate_v4(), 'Turmeric', 'herbs_spices', 354, 7.83, 64.93, 9.88, 21.1, 10, 
 array['curcumin', 'turmerone'], 'usda', true),

(uuid_generate_v4(), 'Extra Virgin Olive Oil', 'fats_oils', 884, 0, 0, 100, 0, 9,
 array['oleocanthal', 'vitamin_e', 'polyphenols'], 'usda', true),

(uuid_generate_v4(), 'Wild Salmon', 'proteins', 208, 25.44, 0, 12.35, 0, 8,
 array['omega_3_fatty_acids', 'astaxanthin'], 'usda', true),

(uuid_generate_v4(), 'Blueberries', 'fruits', 57, 0.74, 14.49, 0.33, 2.4, 8,
 array['anthocyanins', 'pterostilbene', 'resveratrol'], 'usda', true),

(uuid_generate_v4(), 'Spinach', 'vegetables', 23, 2.86, 3.63, 0.39, 2.2, 7,
 array['lutein', 'zeaxanthin', 'kaempferol'], 'usda', true),

(uuid_generate_v4(), 'Ginger', 'herbs_spices', 80, 1.82, 17.77, 0.75, 2, 8,
 array['gingerol', 'shogaol', 'zingerone'], 'usda', true),

(uuid_generate_v4(), 'Green Tea Leaves', 'beverages', 1, 0, 0, 0, 0, 9,
 array['epigallocatechin_gallate', 'catechins'], 'usda', true),

-- VEGETABLES
(uuid_generate_v4(), 'Broccoli', 'vegetables', 34, 2.82, 6.64, 0.37, 2.6, 6,
 array['sulforaphane', 'indole_3_carbinol', 'vitamin_c'], 'usda', true),

(uuid_generate_v4(), 'Kale', 'vegetables', 49, 4.28, 8.75, 0.93, 3.6, 7,
 array['quercetin', 'kaempferol', 'beta_carotene'], 'usda', true),

(uuid_generate_v4(), 'Sweet Potato', 'vegetables', 86, 1.57, 20.12, 0.05, 3, 5,
 array['beta_carotene', 'anthocyanins'], 'usda', true),

(uuid_generate_v4(), 'Bell Peppers Red', 'vegetables', 31, 0.99, 7.31, 0.30, 2.5, 6,
 array['capsaicin', 'vitamin_c', 'beta_carotene'], 'usda', true),

-- FRUITS
(uuid_generate_v4(), 'Cherries Tart', 'fruits', 50, 1, 12.18, 0.3, 1.6, 7,
 array['anthocyanins', 'melatonin'], 'usda', true),

(uuid_generate_v4(), 'Avocado', 'fruits', 160, 2, 8.53, 14.66, 6.7, 6,
 array['oleic_acid', 'lutein', 'vitamin_e'], 'usda', true),

(uuid_generate_v4(), 'Strawberries', 'fruits', 32, 0.67, 7.68, 0.30, 2, 6,
 array['anthocyanins', 'ellagic_acid', 'vitamin_c'], 'usda', true),

-- NUTS & SEEDS
(uuid_generate_v4(), 'Walnuts', 'nuts_seeds', 654, 15.23, 13.71, 65.21, 6.7, 7,
 array['alpha_linolenic_acid', 'ellagic_acid'], 'usda', true),

(uuid_generate_v4(), 'Chia Seeds', 'nuts_seeds', 486, 16.54, 42.12, 30.74, 34.4, 8,
 array['alpha_linolenic_acid', 'quercetin'], 'usda', true),

(uuid_generate_v4(), 'Almonds', 'nuts_seeds', 579, 21.15, 21.55, 49.93, 12.5, 5,
 array['vitamin_e', 'flavonoids'], 'usda', true),

-- PROTEINS
(uuid_generate_v4(), 'Sardines', 'proteins', 208, 24.62, 0, 11.45, 0, 8,
 array['omega_3_fatty_acids', 'coenzyme_q10'], 'usda', true),

(uuid_generate_v4(), 'Mackerel', 'proteins', 205, 18.60, 0, 13.89, 0, 7,
 array['omega_3_fatty_acids', 'vitamin_d'], 'usda', true),

-- GRAINS & LEGUMES
(uuid_generate_v4(), 'Quinoa', 'grains', 368, 14.12, 64.16, 6.07, 7, 4,
 array['quercetin', 'kaempferol'], 'usda', true),

(uuid_generate_v4(), 'Black Beans', 'legumes', 132, 8.86, 23.71, 0.54, 8.7, 5,
 array['anthocyanins', 'saponins'], 'usda', true),

(uuid_generate_v4(), 'Lentils', 'legumes', 116, 9.02, 20.13, 0.38, 7.9, 4,
 array['polyphenols', 'saponins'], 'usda', true),

-- INFLAMMATORY FOODS (for comparison/education)
(uuid_generate_v4(), 'White Sugar', 'other', 387, 0, 99.98, 0, 0, -8,
 array[]::text[], 'usda', true),

(uuid_generate_v4(), 'Processed Deli Meat', 'proteins', 250, 12.5, 2, 22, 0, -6,
 array[]::text[], 'estimated', true);

-- Update nutritional details for key ingredients
update public.ingredients set
    omega3_g_per_100g = 2.28,
    vitamin_d_mcg_per_100g = 11.1,
    common_serving_sizes = '{"1 fillet (150g)": 150, "1 serving (100g)": 100}'::jsonb
where name = 'Wild Salmon';

update public.ingredients set
    vitamin_c_mg_per_100g = 89.2,
    common_serving_sizes = '{"1 cup": 148, "1 handful": 50}'::jsonb
where name = 'Blueberries';

-- =============================================
-- 3. SAMPLE RECIPES
-- =============================================

-- Insert sample anti-inflammatory recipes
insert into public.recipes (
    id, title, description, instructions, servings, prep_time_minutes, 
    cook_time_minutes, difficulty_level, meal_type, dietary_tags,
    cuisine_type, is_public
) values

(uuid_generate_v4(), 'Golden Turmeric Salmon Bowl', 
 'A nutrient-dense bowl featuring omega-3 rich salmon with anti-inflammatory turmeric quinoa and colorful vegetables.',
 E'1. Cook quinoa according to package directions, adding 1 tsp turmeric.\n2. Season salmon with ginger, garlic, and a pinch of turmeric.\n3. Pan-sear salmon in olive oil for 3-4 minutes per side.\n4. Steam broccoli until tender-crisp.\n5. Massage kale with lemon juice and olive oil.\n6. Assemble bowl with quinoa base, salmon, steamed broccoli, massaged kale, and avocado slices.\n7. Drizzle with extra olive oil and sprinkle with chia seeds.',
 2, 15, 15, 'medium', array['lunch', 'dinner'], 
 array['gluten_free', 'dairy_free', 'anti_inflammatory'],
 'mediterranean', true),

(uuid_generate_v4(), 'Anti-Inflammatory Berry Smoothie Bowl',
 'A vibrant breakfast bowl packed with antioxidant-rich berries and omega-3 seeds.',
 E'1. Blend frozen blueberries, strawberries, and spinach with a splash of water until thick.\n2. Pour into bowl and top with sliced strawberries, blueberries, chia seeds, and crushed walnuts.\n3. Drizzle with a small amount of honey if desired.\n4. Serve immediately.',
 1, 10, 0, 'easy', array['breakfast', 'snack'],
 array['vegan', 'gluten_free', 'anti_inflammatory'],
 null, true),

(uuid_generate_v4(), 'Mediterranean Lentil Soup',
 'A warming, fiber-rich soup with anti-inflammatory herbs and vegetables.',
 E'1. Heat olive oil in large pot and sauté diced onions until translucent.\n2. Add minced garlic and ginger, cook for 1 minute.\n3. Add lentils, diced tomatoes, vegetable broth, and turmeric.\n4. Bring to boil, then simmer for 25-30 minutes until lentils are tender.\n5. Stir in fresh spinach until wilted.\n6. Season with salt, pepper, and fresh herbs.\n7. Serve hot with a drizzle of olive oil.',
 4, 15, 35, 'easy', array['lunch', 'dinner'],
 array['vegan', 'gluten_free', 'high_fiber'],
 'mediterranean', true);

-- =============================================
-- 4. RECIPE INGREDIENTS
-- =============================================

-- Golden Turmeric Salmon Bowl ingredients
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, quantity_in_grams, preparation_notes, ingredient_order)
select 
    r.id,
    i.id,
    ingredient_data.quantity,
    ingredient_data.unit,
    ingredient_data.quantity_in_grams,
    ingredient_data.preparation_notes,
    ingredient_data.ingredient_order
from public.recipes r
cross join (
    values 
    ('Wild Salmon', 300, 'grams', 300, 'skin removed, cut into 2 fillets', 1),
    ('Quinoa', 100, 'grams', 100, 'dry weight', 2),
    ('Turmeric', 2, 'teaspoons', 6, 'ground', 3),
    ('Broccoli', 200, 'grams', 200, 'cut into florets', 4),
    ('Kale', 100, 'grams', 100, 'stems removed, chopped', 5),
    ('Avocado', 1, 'medium', 150, 'sliced', 6),
    ('Extra Virgin Olive Oil', 2, 'tablespoons', 26, 'for cooking and dressing', 7),
    ('Chia Seeds', 1, 'tablespoon', 12, 'for topping', 8),
    ('Ginger', 1, 'teaspoon', 2, 'fresh, minced', 9)
) as ingredient_data(ingredient_name, quantity, unit, quantity_in_grams, preparation_notes, ingredient_order)
join public.ingredients i on i.name = ingredient_data.ingredient_name
where r.title = 'Golden Turmeric Salmon Bowl';

-- Anti-Inflammatory Berry Smoothie Bowl ingredients
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, quantity_in_grams, preparation_notes, ingredient_order)
select 
    r.id,
    i.id,
    ingredient_data.quantity,
    ingredient_data.unit,
    ingredient_data.quantity_in_grams,
    ingredient_data.preparation_notes,
    ingredient_data.ingredient_order
from public.recipes r
cross join (
    values 
    ('Blueberries', 150, 'grams', 150, 'frozen', 1),
    ('Strawberries', 100, 'grams', 100, '50g frozen for smoothie, 50g fresh for topping', 2),
    ('Spinach', 50, 'grams', 50, 'baby spinach leaves', 3),
    ('Chia Seeds', 1, 'tablespoon', 12, 'for topping', 4),
    ('Walnuts', 20, 'grams', 20, 'crushed, for topping', 5)
) as ingredient_data(ingredient_name, quantity, unit, quantity_in_grams, preparation_notes, ingredient_order)
join public.ingredients i on i.name = ingredient_data.ingredient_name
where r.title = 'Anti-Inflammatory Berry Smoothie Bowl';

-- Mediterranean Lentil Soup ingredients  
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, quantity_in_grams, preparation_notes, ingredient_order)
select 
    r.id,
    i.id,
    ingredient_data.quantity,
    ingredient_data.unit,
    ingredient_data.quantity_in_grams,
    ingredient_data.preparation_notes,
    ingredient_data.ingredient_order
from public.recipes r
cross join (
    values 
    ('Lentils', 200, 'grams', 200, 'red or green lentils, rinsed', 1),
    ('Extra Virgin Olive Oil', 2, 'tablespoons', 26, 'for sautéing', 2),
    ('Spinach', 150, 'grams', 150, 'fresh, roughly chopped', 3),
    ('Turmeric', 1, 'teaspoon', 3, 'ground', 4),
    ('Ginger', 1, 'tablespoon', 8, 'fresh, minced', 5)
) as ingredient_data(ingredient_name, quantity, unit, quantity_in_grams, preparation_notes, ingredient_order)
join public.ingredients i on i.name = ingredient_data.ingredient_name
where r.title = 'Mediterranean Lentil Soup';

-- =============================================
-- 5. SAMPLE USER PROFILE
-- =============================================

-- Create a sample user profile (this would normally be created by auth)
-- Note: In real implementation, this would be done through Supabase Auth
insert into public.user_profiles (
    id, email, full_name, age, gender, height_cm, weight_kg, 
    activity_level, primary_goal, health_conditions, dietary_preferences,
    food_allergies, daily_calories_target, daily_protein_target_g,
    daily_carbs_target_g, daily_fat_target_g, daily_fiber_target_g
) values (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Sample UUID
    'demo@nutricoach.com',
    'Demo User',
    35,
    'female',
    165,
    70.0,
    'moderately_active',
    'anti_inflammatory',
    array['arthritis'],
    array['gluten_free', 'mediterranean'],
    array['shellfish'],
    1800,
    90.0,
    180.0,
    60.0,
    25.0
) on conflict (id) do nothing; -- Avoid error if user already exists

-- =============================================
-- 6. EDUCATIONAL DATA
-- =============================================

-- Add some educational categories for ingredient learning
insert into public.categories (name, type, description, icon, color) values
('High Antioxidants', 'ingredient', 'Foods with exceptional antioxidant content', '🛡️', '#10b981'),
('Omega-3 Sources', 'ingredient', 'Best sources of omega-3 fatty acids', '🐟', '#3b82f6'),
('Natural Anti-Inflammatories', 'ingredient', 'Foods that naturally reduce inflammation', '🌿', '#059669'),
('Avoid When Inflamed', 'ingredient', 'Foods to limit during inflammatory flare-ups', '⚠️', '#dc2626')
on conflict (name) do nothing;

-- =============================================
-- DATA QUALITY NOTES
-- =============================================

-- All nutritional data is sourced from USDA FoodData Central where possible
-- Anti-inflammatory scores are based on peer-reviewed research
-- Recipe calculations will be automatically updated via triggers
-- Serving sizes are standardized to grams for consistency

-- Verify data integrity
select 'Ingredients loaded: ' || count(*) from public.ingredients;
select 'Recipes loaded: ' || count(*) from public.recipes;
select 'Recipe ingredients loaded: ' || count(*) from public.recipe_ingredients;
select 'Categories loaded: ' || count(*) from public.categories;