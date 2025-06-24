import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { BaseComponentProps } from "@/types"

/**
 * Input component variants for health-focused forms
 */
const inputVariants = cva(
  [
    "flex w-full rounded-md border bg-background text-foreground",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "transition-all duration-200"
  ],
  {
    variants: {
      variant: {
        default: [
          "border-input",
          "hover:border-primary-300",
          "focus:border-primary-500"
        ],
        error: [
          "border-error-300 focus:border-error-500",
          "focus-visible:ring-error-500"
        ],
        success: [
          "border-success-300 focus:border-success-500", 
          "focus-visible:ring-success-500"
        ]
      },
      size: {
        sm: "h-8 px-3 py-1 text-sm",
        default: "h-9 px-3 py-2",
        lg: "h-10 px-4 py-2",
        xl: "h-12 px-4 py-3 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants>,
    BaseComponentProps {
  /** Input label */
  label?: string
  /** Helper text below input */
  description?: string
  /** Error message */
  error?: string
  /** Success message */
  success?: string
  /** Icon to show at start of input */
  startIcon?: React.ReactNode
  /** Icon to show at end of input */
  endIcon?: React.ReactNode
  /** Wrapper for grouped inputs */
  wrapperClassName?: string
}

/**
 * Input component with health-focused styling and validation states
 * 
 * @example
 * ```tsx
 * // Basic input
 * <Input placeholder="Enter your name" />
 * 
 * // With label and description
 * <Input 
 *   label="Daily Calorie Goal"
 *   description="Target calories per day"
 *   type="number"
 *   placeholder="2000"
 * />
 * 
 * // With error state
 * <Input
 *   label="Email"
 *   variant="error"
 *   error="Please enter a valid email address"
 *   value="invalid-email"
 * />
 * 
 * // With icons
 * <Input
 *   placeholder="Search recipes..."
 *   startIcon={<SearchIcon />}
 *   endIcon={<FilterIcon />}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = "text",
      label,
      description,
      error,
      success,
      startIcon,
      endIcon,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const successId = success ? `${inputId}-success` : undefined
    
    /* Determine variant based on validation state */
    const inputVariant = error ? "error" : success ? "success" : variant

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-error-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Input container */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>
          )}
          
          {/* Input element */}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            ref={ref}
            aria-describedby={cn(
              descriptionId,
              errorId,
              successId
            )}
            aria-invalid={error ? "true" : undefined}
            {...props}
          />
          
          {/* End icon */}
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endIcon}
            </div>
          )}
        </div>
        
        {/* Description text */}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        
        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="text-sm text-error-600 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            {error}
          </p>
        )}
        
        {/* Success message */}
        {success && (
          <p
            id={successId}
            className="text-sm text-success-600 flex items-center gap-1"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input, inputVariants }
export type { InputProps }