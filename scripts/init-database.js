#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🚀 Initializing NutriCoach database...')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function initDatabase() {
  try {
    // Check connection
    console.log('📡 Testing Supabase connection...')
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.log('🔨 Database not initialized, running migrations...')
      
      // Read and execute migration file
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      
      // Split by statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      console.log(`📋 Executing ${statements.length} migration statements...`)
      
      for (let i = 0; i < statements.length; i++) {
        try {
          const statement = statements[i] + ';'
          await supabase.rpc('exec_sql', { sql: statement })
          process.stdout.write('.')
        } catch (err) {
          // Some statements might fail if already exist, that's ok
          process.stdout.write('!')
        }
      }
      
      console.log('\n✅ Migration completed')
    } else {
      console.log('✅ Database already initialized')
    }
    
    // Load seed data
    console.log('🌱 Loading seed data...')
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql')
    const seedSQL = fs.readFileSync(seedPath, 'utf8')
    
    // Execute seed data
    try {
      await supabase.rpc('exec_sql', { sql: seedSQL })
      console.log('✅ Seed data loaded successfully')
    } catch (err) {
      console.log('⚠️ Seed data partially loaded (some data may already exist)')
    }
    
    // Verify data
    console.log('🔍 Verifying database...')
    
    const { data: ingredients } = await supabase.from('ingredients').select('count')
    const { data: recipes } = await supabase.from('recipes').select('count')
    const { data: categories } = await supabase.from('categories').select('count')
    
    console.log(`📊 Database status:`)
    console.log(`   - Ingredients: ${ingredients?.[0]?.count || 0}`)
    console.log(`   - Recipes: ${recipes?.[0]?.count || 0}`)
    console.log(`   - Categories: ${categories?.[0]?.count || 0}`)
    
    console.log('\n🎉 Database initialization completed!')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    process.exit(1)
  }
}

// Alternative simple initialization
async function simpleInit() {
  try {
    console.log('🔍 Checking if tables exist...')
    
    // Test basic table access
    const { data, error } = await supabase
      .from('ingredients')
      .select('name')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ Tables not found. Please run migrations manually in Supabase dashboard.')
      console.log('📋 Copy the content of supabase/migrations/001_initial_schema.sql')
      console.log('🔗 Go to: https://supabase.com/dashboard/project/sgombrccebqutpompbjj/sql')
      return
    }
    
    console.log('✅ Tables accessible')
    
    // Check if we have data
    const { data: ingredientCount } = await supabase
      .from('ingredients')
      .select('id', { count: 'exact' })
    
    if (!ingredientCount || ingredientCount.length === 0) {
      console.log('🌱 No data found, database is ready for seeding')
      console.log('📋 Copy the content of supabase/seed.sql to Supabase dashboard')
    } else {
      console.log(`✅ Database has ${ingredientCount.length} ingredients`)
    }
    
    console.log('🎉 Database check completed!')
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

// Run simple init
simpleInit()