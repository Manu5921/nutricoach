# NutriCoach Core Services - Usage Examples

This document provides comprehensive examples of how to use the core nutrition services implemented for the NutriCoach application.

## Table of Contents

1. [Service Initialization](#service-initialization)
2. [Auth Service Examples](#auth-service-examples)
3. [User Service Examples](#user-service-examples)
4. [Recipe Service Examples](#recipe-service-examples)
5. [API Routes Examples](#api-routes-examples)
6. [Error Handling](#error-handling)
7. [Validation Examples](#validation-examples)

## Service Initialization

### Server-Side (Next.js App Router)

```typescript
import { createServerSupabaseClient } from './lib/supabase'
import { AuthService, UserService, RecipeService } from '@nutricoach/core-nutrition'

// In an API route or Server Component
export async function initializeServices() {
  const supabase = await createServerSupabaseClient()
  
  return {
    authService: new AuthService(supabase),
    userService: new UserService(supabase),
    recipeService: new RecipeService(supabase),
  }
}
```

### Client-Side

```typescript
import { createClientSupabaseClient } from './lib/supabase'
import { AuthService, UserService, RecipeService } from '@nutricoach/core-nutrition'

// In a Client Component
const supabase = createClientSupabaseClient()
const authService = new AuthService(supabase)
const userService = new UserService(supabase)
const recipeService = new RecipeService(supabase)
```

## Auth Service Examples

### User Registration

```typescript
const authService = new AuthService(supabase)

const signupResult = await authService.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
  full_name: 'John Doe',
  terms_accepted: true,
})

if (signupResult.success && signupResult.data) {
  console.log('User created:', signupResult.data.user.id)
  console.log('Needs verification:', signupResult.data.needsVerification)
} else {
  console.error('Signup failed:', signupResult.error?.message)
}
```

### User Authentication

```typescript
const signinResult = await authService.signIn({
  email: 'user@example.com',
  password: 'securepassword123',
})

if (signinResult.success && signinResult.data) {
  console.log('User authenticated:', signinResult.data.user.id)
  console.log('Access token:', signinResult.data.session.access_token)
} else {
  console.error('Signin failed:', signinResult.error?.message)
}
```

### Get Current User

```typescript
const userResult = await authService.getCurrentUser()

if (userResult.success && userResult.data) {
  console.log('Current user:', userResult.data.email)
} else {
  console.log('User not authenticated')
}
```

## User Service Examples

### Get User Profile

```typescript
const userService = new UserService(supabase)

const profileResult = await userService.getUserById('user-id-here')

if (profileResult.success && profileResult.data) {
  const profile = profileResult.data
  console.log('User profile:', {
    name: profile.full_name,
    age: profile.age,
    bmi: profile.bmi,
    bmr: profile.bmr,
    tdee: profile.tdee,
  })
}
```

### Update User Profile

```typescript
const updateResult = await userService.updateUser('user-id-here', {
  full_name: 'Jane Doe',
  height_cm: 165,
  weight_kg: 65,
  date_of_birth: '1990-05-15',
  gender: 'female',
  activity_level: 'moderate',
  dietary_preferences: ['vegetarian', 'gluten-free'],
  allergies: ['nuts'],
  health_goals: ['weight_loss', 'muscle_gain'],
})

if (updateResult.success && updateResult.data) {
  console.log('Profile updated successfully')
  console.log('New BMI:', updateResult.data.bmi)
  console.log('New TDEE:', updateResult.data.tdee)
}
```

### Calculate Nutrition Goals

```typescript
const goalsResult = await userService.calculateNutritionGoals('user-id-here')

if (goalsResult.success && goalsResult.data) {
  console.log('Nutrition goals calculated:', {
    dailyCalories: goalsResult.data.daily_calories,
    protein: goalsResult.data.daily_protein_g,
    carbs: goalsResult.data.daily_carbs_g,
    fat: goalsResult.data.daily_fat_g,
  })
}
```

### Search Users

```typescript
const searchResult = await userService.searchUsers({
  query: 'john',
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
  activity_level: 'moderate',
  age_min: 25,
  age_max: 35,
})

if (searchResult.success && searchResult.data) {
  console.log('Found users:', searchResult.data.data.length)
  console.log('Total pages:', searchResult.data.pagination.totalPages)
}
```

## Recipe Service Examples

### Create Recipe

```typescript
const recipeService = new RecipeService(supabase)

const recipeData = {
  user_id: 'user-id-here',
  title: 'Healthy Chicken Salad',
  description: 'A nutritious and delicious chicken salad perfect for lunch',
  ingredients: [
    {
      id: crypto.randomUUID(),
      name: 'Chicken breast',
      quantity: 200,
      unit: 'g',
      nutrition_per_unit: {
        calories: 165,
        protein_g: 31,
        carbs_g: 0,
        fat_g: 3.6,
      },
    },
    {
      id: crypto.randomUUID(),
      name: 'Mixed greens',
      quantity: 100,
      unit: 'g',
      nutrition_per_unit: {
        calories: 20,
        protein_g: 2,
        carbs_g: 4,
        fat_g: 0.3,
      },
    },
  ],
  instructions: [
    'Cook chicken breast until fully cooked',
    'Let chicken cool and slice into strips',
    'Mix with fresh greens',
    'Serve immediately',
  ],
  prep_time_minutes: 15,
  cook_time_minutes: 20,
  servings: 2,
  difficulty_level: 'easy' as const,
  cuisine_type: 'American',
  dietary_tags: ['high-protein', 'low-carb'],
  nutrition_per_serving: {
    calories: 185,
    protein_g: 33,
    carbs_g: 4,
    fat_g: 3.9,
  },
  is_public: true,
}

const createResult = await recipeService.createRecipe(recipeData)

if (createResult.success && createResult.data) {
  console.log('Recipe created:', createResult.data.id)
  console.log('Total time:', createResult.data.total_time_minutes, 'minutes')
}
```

### Search Recipes

```typescript
const searchResult = await recipeService.searchRecipes({
  query: 'chicken',
  page: 1,
  limit: 10,
  sortBy: 'created_at',
  sortOrder: 'desc',
  filters: {
    cuisine_type: ['American', 'Mediterranean'],
    dietary_tags: ['high-protein'],
    difficulty_level: ['easy', 'medium'],
    max_prep_time: 30,
    max_calories_per_serving: 300,
  },
})

if (searchResult.success && searchResult.data) {
  console.log('Found recipes:', searchResult.data.data.length)
  searchResult.data.data.forEach(recipe => {
    console.log(`${recipe.title} - ${recipe.nutrition_per_serving.calories} cal`)
  })
}
```

### Calculate Nutrition

```typescript
const nutritionResult = await recipeService.calculateNutrition({
  ingredients: [
    {
      id: crypto.randomUUID(),
      name: 'Oats',
      quantity: 50,
      unit: 'g',
      nutrition_per_unit: {
        calories: 389,
        protein_g: 16.9,
        carbs_g: 66.3,
        fat_g: 6.9,
      },
    },
    {
      id: crypto.randomUUID(),
      name: 'Banana',
      quantity: 1,
      unit: 'medium',
      nutrition_per_unit: {
        calories: 105,
        protein_g: 1.3,
        carbs_g: 27,
        fat_g: 0.4,
      },
    },
  ],
  servings: 1,
  calculate_per_100g: true,
})

if (nutritionResult.success && nutritionResult.data) {
  console.log('Per serving:', nutritionResult.data.per_serving)
  console.log('Per 100g:', nutritionResult.data.per_100g)
}
```

## API Routes Examples

### Authentication

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "John Doe",
    "terms_accepted": true
  }'

# Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'

# Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### User Management

```bash
# Get user profile
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Update user profile
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "full_name": "Jane Doe",
    "height_cm": 165,
    "weight_kg": 65,
    "activity_level": "moderate"
  }'

# Calculate nutrition goals
curl -X POST http://localhost:3000/api/users/USER_ID/nutrition-goals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Recipe Management

```bash
# Search recipes
curl -X GET "http://localhost:3000/api/recipes?query=chicken&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create recipe
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Healthy Chicken Salad",
    "description": "A nutritious chicken salad",
    "ingredients": [...],
    "instructions": [...],
    "servings": 2,
    "difficulty_level": "easy",
    "nutrition_per_serving": {...}
  }'

# Calculate nutrition
curl -X POST http://localhost:3000/api/recipes/calculate-nutrition \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [...],
    "servings": 2,
    "calculate_per_100g": true
  }'
```

## Error Handling

### Service Error Handling

```typescript
import { safeAsync, formatServiceError } from '@nutricoach/core-nutrition'

// Using safeAsync wrapper
const result = await safeAsync(async () => {
  return await userService.getUserById('invalid-id')
})

if (result.error) {
  console.error('Service error:', result.error.message)
  console.error('Error code:', result.error.code)
}

// Manual error handling
try {
  const userResult = await userService.getUserById('user-id')
  if (userResult.error) {
    const formattedError = formatServiceError(userResult.error)
    console.error('Formatted error:', formattedError)
  }
} catch (error) {
  console.error('Unexpected error:', error)
}
```

### API Error Responses

```typescript
// Example error response structure
{
  "success": false,
  "error": {
    "message": "Validation failed: Email is required",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "value": ""
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123"
  }
}
```

## Validation Examples

### User Data Validation

```typescript
import { UserSignUpSchema, UserUpdateSchema, formatZodError } from '@nutricoach/core-nutrition'

// Validate signup data
const signupData = {
  email: 'user@example.com',
  password: 'securepassword123',
  full_name: 'John Doe',
  terms_accepted: true,
}

const signupValidation = UserSignUpSchema.safeParse(signupData)
if (!signupValidation.success) {
  const errors = formatZodError(signupValidation.error)
  console.error('Validation errors:', errors)
}

// Validate update data
const updateData = {
  height_cm: 175,
  weight_kg: 70,
  date_of_birth: '1990-01-01',
  activity_level: 'moderate',
}

const updateValidation = UserUpdateSchema.safeParse(updateData)
if (updateValidation.success) {
  console.log('Update data is valid:', updateValidation.data)
}
```

### Recipe Data Validation

```typescript
import { RecipeInsertSchema, RecipeBusinessRulesSchema } from '@nutricoach/core-nutrition'

const recipeData = {
  user_id: 'user-id-here',
  title: 'Test Recipe',
  ingredients: [
    {
      id: crypto.randomUUID(),
      name: 'Test Ingredient',
      quantity: 100,
      unit: 'g',
    },
  ],
  instructions: ['Step 1', 'Step 2'],
  servings: 2,
  difficulty_level: 'easy',
  nutrition_per_serving: {
    calories: 200,
    protein_g: 10,
    carbs_g: 20,
    fat_g: 5,
  },
}

// Basic validation
const basicValidation = RecipeInsertSchema.safeParse(recipeData)

// Business rules validation
const businessValidation = RecipeBusinessRulesSchema.safeParse(recipeData)

if (!businessValidation.success) {
  console.error('Business rule violations:', formatZodError(businessValidation.error))
}
```

This examples document demonstrates the comprehensive usage of the NutriCoach core nutrition services, covering all major functionality including authentication, user management, recipe operations, API interactions, error handling, and data validation.