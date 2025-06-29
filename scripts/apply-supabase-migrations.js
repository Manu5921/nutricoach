#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = 'https://sgombrccebqutpompbjj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21icmNjZWJxdXRwb21wYmpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgzOTk1NSwiZXhwIjoyMDY2NDE1OTU1fQ.C96QktQzrTbZ4lm1gQPT6sJ9doSaIpXrHakxiyw2MXU'

console.log('🚀 Application des migrations Supabase NutriCoach...\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLFile(filePath, description) {
  console.log(`📋 ${description}...`)
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8')
    
    // Diviser en déclarations (simple split par ';')
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '')
      .map(s => s + ';')

    console.log(`  📊 ${statements.length} déclarations SQL à exécuter`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Ignorer les commentaires et lignes vides
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement
        })
        
        if (error) {
          // Certaines erreurs sont acceptables (ex: "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            process.stdout.write('!')
          } else {
            console.error(`\n  ❌ Erreur SQL: ${error.message}`)
            console.error(`  📝 Statement: ${statement.substring(0, 100)}...`)
            errorCount++
            process.stdout.write('✗')
          }
        } else {
          process.stdout.write('.')
          successCount++
        }
      } catch (err) {
        console.error(`\n  💥 Exception: ${err.message}`)
        errorCount++
        process.stdout.write('✗')
      }
    }

    console.log(`\n  ✅ Migration terminée: ${successCount} succès, ${errorCount} erreurs`)
    return errorCount === 0

  } catch (error) {
    console.error(`  ❌ Erreur lecture fichier: ${error.message}`)
    return false
  }
}

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`)
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error(`  ❌ ${error.message}`)
      return false
    } else {
      console.log(`  ✅ Exécuté avec succès`)
      return true
    }
  } catch (err) {
    console.error(`  💥 Exception: ${err.message}`)
    return false
  }
}

async function verifyTables() {
  console.log('🔍 Vérification des tables créées...')
  
  const tables = [
    'user_profiles',
    'ingredients', 
    'recipes',
    'recipe_ingredients',
    'categories'
  ]

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
}

async function seedData() {
  console.log('\n🌱 Chargement des données seed...')
  
  // Vérifier si on a déjà des données
  const { data: existingIngredients } = await supabase
    .from('ingredients')
    .select('id')
    .limit(1)

  if (existingIngredients && existingIngredients.length > 0) {
    console.log('  ℹ️ Données déjà présentes, seed ignoré')
    return true
  }

  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql')
  return await executeSQLFile(seedPath, 'Chargement des données nutritionnelles')
}

async function main() {
  try {
    // 1. Appliquer le schéma principal
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')
    
    const migrationSuccess = await executeSQLFile(
      migrationPath, 
      'Application du schéma de base de données'
    )

    if (!migrationSuccess) {
      console.log('\n⚠️ Certaines erreurs de migration sont normales (objets existants)')
    }

    // 2. Vérifier que les tables existent
    await verifyTables()

    // 3. Charger les données seed
    await seedData()

    // 4. Test final
    console.log('\n🔍 Test final de la connexion...')
    const { data: testData, error: testError } = await supabase
      .from('ingredients')
      .select('name')
      .limit(3)

    if (testError) {
      console.error(`  ❌ Test final échoué: ${testError.message}`)
    } else {
      console.log(`  ✅ Test réussi: ${testData?.length || 0} ingrédients trouvés`)
      if (testData && testData.length > 0) {
        console.log(`  📋 Exemples: ${testData.map(i => i.name).join(', ')}`)
      }
    }

    console.log('\n🎉 Migration Supabase terminée !')
    console.log('🔗 Test maintenant: https://nutricoach-production.up.railway.app/signup')

  } catch (error) {
    console.error('\n💥 Erreur critique:', error.message)
    process.exit(1)
  }
}

// Exécution
main()