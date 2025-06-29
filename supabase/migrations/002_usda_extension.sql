-- =============================================
-- NutriCoach Database Schema Extension - USDA Integration
-- =============================================
-- Extension du schéma pour support multi-sources nutritionnelles
-- Focus: USDA FoodData Central + micronutriments étendus

-- =============================================
-- 1. EXTENSION SCHEMA INGREDIENTS - SOURCES EXTERNES
-- =============================================

-- Ajouter colonnes pour tracking des sources externes
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS
    usda_fdc_id text UNIQUE, -- USDA FoodData Central ID
    ciqual_code text, -- Table CIQUAL française (ANSES)
    openfoodfacts_id text, -- Open Food Facts ID
    external_sources jsonb DEFAULT '{}', -- Sources additionnelles flexibles
    last_sync_date timestamptz, -- Dernière synchronisation des données
    sync_status text CHECK (sync_status IN ('pending', 'synced', 'error', 'manual')) DEFAULT 'manual';

-- =============================================
-- 2. MICRONUTRIMENTS ÉTENDUS - USDA STANDARDS
-- =============================================

-- Vitamines additionnelles selon standards USDA
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS
    vitamin_a_mcg_per_100g numeric(7,2) DEFAULT 0 CHECK (vitamin_a_mcg_per_100g >= 0),
    vitamin_k_mcg_per_100g numeric(7,2) DEFAULT 0 CHECK (vitamin_k_mcg_per_100g >= 0),
    folate_mcg_per_100g numeric(7,2) DEFAULT 0 CHECK (folate_mcg_per_100g >= 0),
    vitamin_b12_mcg_per_100g numeric(7,3) DEFAULT 0 CHECK (vitamin_b12_mcg_per_100g >= 0),
    vitamin_b6_mg_per_100g numeric(6,3) DEFAULT 0 CHECK (vitamin_b6_mg_per_100g >= 0),
    thiamin_mg_per_100g numeric(6,3) DEFAULT 0 CHECK (thiamin_mg_per_100g >= 0),
    riboflavin_mg_per_100g numeric(6,3) DEFAULT 0 CHECK (riboflavin_mg_per_100g >= 0),
    niacin_mg_per_100g numeric(6,2) DEFAULT 0 CHECK (niacin_mg_per_100g >= 0);

-- Minéraux essentiels selon USDA
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS
    calcium_mg_per_100g numeric(7,2) DEFAULT 0 CHECK (calcium_mg_per_100g >= 0),
    iron_mg_per_100g numeric(6,2) DEFAULT 0 CHECK (iron_mg_per_100g >= 0),
    magnesium_mg_per_100g numeric(6,2) DEFAULT 0 CHECK (magnesium_mg_per_100g >= 0),
    potassium_mg_per_100g numeric(7,2) DEFAULT 0 CHECK (potassium_mg_per_100g >= 0),
    zinc_mg_per_100g numeric(6,2) DEFAULT 0 CHECK (zinc_mg_per_100g >= 0),
    phosphorus_mg_per_100g numeric(7,2) DEFAULT 0 CHECK (phosphorus_mg_per_100g >= 0),
    copper_mg_per_100g numeric(5,3) DEFAULT 0 CHECK (copper_mg_per_100g >= 0),
    manganese_mg_per_100g numeric(5,3) DEFAULT 0 CHECK (manganese_mg_per_100g >= 0),
    selenium_mcg_per_100g numeric(6,2) DEFAULT 0 CHECK (selenium_mcg_per_100g >= 0);

-- Acides gras détaillés
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS
    saturated_fat_g_per_100g numeric(6,3) DEFAULT 0 CHECK (saturated_fat_g_per_100g >= 0),
    monounsaturated_fat_g_per_100g numeric(6,3) DEFAULT 0 CHECK (monounsaturated_fat_g_per_100g >= 0),
    polyunsaturated_fat_g_per_100g numeric(6,3) DEFAULT 0 CHECK (polyunsaturated_fat_g_per_100g >= 0),
    trans_fat_g_per_100g numeric(6,3) DEFAULT 0 CHECK (trans_fat_g_per_100g >= 0),
    cholesterol_mg_per_100g numeric(6,2) DEFAULT 0 CHECK (cholesterol_mg_per_100g >= 0);

-- Informations USDA spécifiques
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS
    usda_food_group text, -- Groupe alimentaire USDA
    usda_description text, -- Description complète USDA
    usda_data_type text CHECK (usda_data_type IN ('foundation_food', 'sr_legacy_food', 'survey_fndds_food', 'branded_food')),
    usda_publication_date date,
    water_g_per_100g numeric(5,2) DEFAULT 0 CHECK (water_g_per_100g >= 0),
    ash_g_per_100g numeric(5,2) DEFAULT 0 CHECK (ash_g_per_100g >= 0);

-- =============================================
-- 3. INDEXES POUR PERFORMANCE - RECHERCHE USDA
-- =============================================

