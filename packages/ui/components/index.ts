/**
 * NutriCoach UI Design System
 * 
 * A comprehensive, health-focused design system built with:
 * - Tailwind CSS v4 with OKLCH color space
 * - Radix UI primitives for accessibility
 * - CVA for component variants
 * - Health and nutrition-specific components
 * 
 * Color Philosophy:
 * - Primary Green: Health, nature, balance, anti-inflammatory
 * - Secondary Orange: Energy, warmth, appetite, social interaction
 * - Tertiary Blue: Trust, calm, hydration, stability
 * - Success: Achievements, goals, positive outcomes
 * - Warning: Caution, moderation, important information
 * - Error: Issues, problems (gentle, not alarming)
 * 
 * Design Principles:
 * - Accessibility-first approach
 * - Health-focused color psychology
 * - Anti-inflammatory visual design
 * - Clear information hierarchy
 * - Gentle, calming interactions
 */

/* Primitive Components - Building blocks */
export * from "./primitives"

/* Navigation Components */
export * from "./navigation"

/* Form Components - Coming next */
// export * from "./forms"

/* Layout Components - Coming next */
// export * from "./layout"

/* Feedback Components - Coming next */
// export * from "./feedback"

/* Composite Components */
export * from "./composite"

/* Utility exports */
export { cn } from "../lib/utils"
export type * from "../types"