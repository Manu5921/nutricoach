import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn, formatDuration, formatInflammationScore, getCookingDifficulty } from "@/lib/utils"
import { Button } from "../primitives/button"
import { Card } from "../primitives/card"
import type { BaseComponentProps } from "@/types"

/**
 * Recipe card variants for different layouts and contexts
 */
const recipeCardVariants = cva(
  ["group relative overflow-hidden transition-all duration-200"],
  {
    variants: {
      variant: {
        default: "hover:shadow-lg",
        featured: "border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100/50",
        compact: "hover:shadow-md",
        detailed: "hover:shadow-xl"
      },
      size: {
        sm: "max-w-sm",
        default: "max-w-md",
        lg: "max-w-lg",
        full: "w-full"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface RecipeCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof recipeCardVariants>,
    BaseComponentProps {
  /** Recipe data */
  recipe: {
    id: string
    name: string
    description?: string
    image?: string
    prepTime: number // minutes
    cookTime: number // minutes  
    servings: number
    difficulty?: "easy" | "medium" | "hard"
    tags?: string[]
    nutrition?: {
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber?: number
    }
    inflammationScore?: number
    rating?: number
    totalRatings?: number
    author?: {
      name: string
      avatar?: string
    }
    isBookmarked?: boolean
    isPremium?: boolean
  }
  /** Card actions */
  actions?: {
    onBookmark?: (recipeId: string) => void
    onView?: (recipeId: string) => void
    onShare?: (recipeId: string) => void
    onAddToMealPlan?: (recipeId: string) => void
  }
  /** Show detailed nutrition info */
  showNutrition?: boolean
  /** Show cooking badges */
  showBadges?: boolean
  /** Layout orientation */
  orientation?: "vertical" | "horizontal"
}

/**
 * Recipe Card component for displaying recipe information
 * Optimized for nutrition and health-focused content
 * 
 * @example
 * ```tsx
 * <RecipeCard
 *   recipe={{
 *     id: "1",
 *     name: "Anti-Inflammatory Quinoa Bowl",
 *     description: "A nutritious bowl packed with anti-inflammatory ingredients",
 *     image: "/images/quinoa-bowl.jpg",
 *     prepTime: 15,
 *     cookTime: 20,
 *     servings: 4,
 *     tags: ["anti-inflammatory", "vegan", "gluten-free"],
 *     nutrition: {
 *       calories: 420,
 *       protein: 15,
 *       carbs: 58,
 *       fat: 12,
 *       fiber: 8
 *     },
 *     inflammationScore: -2.5,
 *     rating: 4.8,
 *     totalRatings: 124
 *   }}
 *   actions={{
 *     onBookmark: (id) => console.log("Bookmark", id),
 *     onView: (id) => console.log("View", id),
 *     onAddToMealPlan: (id) => console.log("Add to meal plan", id)
 *   }}
 *   showNutrition
 *   showBadges
 * />
 * ```
 */
const RecipeCard = React.forwardRef<HTMLDivElement, RecipeCardProps>(
  (
    {
      className,
      variant,
      size,
      recipe,
      actions,
      showNutrition = false,
      showBadges = true,
      orientation = "vertical",
      ...props
    },
    ref
  ) => {
    const {
      id,
      name,
      description,
      image,
      prepTime,
      cookTime,
      servings,
      difficulty,
      tags = [],
      nutrition,
      inflammationScore,
      rating,
      totalRatings,
      author,
      isBookmarked = false,
      isPremium = false
    } = recipe

    const totalTime = prepTime + cookTime
    const calculatedDifficulty = difficulty || getCookingDifficulty(cookTime, prepTime, tags.length + 5)
    const inflammationData = inflammationScore ? formatInflammationScore(inflammationScore) : null

    const difficultyColors = {
      easy: "bg-success-100 text-success-700 border-success-200",
      medium: "bg-warning-100 text-warning-700 border-warning-200", 
      hard: "bg-error-100 text-error-700 border-error-200"
    }

    const isHorizontal = orientation === "horizontal"

    return (
      <Card
        ref={ref}
        className={cn(
          recipeCardVariants({ variant, size }),
          isHorizontal && "flex flex-row",
          className
        )}
        {...props}
      >
        {/* Recipe Image */}
        <div className={cn(
          "relative overflow-hidden",
          isHorizontal ? "w-48 flex-shrink-0" : "aspect-[4/3] w-full"
        )}>
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <svg
                className="h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {isPremium && (
              <span className="rounded-full bg-warning-500 px-2 py-1 text-xs font-medium text-white">
                Premium
              </span>
            )}
            {inflammationData && (
              <span className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                inflammationData.color === "success" 
                  ? "bg-success-500 text-white"
                  : inflammationData.color === "warning"
                  ? "bg-warning-500 text-white"
                  : "bg-error-500 text-white"
              )}>
                {inflammationData.formatted}
              </span>
            )}
          </div>

          {/* Bookmark button */}
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/90 text-neutral-700 hover:bg-white"
              onClick={() => actions?.onBookmark?.(id)}
            >
              <svg
                className={cn("h-4 w-4", isBookmarked && "fill-current text-primary-600")}
                fill={isBookmarked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </Button>
          </div>

          {/* Bottom time badge */}
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white">
              {formatDuration(totalTime)}
            </span>
          </div>
        </div>

        {/* Recipe Content */}
        <div className={cn(
          "flex flex-col",
          isHorizontal ? "flex-1 p-4" : "p-4"
        )}>
          {/* Header */}
          <div className="mb-2">
            <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 group-hover:text-primary-700 transition-colors">
              {name}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.floor(rating) 
                        ? "text-warning-400 fill-current" 
                        : "text-neutral-300"
                    )}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {rating} {totalRatings && `(${totalRatings})`}
              </span>
            </div>
          )}

          {/* Recipe meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDuration(totalTime)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {servings} servings
            </span>
            {showBadges && (
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                difficultyColors[calculatedDifficulty]
              )}>
                {calculatedDifficulty}
              </span>
            )}
          </div>

          {/* Nutrition info */}
          {showNutrition && nutrition && (
            <div className="mb-3 rounded-lg bg-muted/50 p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="font-medium">{nutrition.calories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="font-medium">{nutrition.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="font-medium">{nutrition.carbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fat:</span>
                  <span className="font-medium">{nutrition.fat}g</span>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Author */}
          {author && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-700">
                    {author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-muted-foreground">by {author.name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => actions?.onView?.(id)}
            >
              View Recipe
            </Button>
            {actions?.onAddToMealPlan && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => actions.onAddToMealPlan(id)}
              >
                Add to Plan
              </Button>
            )}
            {actions?.onShare && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => actions.onShare(id)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }
)

RecipeCard.displayName = "RecipeCard"

export { RecipeCard, recipeCardVariants }
export type { RecipeCardProps }