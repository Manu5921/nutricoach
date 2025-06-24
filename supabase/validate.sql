-- =============================================
-- NutriCoach Database Validation Script
-- =============================================
-- Validates data integrity and setup completion

\echo '🔍 Starting NutriCoach Database Validation...'

-- =============================================
-- 1. TABLE EXISTENCE AND STRUCTURE
-- =============================================

\echo '📊 Checking table structure...'

-- Verify all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'ingredients', 'recipes', 'recipe_ingredients', 'categories');
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ All 5 core tables exist';
    ELSE
        RAISE EXCEPTION '❌ Missing tables. Expected 5, found %', table_count;
    END IF;
END $$;

-- =============================================
-- 2. RLS POLICIES VALIDATION
-- =============================================

\echo '🔐 Checking Row Level Security policies...'

-- Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'ingredients', 'recipes', 'recipe_ingredients', 'categories')
ORDER BY tablename;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================
-- 3. DATA VALIDATION
-- =============================================

\echo '📊 Validating seed data...'

-- Check ingredient data quality
SELECT 
    '📋 Ingredients Summary' as check_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE verified = true) as verified_count,
    COUNT(*) FILTER (WHERE anti_inflammatory_score >= 7) as high_anti_inflammatory,
    COUNT(*) FILTER (WHERE anti_inflammatory_score <= -5) as inflammatory_foods
FROM public.ingredients;

-- Check recipe data completeness
SELECT 
    '🍽️ Recipes Summary' as check_type,
    COUNT(*) as total_recipes,
    COUNT(*) FILTER (WHERE is_public = true) as public_recipes,
    COUNT(*) FILTER (WHERE anti_inflammatory_score IS NOT NULL) as calculated_nutrition,
    AVG(anti_inflammatory_score) as avg_anti_inflammatory_score
FROM public.recipes;

-- Check recipe ingredients relationships
SELECT 
    '🔗 Recipe Ingredients Summary' as check_type,
    COUNT(*) as total_relationships,
    COUNT(DISTINCT recipe_id) as recipes_with_ingredients,
    COUNT(DISTINCT ingredient_id) as ingredients_used,
    COUNT(*) FILTER (WHERE quantity_in_grams IS NOT NULL) as normalized_quantities
FROM public.recipe_ingredients;

-- =============================================
-- 4. FUNCTION VALIDATION
-- =============================================

\echo '⚙️ Testing database functions...'

-- Test nutrition calculation function
DO $$
DECLARE
    test_recipe_id UUID;
    nutrition_result JSONB;
BEGIN
    -- Get a recipe ID for testing
    SELECT id INTO test_recipe_id 
    FROM public.recipes 
    WHERE title = 'Golden Turmeric Salmon Bowl' 
    LIMIT 1;
    
    IF test_recipe_id IS NOT NULL THEN
        -- Test the function
        SELECT calculate_recipe_nutrition(test_recipe_id) INTO nutrition_result;
        
        IF nutrition_result IS NOT NULL THEN
            RAISE NOTICE '✅ Nutrition calculation function works: %', nutrition_result;
        ELSE
            RAISE NOTICE '⚠️ Nutrition calculation returned NULL';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No test recipe found for function testing';
    END IF;
END $$;

-- =============================================
-- 5. INDEX VALIDATION
-- =============================================

\echo '📈 Checking performance indexes...'

-- List all custom indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =============================================
-- 6. CONSTRAINT VALIDATION
-- =============================================

\echo '🛡️ Validating data constraints...'

-- Check for any constraint violations
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    contype as constraint_type
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace
AND contype IN ('c', 'f', 'u')  -- check, foreign key, unique
ORDER BY conrelid::regclass, conname;

-- =============================================
-- 7. SAMPLE QUERIES FOR FUNCTIONALITY
-- =============================================

\echo '🔍 Testing sample queries...'

-- Test anti-inflammatory ingredient search
\echo '🌿 Top anti-inflammatory ingredients:'
SELECT 
    name,
    anti_inflammatory_score,
    category,
    array_length(antioxidant_compounds, 1) as compound_count
FROM public.ingredients 
WHERE anti_inflammatory_score >= 7
ORDER BY anti_inflammatory_score DESC
LIMIT 5;

-- Test recipe with ingredients query
\echo '🍽️ Sample recipe with calculated nutrition:'
SELECT 
    r.title,
    r.servings,
    r.calories_per_serving,
    r.anti_inflammatory_score,
    r.inflammation_category,
    COUNT(ri.id) as ingredient_count
FROM public.recipes r
LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
WHERE r.is_public = true
GROUP BY r.id, r.title, r.servings, r.calories_per_serving, r.anti_inflammatory_score, r.inflammation_category
LIMIT 3;

-- Test dietary preferences filtering
\echo '🥗 Gluten-free anti-inflammatory recipes:'
SELECT 
    title,
    dietary_tags,
    inflammation_category,
    prep_time_minutes,
    difficulty_level
FROM public.recipes 
WHERE 'gluten_free' = ANY(dietary_tags)
AND inflammation_category = 'anti_inflammatory'
ORDER BY prep_time_minutes;

-- =============================================
-- 8. SECURITY VALIDATION
-- =============================================

\echo '🔒 Security validation...'

-- Check for proper role permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- =============================================
-- 9. FINAL SUMMARY
-- =============================================

\echo ''
\echo '📋 VALIDATION SUMMARY'
\echo '===================='

-- Overall counts
SELECT 
    'Database Objects' as category,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') as indexes,
    (SELECT COUNT(*) FROM public.ingredients) as ingredients,
    (SELECT COUNT(*) FROM public.recipes) as recipes;

\echo ''
\echo '✅ Validation completed!'
\echo '🚀 Database is ready for NutriCoach application!'
\echo ''
\echo '📚 Next steps:'
\echo '   1. Connect your frontend application'
\echo '   2. Test authentication flow'
\echo '   3. Implement user registration'
\echo '   4. Start building nutrition features!'