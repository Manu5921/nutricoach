"use client"

import React from "react"
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  RecipeCard,
  NutriNavBar
} from "@nutricoach/ui"

/**
 * UI Showcase page demonstrating the NutriCoach design system
 */
export default function UIShowcasePage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  const mockRecipe = {
    id: "1",
    name: "Anti-Inflammatory Golden Turmeric Bowl",
    description: "A nourishing bowl packed with turmeric, ginger, and omega-3 rich ingredients to reduce inflammation and boost energy.",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: "easy" as const,
    tags: ["anti-inflammatory", "vegan", "gluten-free", "turmeric", "omega-3"],
    nutrition: {
      calories: 420,
      protein: 15,
      carbs: 58,
      fat: 12,
      fiber: 8
    },
    inflammationScore: -2.5,
    rating: 4.8,
    totalRatings: 124,
    author: {
      name: "Dr. Sarah Williams",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face"
    },
    isBookmarked: false,
    isPremium: false,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
  }

  const mockUser = {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=64&h=64&fit=crop&crop=face"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <NutriNavBar
        activeRoute="/ui-showcase"
        userProfile={mockUser}
        onSearch={(query) => setSearchQuery(query)}
        onUserAction={(action) => console.log("User action:", action)}
      />

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            NutriCoach UI Design System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A health-focused design system built with accessibility, wellness, and 
            anti-inflammatory principles at its core.
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Colors */}
            <Card>
              <CardHeader>
                <CardTitle level={3}>Primary Green</CardTitle>
                <CardDescription>Health, nature, balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {[100, 300, 500, 700, 900].map((shade) => (
                    <div key={shade} className="space-y-2">
                      <div 
                        className={`h-12 rounded border`}
                        style={{ backgroundColor: `var(--color-primary-${shade})` }}
                      />
                      <p className="text-xs text-center">{shade}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Secondary Colors */}
            <Card>
              <CardHeader>
                <CardTitle level={3}>Secondary Orange</CardTitle>
                <CardDescription>Energy, warmth, appetite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {[100, 300, 500, 700, 900].map((shade) => (
                    <div key={shade} className="space-y-2">
                      <div 
                        className={`h-12 rounded border`}
                        style={{ backgroundColor: `var(--color-secondary-${shade})` }}
                      />
                      <p className="text-xs text-center">{shade}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tertiary Colors */}
            <Card>
              <CardHeader>
                <CardTitle level={3}>Tertiary Blue</CardTitle>
                <CardDescription>Trust, calm, hydration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {[100, 300, 500, 700, 900].map((shade) => (
                    <div key={shade} className="space-y-2">
                      <div 
                        className={`h-12 rounded border`}
                        style={{ backgroundColor: `var(--color-tertiary-${shade})` }}
                      />
                      <p className="text-xs text-center">{shade}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Variants */}
            <Card>
              <CardHeader>
                <CardTitle level={4}>Primary Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="default">Add to Meal Plan</Button>
                <Button variant="secondary">View Recipe</Button>
                <Button variant="tertiary">Learn More</Button>
                <Button variant="success">Save Progress</Button>
                <Button variant="warning">Review Goals</Button>
                <Button variant="destructive">Delete Recipe</Button>
              </CardContent>
            </Card>

            {/* Outline Variants */}
            <Card>
              <CardHeader>
                <CardTitle level={4}>Outline Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline">Default Outline</Button>
                <Button variant="outline-primary">Primary Outline</Button>
                <Button variant="outline-secondary">Secondary Outline</Button>
              </CardContent>
            </Card>

            {/* Ghost & States */}
            <Card>
              <CardHeader>
                <CardTitle level={4}>Ghost & States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="ghost-primary">Ghost Primary</Button>
                <Button variant="link">Link Button</Button>
                <Button loading loadingText="Saving...">Loading</Button>
                <Button disabled>Disabled</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Input Fields</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle level={4}>Form Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  label="Daily Calorie Goal"
                  description="Target calories per day based on your goals"
                  placeholder="2000"
                  type="number"
                />
                
                <Input
                  label="Email Address"
                  placeholder="sarah@example.com"
                  type="email"
                  startIcon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                <Input
                  label="Search Recipes"
                  placeholder="Anti-inflammatory turmeric..."
                  startIcon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                  endIcon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle level={4}>Validation States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  label="Valid Email"
                  variant="success"
                  success="Email address is valid"
                  value="sarah@example.com"
                />
                
                <Input
                  label="Invalid Input"
                  variant="error"
                  error="Please enter a valid weight (minimum 30kg)"
                  value="invalid"
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  description="Minimum 8 characters with numbers and symbols"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recipe Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Recipe Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecipeCard
              recipe={mockRecipe}
              actions={{
                onBookmark: (id) => console.log("Bookmark:", id),
                onView: (id) => console.log("View recipe:", id),
                onShare: (id) => console.log("Share:", id),
                onAddToMealPlan: (id) => console.log("Add to meal plan:", id)
              }}
              showNutrition
              showBadges
            />
            
            <RecipeCard
              recipe={{
                ...mockRecipe,
                id: "2",
                name: "Mediterranean Quinoa Salad",
                description: "Fresh vegetables, herbs, and quinoa with olive oil dressing.",
                difficulty: "medium",
                tags: ["mediterranean", "quinoa", "healthy", "vegetarian"],
                nutrition: {
                  calories: 350,
                  protein: 12,
                  carbs: 45,
                  fat: 14,
                  fiber: 6
                },
                inflammationScore: -1.2,
                rating: 4.5,
                totalRatings: 89,
                prepTime: 20,
                cookTime: 15,
                author: {
                  name: "Chef Maria",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
                },
                isBookmarked: true,
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop"
              }}
              actions={{
                onBookmark: (id) => console.log("Bookmark:", id),
                onView: (id) => console.log("View recipe:", id),
                onShare: (id) => console.log("Share:", id),
                onAddToMealPlan: (id) => console.log("Add to meal plan:", id)
              }}
              showNutrition
              showBadges
            />

            <RecipeCard
              recipe={{
                ...mockRecipe,
                id: "3",
                name: "Spicy Jalapeño Burger",
                description: "High-inflammatory processed foods with refined ingredients.",
                difficulty: "hard",
                tags: ["processed", "spicy", "fast-food"],
                nutrition: {
                  calories: 850,
                  protein: 35,
                  carbs: 45,
                  fat: 58,
                  fiber: 2
                },
                inflammationScore: 3.8,
                rating: 3.2,
                totalRatings: 45,
                prepTime: 30,
                cookTime: 25,
                author: {
                  name: "Fast Food Co",
                },
                isPremium: true,
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop"
              }}
              actions={{
                onBookmark: (id) => console.log("Bookmark:", id),
                onView: (id) => console.log("View recipe:", id),
                onShare: (id) => console.log("Share:", id)
              }}
              showNutrition
              showBadges
            />
          </div>

          {/* Horizontal Layout Example */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Horizontal Layout</h3>
            <RecipeCard
              recipe={{
                ...mockRecipe,
                id: "4",
                name: "Green Smoothie Power Bowl",
                description: "Energizing smoothie bowl with spinach, banana, and chia seeds.",
                tags: ["smoothie", "breakfast", "energy"],
                rating: 4.9,
                totalRatings: 200
              }}
              orientation="horizontal"
              actions={{
                onBookmark: (id) => console.log("Bookmark:", id),
                onView: (id) => console.log("View recipe:", id),
                onAddToMealPlan: (id) => console.log("Add to meal plan:", id)
              }}
              showNutrition
              showBadges
              size="full"
              className="max-w-2xl"
            />
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle level={4}>Default Card</CardTitle>
                <CardDescription>Standard card styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is the default card variant with subtle shadows.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle level={4}>Elevated Card</CardTitle>
                <CardDescription>Enhanced with hover effects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Elevated cards have more pronounced shadows and hover states.
                </p>
              </CardContent>
            </Card>

            <Card variant="success">
              <CardHeader>
                <CardTitle level={4}>Success Card</CardTitle>
                <CardDescription>For positive messaging</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use for achievements, completed goals, or positive feedback.
                </p>
              </CardContent>
            </Card>

            <Card variant="warning">
              <CardHeader>
                <CardTitle level={4}>Warning Card</CardTitle>
                <CardDescription>For important notices</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use for cautions, reminders, or important information.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Typography</h2>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">Heading 1 - Bold Impact</h1>
                <h2 className="text-3xl font-semibold text-foreground">Heading 2 - Section Titles</h2>
                <h3 className="text-2xl font-semibold text-foreground">Heading 3 - Subsections</h3>
                <h4 className="text-xl font-medium text-foreground">Heading 4 - Components</h4>
                <h5 className="text-lg font-medium text-foreground">Heading 5 - Labels</h5>
                <h6 className="text-base font-medium text-foreground">Heading 6 - Small Labels</h6>
              </div>
              
              <div className="space-y-2">
                <p className="text-base text-foreground">
                  Body text (base) - This is the standard paragraph text used throughout the application.
                  It's optimized for readability with proper line height and letter spacing.
                </p>
                <p className="text-sm text-muted-foreground">
                  Secondary text (small) - Used for descriptions, captions, and less important information.
                </p>
                <p className="text-xs text-muted-foreground">
                  Caption text (extra small) - Used for metadata, timestamps, and fine print.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground">
            NutriCoach UI Design System - Built with health and accessibility in mind
          </p>
        </div>
      </div>
    </div>
  )
}