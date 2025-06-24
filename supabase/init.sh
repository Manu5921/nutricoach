#!/bin/bash

# =============================================
# NutriCoach Supabase Initialization Script
# =============================================
# Automated setup for NutriCoach database

set -e  # Exit on any error

echo "🍃 Initializing NutriCoach Supabase Database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📍 Working directory: $(pwd)"

# Initialize Supabase project if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "🏗️  Initializing new Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Start local Supabase instance
echo "🚀 Starting local Supabase..."
supabase start

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Apply migrations
echo "📊 Applying database schema..."
supabase db reset --debug

# Load seed data
echo "🌱 Loading seed data..."
if [ -f "supabase/seed.sql" ]; then
    # Get database connection info
    DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
    
    if [ -z "$DB_URL" ]; then
        echo "⚠️  Could not get database URL, trying default connection..."
        psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql
    else
        psql "$DB_URL" -f supabase/seed.sql
    fi
    
    echo "✅ Seed data loaded successfully"
else
    echo "⚠️  No seed.sql file found, skipping seed data"
fi

# Generate TypeScript types
echo "🔄 Generating TypeScript types..."
supabase gen types typescript --local > supabase/types.generated.ts

# Run validation tests
echo "🧪 Running database validation..."
if [ -f "supabase/validate.sql" ]; then
    DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
    
    if [ -z "$DB_URL" ]; then
        echo "⚠️  Could not get database URL, trying default connection for validation..."
        psql -h localhost -p 54322 -U postgres -d postgres -f supabase/validate.sql
    else
        psql "$DB_URL" -f supabase/validate.sql
    fi
    
    echo "✅ Database validation completed"
else
    echo "⚠️  No validation script found, skipping validation"
fi

# Display connection info
echo ""
echo "🎉 NutriCoach Database Setup Complete!"
echo ""
echo "📋 Connection Details:"
supabase status

echo ""
echo "🔗 Quick Access URLs:"
echo "   🎨 Studio Dashboard: http://localhost:54323"
echo "   📡 API URL: http://localhost:54321"
echo "   📧 Inbucket (Email): http://localhost:54324"

echo ""
echo "🧪 Test the setup:"
echo "   curl http://localhost:54321/rest/v1/ingredients?select=name,anti_inflammatory_score&anti_inflammatory_score=gte.7"

echo ""
echo "📚 Next Steps:"
echo "   1. Configure your frontend with the API URL above"
echo "   2. Set up authentication in your app"
echo "   3. Import the generated types from supabase/types.generated.ts"
echo "   4. Start building your nutrition features!"

echo ""
echo "🛑 To stop Supabase: supabase stop"
echo "🔄 To restart: supabase start"
echo "📊 View logs: supabase logs"

# Optional: Open Studio in browser (macOS/Linux)
if command -v open &> /dev/null; then
    echo ""
    read -p "🌐 Open Supabase Studio in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:54323
    fi
fi

echo ""
echo "✨ Happy coding with NutriCoach!"