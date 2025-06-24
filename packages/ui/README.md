# 🥗 NutriCoach UI Design System

A comprehensive, health-focused design system built specifically for anti-inflammatory nutrition applications. Built with accessibility, wellness principles, and evidence-based design decisions at its core.

## 🌟 Key Features

### Health-Focused Color Psychology
- **Primary Green**: Health, nature, balance, anti-inflammatory foods
- **Secondary Orange**: Energy, warmth, appetite stimulation, social interaction
- **Tertiary Blue**: Trust, calm, hydration, stability
- **OKLCH Color Space**: Perceptually uniform colors for better accessibility

### Technology Stack
- **Tailwind CSS v4** with `@theme` directive for CSS-first configuration
- **Radix UI** primitives for accessibility and keyboard navigation
- **Class Variance Authority (CVA)** for type-safe component variants
- **TypeScript** for complete type safety
- **React 18+** with modern patterns

### Design Principles
1. **Accessibility First**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
2. **Anti-Inflammatory Visual Design**: Calming colors, gentle interactions, stress-reducing UI
3. **Evidence-Based**: Color choices based on nutrition and psychology research
4. **Scalable**: Consistent design tokens and component architecture

## 📦 Installation

```bash
# In your app directory
npm install @nutricoach/ui

# Or with yarn
yarn add @nutricoach/ui

# Or with pnpm
pnpm add @nutricoach/ui
```

## 🚀 Quick Start

### 1. Import Global Styles

```tsx
// In your app/layout.tsx or _app.tsx
import "@nutricoach/ui/styles/globals.css"
```

### 2. Configure Tailwind

```js
// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ... rest of config
}
```

### 3. Use Components

```tsx
import { Button, Card, Input, NutriNavBar } from "@nutricoach/ui"

function MyApp() {
  return (
    <div>
      <NutriNavBar activeRoute="/dashboard" />
      
      <Card>
        <CardHeader>
          <CardTitle>Anti-Inflammatory Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            label="Recipe Name"
            placeholder="Golden Turmeric Bowl"
          />
          <Button variant="primary">Save Recipe</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🎨 Design System

### Color Palette

Our color system is built using the OKLCH color space for perceptual uniformity and better accessibility:

```css
/* Primary Green - Health & Nature */
--color-primary-500: oklch(0.723 0.219 149.579);

/* Secondary Orange - Energy & Warmth */  
--color-secondary-500: oklch(0.705 0.213 47.604);

/* Tertiary Blue - Trust & Calm */
--color-tertiary-500: oklch(0.623 0.214 259.815);
```

### Typography Scale

```css
/* Optimized for readability */
--font-sans: "Inter", system-ui, sans-serif;
--font-heading: "Cal Sans", "Inter", system-ui, sans-serif;

/* Responsive type scale */
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
```

### Spacing System

8-point grid system for consistent spacing:

```css
--spacing-1: 4px;   /* 0.25rem */
--spacing-2: 8px;   /* 0.5rem */
--spacing-4: 16px;  /* 1rem */
--spacing-6: 24px;  /* 1.5rem */
```

## 🧩 Components

### Primitive Components

#### Button
Multiple variants for different health-focused actions:

```tsx
<Button variant="default">Add to Meal Plan</Button>
<Button variant="secondary">View Recipe</Button>
<Button variant="success">Save Progress</Button>
<Button variant="outline-primary">Learn More</Button>
<Button variant="ghost">Cancel</Button>
<Button loading loadingText="Saving...">Save</Button>
```

#### Input
Form inputs with validation states:

```tsx
<Input
  label="Daily Calorie Goal"
  description="Target calories based on your goals"
  placeholder="2000"
  type="number"
  startIcon={<CaloriesIcon />}
/>

<Input
  variant="error"
  error="Please enter a valid email"
  label="Email"
/>

<Input
  variant="success"
  success="Email verified!"
  label="Email"