-- Index pour recherche par sources externes
CREATE INDEX IF NOT EXISTS idx_ingredients_usda_fdc_id ON public.ingredients(usda_fdc_id) WHERE usda_fdc_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_sync_status ON public.ingredients(sync_status);
CREATE INDEX IF NOT EXISTS idx_ingredients_last_sync_date ON public.ingredients(last_sync_date);

-- Index composé pour filtrages nutritionnels avancés
CREATE INDEX IF NOT EXISTS idx_ingredients_micronutrients ON public.ingredients(vitamin_c_mg_per_100g, iron_mg_per_100g, calcium_mg_per_100g);
CREATE INDEX IF NOT EXISTS idx_ingredients_usda_food_group ON public.ingredients(usda_food_group) WHERE usda_food_group IS NOT NULL;

-- Index GIN pour sources externes flexibles
CREATE INDEX IF NOT EXISTS idx_ingredients_external_sources ON public.ingredients USING gin(external_sources);

-- =============================================
-- 4. TABLE DE MAPPING UNITS - CONVERSIONS USDA
-- =============================================

-- Table pour gérer les conversions d'unités USDA vers grammes
CREATE TABLE IF NOT EXISTS public.usda_unit_conversions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE CASCADE,
    usda_fdc_id text NOT NULL,
    
    -- Unité USDA
    usda_unit text NOT NULL, -- "1 cup", "1 medium", "1 tablespoon", etc.
    usda_unit_description text,
    
    -- Conversion en grammes
    grams_per_unit numeric(8,3) NOT NULL CHECK (grams_per_unit > 0),
    
    -- Métadonnées
    conversion_source text DEFAULT 'usda_measures',
    is_primary_measure boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour recherches de conversions
CREATE INDEX idx_usda_unit_conversions_ingredient_id ON public.usda_unit_conversions(ingredient_id);
CREATE INDEX idx_usda_unit_conversions_fdc_id ON public.usda_unit_conversions(usda_fdc_id);

-- =============================================
-- 5. TABLE HISTORIQUE IMPORTS USDA
-- =============================================

-- Table pour traçabilité des imports USDA
CREATE TABLE IF NOT EXISTS public.usda_import_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type text NOT NULL CHECK (import_type IN ('bulk_import', 'single_import', 'update_sync', 'manual_correction')),
    
    -- Statistiques import
    total_processed integer NOT NULL DEFAULT 0,
    successful_imports integer NOT NULL DEFAULT 0,
    failed_imports integer NOT NULL DEFAULT 0,
    updated_records integer NOT NULL DEFAULT 0,
    
    -- Filtres utilisés
    search_query text,
    food_groups text[],
    page_size integer,
    
    -- Résultats
    import_status text NOT NULL CHECK (import_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    error_messages jsonb DEFAULT '[]',
    processing_time_seconds integer,
    
    -- Métadonnées
    initiated_by uuid REFERENCES public.user_profiles(id),
    api_version text DEFAULT 'v1',
    
    created_at timestamptz DEFAULT now() NOT NULL,
    completed_at timestamptz
);

-- Index pour monitoring des imports
CREATE INDEX idx_usda_import_logs_status ON public.usda_import_logs(import_status);
CREATE INDEX idx_usda_import_logs_created_at ON public.usda_import_logs(created_at DESC);
CREATE INDEX idx_usda_import_logs_initiated_by ON public.usda_import_logs(initiated_by);

-- =============================================
-- 6. FONCTIONS UTILITAIRES USDA
-- =============================================

-- Fonction pour calculer le score de qualité des données nutritionnelles
CREATE OR REPLACE FUNCTION calculate_nutrition_data_completeness(ingredient_uuid uuid)
RETURNS numeric AS $$
DECLARE
    completeness_score numeric := 0;
    total_fields integer := 25; -- Nombre total de champs nutritionnels importants
    filled_fields integer := 0;
BEGIN
    SELECT 
        (CASE WHEN calories_per_100g IS NOT NULL AND calories_per_100g > 0 THEN 1 ELSE 0 END) +
        (CASE WHEN protein_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN carbs_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN fat_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN fiber_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN vitamin_c_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN vitamin_d_mcg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN vitamin_e_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN vitamin_a_mcg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN vitamin_k_mcg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN folate_mcg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN vitamin_b12_mcg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN calcium_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN iron_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN magnesium_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN potassium_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN zinc_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN phosphorus_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN omega3_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN omega6_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN saturated_fat_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN monounsaturated_fat_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN polyunsaturated_fat_g_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN sodium_mg_per_100g IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN sugar_g_per_100g IS NOT NULL THEN 1 ELSE 0 END)
    INTO filled_fields
    FROM public.ingredients
    WHERE id = ingredient_uuid;
    
    completeness_score := (filled_fields::numeric / total_fields::numeric) * 100;
    
    RETURN ROUND(completeness_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour normaliser les noms d'ingrédients pour matching USDA
CREATE OR REPLACE FUNCTION normalize_ingredient_name(input_name text)
RETURNS text AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                trim(input_name),
                '\s+', ' ', 'g'  -- Normaliser les espaces multiples
            ),
            '[^\w\s]', '', 'g'  -- Supprimer la ponctuation
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 7. VUES POUR FACILITER L'USAGE
-- =============================================

-- Vue des ingrédients avec données USDA complètes
CREATE OR REPLACE VIEW public.ingredients_with_usda AS
SELECT 
    i.*,
    calculate_nutrition_data_completeness(i.id) as nutrition_completeness_percent,
    CASE 
        WHEN i.usda_fdc_id IS NOT NULL THEN 'usda_verified'
        WHEN i.data_source = 'usda' THEN 'usda_imported'
        WHEN i.verified = true THEN 'manually_verified'
        ELSE 'unverified'
    END as verification_status,
    uc.usda_unit as primary_usda_unit,
    uc.grams_per_unit as primary_unit_grams
FROM public.ingredients i
LEFT JOIN public.usda_unit_conversions uc ON i.id = uc.ingredient_id AND uc.is_primary_measure = true;

-- Vue des statistiques d'import USDA
CREATE OR REPLACE VIEW public.usda_import_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as import_date,
    import_type,
    COUNT(*) as total_imports,
    SUM(successful_imports) as total_successful,
    SUM(failed_imports) as total_failed,
    AVG(processing_time_seconds) as avg_processing_time,
    STRING_AGG(DISTINCT import_status, ', ') as statuses
FROM public.usda_import_logs
GROUP BY DATE_TRUNC('day', created_at), import_type
ORDER BY import_date DESC;

-- =============================================
-- 8. POLITIQUES RLS POUR NOUVELLES TABLES
-- =============================================

-- RLS pour usda_unit_conversions (données publiques)
ALTER TABLE public.usda_unit_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unit conversions"
    ON public.usda_unit_conversions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert unit conversions"
    ON public.usda_unit_conversions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- RLS pour usda_import_logs (logs des utilisateurs)
ALTER TABLE public.usda_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import logs"
    ON public.usda_import_logs FOR SELECT
    USING (initiated_by = (SELECT auth.uid()) OR initiated_by IS NULL);

CREATE POLICY "Authenticated users can create import logs"
    ON public.usda_import_logs FOR INSERT
    TO authenticated
    WITH CHECK (initiated_by = (SELECT auth.uid()));

-- =============================================
-- 9. GRANTS ET PERMISSIONS
-- =============================================

-- Permissions pour les nouvelles tables
GRANT ALL PRIVILEGES ON public.usda_unit_conversions TO authenticated;
GRANT SELECT ON public.usda_unit_conversions TO anon;

GRANT ALL PRIVILEGES ON public.usda_import_logs TO authenticated;
GRANT SELECT ON public.usda_import_logs TO anon;

-- Permissions pour les vues
GRANT SELECT ON public.ingredients_with_usda TO authenticated, anon;
GRANT SELECT ON public.usda_import_stats TO authenticated, anon;

-- =============================================
-- 10. COMMENTAIRES DOCUMENTATION
-- =============================================

COMMENT ON COLUMN public.ingredients.usda_fdc_id IS 'Identifiant unique USDA FoodData Central pour tracking source';
COMMENT ON COLUMN public.ingredients.external_sources IS 'Sources de données externes au format JSON flexible';
COMMENT ON COLUMN public.ingredients.last_sync_date IS 'Date de dernière synchronisation avec sources externes';
COMMENT ON COLUMN public.ingredients.vitamin_a_mcg_per_100g IS 'Vitamine A en microgrammes équivalent rétinol par 100g';
COMMENT ON COLUMN public.ingredients.folate_mcg_per_100g IS 'Folate total (acide folique + folates alimentaires) en mcg par 100g';

COMMENT ON TABLE public.usda_unit_conversions IS 'Table de mapping des unités USDA vers grammes pour calculs précis';
COMMENT ON TABLE public.usda_import_logs IS 'Logs de traçabilité des imports et synchronisations USDA';

COMMENT ON VIEW public.ingredients_with_usda IS 'Vue enrichie des ingrédients avec statut de vérification USDA';
COMMENT ON VIEW public.usda_import_stats IS 'Statistiques agrégées des imports USDA par date et type';

COMMENT ON FUNCTION calculate_nutrition_data_completeness(uuid) IS 'Calcule le pourcentage de complétude des données nutritionnelles (0-100%)';
COMMENT ON FUNCTION normalize_ingredient_name(text) IS 'Normalise les noms d\'ingrédients pour matching avec bases de données externes';

-- =============================================
-- VALIDATION ET TESTS
-- =============================================

-- Vérifier l'ajout des colonnes
DO $$
BEGIN
    -- Test présence des nouvelles colonnes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'usda_fdc_id'
    ) THEN
        RAISE EXCEPTION 'Extension USDA incomplète: colonne usda_fdc_id manquante';
    END IF;
    
    RAISE NOTICE 'Extension USDA validée avec succès';
END $$;

-- Afficher le résumé des modifications
SELECT 
    'Extension Schema USDA terminée' as status,
    COUNT(*) as total_ingredients_count
FROM public.ingredients;