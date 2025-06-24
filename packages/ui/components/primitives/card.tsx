import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { BaseComponentProps } from "@/types"

/**
 * Card component variants for health-focused content containers
 */
const cardVariants = cva(
  [
    "rounded-lg border bg-card text-card-foreground shadow-sm",
    "transition-all duration-200"
  ],
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "border-border shadow-md hover:shadow-lg",
        outlined: "border-2 border-primary-200 bg-primary-50/50",
        success: "border-success-200 bg-success-50/50",
        warning: "border-warning-200 bg-warning-50/50",
        error: "border-error-200 bg-error-50/50"
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6",
        lg: "p-8"
      },
      interactive: {
        true: "cursor-pointer hover:shadow-md active:scale-[0.98] transition-transform",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: false
    }
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants>,
    BaseComponentProps {
  /** Click handler for interactive cards */
  onCardClick?: () => void
}

/**
 * Card component for content containers
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive,
      onCardClick,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (onCardClick) {
        onCardClick()
      }
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive }),
          className
        )}
        onClick={(onCardClick || onClick) ? handleClick : undefined}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      />
    )
  }
)

Card.displayName = "Card"

/**
 * Card Header component
 */
export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BaseComponentProps {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
)

CardHeader.displayName = "CardHeader"

/**
 * Card Title component
 */
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    BaseComponentProps {
  /** Heading level */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 3, children, ...props }, ref) => {
    const Heading = `h${level}` as const

    return (
      <Heading
        ref={ref as any}
        className={cn(
          "font-semibold leading-none tracking-tight",
          {
            "text-2xl": level === 1,
            "text-xl": level === 2,
            "text-lg": level === 3,
            "text-base": level === 4,
            "text-sm": level === 5,
            "text-xs": level === 6
          },
          className
        )}
        {...props}
      >
        {children}
      </Heading>
    )
  }
)

CardTitle.displayName = "CardTitle"

/**
 * Card Description component
 */
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    BaseComponentProps {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)

CardDescription.displayName = "CardDescription"

/**
 * Card Content component
 */
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BaseComponentProps {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("pt-0", className)}
      {...props}
    />
  )
)

CardContent.displayName = "CardContent"

/**
 * Card Footer component
 */
export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BaseComponentProps {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-0", className)}
      {...props}
    />
  )
)

CardFooter.displayName = "CardFooter"

/**
 * Health-specific Recipe Card component
 */
export interface RecipeCardProps extends CardProps {
  recipe: {
    id: string
    name: string
    description: string
    prepTime: number
    cookTime: number
    servings: number
    difficulty: "easy" | "medium" | "hard"
    inflammationScore: number
    image?: string
  }
  onRecipeClick?: (recipeId: string) => void
}

const RecipeCard = React.forwardRef<HTMLDivElement, RecipeCardProps>(
  ({ recipe, onRecipeClick, className, ...props }, ref) => {
    const difficultyColors = {
      easy: "bg-success-100 text-success-800",
      medium: "bg-warning-100 text-warning-800", 
      hard: "bg-error-100 text-error-800"
    }

    const inflammationColor = recipe.inflammationScore <= 0 
      ? "text-success-600" 
      : recipe.inflammationScore <= 2 
        ? "text-warning-600"
        : "text-error-600"

    return (
      <Card
        ref={ref}
        variant="elevated"
        interactive
        className={cn("overflow-hidden", className)}
        onCardClick={() => onRecipeClick?.(recipe.id)}
        {...props}
      >
        {/* Recipe Image */}
        {recipe.image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle level={4} className="line-clamp-2">
              {recipe.name}
            </CardTitle>
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              difficultyColors[recipe.difficulty]
            )}>
              {recipe.difficulty}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Recipe Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.prepTime + recipe.cookTime}m
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {recipe.servings} servings
            </div>
            <div className={cn("flex items-center gap-1 font-medium", inflammationColor)}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {recipe.inflammationScore > 0 ? '+' : ''}{recipe.inflammationScore.toFixed(1)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

RecipeCard.displayName = "RecipeCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  RecipeCard,
  cardVariants
}

export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  RecipeCardProps
}