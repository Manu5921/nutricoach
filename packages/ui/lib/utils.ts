import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with conflict resolution
 * This is the foundation for all component styling in our design system
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human readable format
 * Useful for file uploads and data display
 */
export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number
    sizeType?: "accurate" | "normal"
  } = {}
): string {
  const { decimals = 0, sizeType = "normal" } = opts

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"]
  if (bytes === 0) return "0 Byte"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

/**
 * Format nutritional values with appropriate units
 */
export function formatNutrition(
  value: number,
  unit: string,
  decimals: number = 1
): string {
  if (value === 0) return `0 ${unit}`
  
  // For very small values, use different decimal places
  if (value < 1 && unit !== "kcal") {
    return `${value.toFixed(2)} ${unit}`
  }
  
  // For calories and larger values, use fewer decimals
  if (unit === "kcal" || value >= 100) {
    return `${Math.round(value)} ${unit}`
  }
  
  return `${value.toFixed(decimals)} ${unit}`
}

/**
 * Format inflammation score with color coding
 */
export function formatInflammationScore(score: number): {
  formatted: string
  color: "success" | "warning" | "error"
  label: string
} {
  const absScore = Math.abs(score)
  
  if (absScore <= 2) {
    return {
      formatted: score.toFixed(1),
      color: "success",
      label: "Anti-inflammatory"
    }
  } else if (absScore <= 5) {
    return {
      formatted: score.toFixed(1),
      color: "warning", 
      label: "Neutral"
    }
  } else {
    return {
      formatted: score.toFixed(1),
      color: "error",
      label: "Pro-inflammatory"
    }
  }
}

/**
 * Create initials from name
 * Useful for avatar fallbacks
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "object") return Object.keys(value).length === 0
  return false
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Format time duration in human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${mins}m`
}

/**
 * Calculate cooking difficulty based on time and complexity
 */
export function getCookingDifficulty(
  cookTime: number,
  prepTime: number,
  ingredientCount: number
): "easy" | "medium" | "hard" {
  const totalTime = cookTime + prepTime
  
  if (totalTime <= 30 && ingredientCount <= 8) return "easy"
  if (totalTime <= 60 && ingredientCount <= 15) return "medium"
  return "hard"
}

/**
 * Format percentage with proper display
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format food weight with appropriate units
 */
export function formatWeight(grams: number): string {
  if (grams < 1000) {
    return `${grams}g`
  }
  return `${(grams / 1000).toFixed(1)}kg`
}

/**
 * Calculate BMI and return with classification
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number
  classification: string
  color: "success" | "warning" | "error"
} {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  
  if (bmi < 18.5) {
    return { bmi, classification: "Underweight", color: "warning" }
  } else if (bmi < 25) {
    return { bmi, classification: "Normal", color: "success" }
  } else if (bmi < 30) {
    return { bmi, classification: "Overweight", color: "warning" }
  } else {
    return { bmi, classification: "Obese", color: "error" }
  }
}