/>
```

#### Card
Flexible containers for content:

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Recipe Details</CardTitle>
    <CardDescription>Nutritional information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>View Recipe</Button>
  </CardFooter>
</Card>
```

### Composite Components

#### RecipeCard
Specialized card for recipe display:

```tsx
<RecipeCard
  recipe={{
    id: "1",
    name: "Anti-Inflammatory Golden Bowl",
    description: "Turmeric and ginger-rich recipe",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: "easy",
    inflammationScore: -2.5,
    image: "/recipe-image.jpg"
  }}
  onRecipeClick={(id) => navigate(`/recipes/${id}`)}
/>
```

#### NutriNavBar
Complete navigation solution:

```tsx
<NutriNavBar
  activeRoute="/dashboard"
  userProfile={{
    name: "Sarah Johnson",
    email: "sarah@example.com",
    avatar: "/avatar.jpg"
  }}
  onSearch={(query) => handleSearch(query)}
  onUserAction={(action) => handleUserAction(action)}
/>
```

## 🎯 Health-Specific Features

### Inflammation Scoring
Built-in support for food inflammation scores:

```tsx
const { formatted, color, label } = formatInflammationScore(-2.5)
// formatted: "-2.5"
// color: "success"
// label: "Anti-inflammatory"
```

### Nutritional Values
Proper formatting for nutrition data:

```tsx
const calories = formatNutrition(250, "kcal")    // "250 kcal"
const protein = formatNutrition(15.5, "g")      // "15.5 g"
const vitamin = formatNutrition(0.75, "mg")     // "0.75 mg"
```

### Cooking Difficulty
Smart difficulty calculation:

```tsx
const difficulty = getCookingDifficulty(
  cookTime: 20,
  prepTime: 15,
  ingredientCount: 8
) // "easy"
```

## 🌓 Dark Mode Support

Automatic dark mode with health-appropriate adjustments:

```css
@media (prefers-color-scheme: dark) {
  @theme {
    /* Slightly desaturated colors for comfort */
    --color-primary-500: oklch(0.68 0.19 149.579);
    --color-background: var(--color-neutral-950);
    --color-foreground: var(--color-neutral-50);
  }
}
```

## ♿ Accessibility Features

- **WCAG 2.1 AA** compliant color contrast ratios
- **Keyboard navigation** for all interactive elements
- **Screen reader** support with proper ARIA labels
- **Focus management** with visible focus indicators
- **Reduced motion** support for animations

## 🔧 Utility Functions

### cn() - Class Name Merger
```tsx
import { cn } from "@nutricoach/ui"

<div className={cn("base-classes", variant && "variant-class", className)} />
```

### Formatting Utilities
```tsx
import { 
  formatNutrition,
  formatInflammationScore,
  formatDuration,
  formatWeight,
  calculateBMI
} from "@nutricoach/ui"
```

## 📱 Responsive Design

Mobile-first approach with health-focused breakpoints:

```css
--breakpoint-xs: 475px;   /* Small phones */
--breakpoint-sm: 640px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1400px; /* Large screens */
```

## 🧪 Development

### Setup
```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build package
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Component Development Guidelines

1. **Accessibility First**: Every component should be keyboard navigable and screen reader friendly
2. **Health Psychology**: Use colors and interactions that promote calm and wellness
3. **Type Safety**: Full TypeScript support with proper prop types
4. **Consistent API**: Follow established patterns for props and variants
5. **Performance**: Optimize for tree shaking and minimal bundle size

### Adding New Components

1. Create component in appropriate category folder
2. Export from category index file
3. Add to main package exports
4. Include in showcase page
5. Write comprehensive JSDoc comments
6. Add accessibility tests

## 📚 Examples

Check out our comprehensive showcase page at `/ui-showcase` to see all components in action with various states and configurations.

## 🤝 Contributing

1. Follow the established design principles
2. Maintain accessibility standards
3. Include proper TypeScript types
4. Add comprehensive documentation
5. Test across different devices and browsers

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for better health through better nutrition design.