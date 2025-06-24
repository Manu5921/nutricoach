import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { BaseComponentProps } from "@/types"

/**
 * Button component variants using CVA for health-focused design
 * Optimized for accessibility and clear visual hierarchy
 */
const buttonVariants = cva(
  /* Base styles for all buttons */
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95 transition-transform duration-100",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
  ],
  {
    variants: {
      variant: {
        /* Primary - Main green for key actions */
        default: [
          "bg-primary-500 text-white shadow-sm",
          "hover:bg-primary-600",
          "active:bg-primary-700"
        ],
        
        /* Secondary - Orange for secondary actions */
        secondary: [
          "bg-secondary-500 text-white shadow-sm",
          "hover:bg-secondary-600", 
          "active:bg-secondary-700"
        ],
        
        /* Tertiary - Blue for tertiary actions */
        tertiary: [
          "bg-tertiary-500 text-white shadow-sm",
          "hover:bg-tertiary-600",
          "active:bg-tertiary-700"
        ],
        
        /* Success - For positive actions */
        success: [
          "bg-success-500 text-white shadow-sm",
          "hover:bg-success-600",
          "active:bg-success-700"
        ],
        
        /* Warning - For caution actions */
        warning: [
          "bg-warning-500 text-warning-900 shadow-sm",
          "hover:bg-warning-600",
          "active:bg-warning-700"
        ],
        
        /* Destructive - For dangerous actions */
        destructive: [
          "bg-error-500 text-white shadow-sm",
          "hover:bg-error-600",
          "active:bg-error-700"
        ],
        
        /* Outline variants */
        outline: [
          "border border-input bg-background text-foreground shadow-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/90"
        ],
        
        "outline-primary": [
          "border border-primary-300 text-primary-700 bg-transparent shadow-sm",
          "hover:bg-primary-50 hover:border-primary-400",
          "active:bg-primary-100"
        ],
        
        "outline-secondary": [
          "border border-secondary-300 text-secondary-700 bg-transparent shadow-sm",
          "hover:bg-secondary-50 hover:border-secondary-400",
          "active:bg-secondary-100"
        ],
        
        /* Ghost variants */
        ghost: [
          "text-foreground bg-transparent",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/90"
        ],
        
        "ghost-primary": [
          "text-primary-700 bg-transparent",
          "hover:bg-primary-50 hover:text-primary-800",
          "active:bg-primary-100"
        ],
        
        "ghost-secondary": [
          "text-secondary-700 bg-transparent", 
          "hover:bg-secondary-50 hover:text-secondary-800",
          "active:bg-secondary-100"
        ],
        
        /* Link style */
        link: [
          "text-primary-600 underline-offset-4 bg-transparent p-0 h-auto",
          "hover:underline hover:text-primary-700",
          "active:text-primary-800"
        ]
      },
      
      size: {
        xs: "h-7 rounded px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9"
      },
      
      /* Loading state */
      loading: {
        true: "cursor-not-allowed",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    BaseComponentProps {
  /** Render as child component (polymorphic) */
  asChild?: boolean
  /** Show loading state with spinner */
  loading?: boolean
  /** Loading text to show when loading */
  loadingText?: string
  /** Icon to show before text */
  leftIcon?: React.ReactNode
  /** Icon to show after text */
  rightIcon?: React.ReactNode
}

/**
 * Button component with health-focused styling and accessibility
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button>Add to Meal Plan</Button>
 * 
 * // Secondary action
 * <Button variant="secondary">View Recipe</Button>
 * 
 * // With loading state
 * <Button loading loadingText="Saving...">Save Recipe</Button>
 * 
 * // With icons
 * <Button leftIcon={<PlusIcon />}>Add Ingredient</Button>
 * 
 * // As link
 * <Button asChild variant="link">
 *   <Link href="/recipes">Browse Recipes</Link>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingText,
      asChild = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    /* Show loading text if provided, otherwise show children */
    const content = loading && loadingText ? loadingText : children
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Left icon */}
        {!loading && leftIcon && (
          <span className="mr-1">{leftIcon}</span>
        )}
        
        {/* Button content */}
        {content}
        
        {/* Right icon */}
        {!loading && rightIcon && (
          <span className="ml-1">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }