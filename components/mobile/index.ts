// Mobile-first components for NutriCoach PWA
export { default as TouchRecipeCard } from './TouchRecipeCard'
export { default as SwipeableMenuPlanner } from './SwipeableMenuPlanner'
export { default as NativeCamera } from './NativeCamera'
export { default as LocationBasedSuggestions } from './LocationBasedSuggestions'
export { default as PWAInstallPrompt, usePWAInstall } from './PWAInstallPrompt'
export { default as QuickActionWidget, NutritionQuickActions, RecipeQuickActions } from './QuickActionWidget'
export { default as MobileImageGallery, useMobileImageGallery } from './MobileImageGallery'
export { default as ResponsiveMealPlanner } from './ResponsiveMealPlanner'
export { default as EnhancedPushNotificationManager } from './EnhancedPushNotificationManager'
export { 
  QuickNutritionLogWidget, 
  DailyNutritionSummaryWidget, 
  WidgetPreview, 
  generateWidgetData 
} from './WidgetComponents'

// Mobile optimization utilities
export { 
  mobileOptimizer,
  NetworkDetector,
  MobileImageOptimizer,
  TouchOptimizer,
  LazyLoader,
  MemoryManager,
  BatteryOptimizer,
  VirtualScroller,
  PerformanceMonitor,
  MobileOptimizationManager,
  HapticFeedback,
  ImageOptimizer,
  GestureRecognizer
} from '@/lib/mobile-performance'

// Offline storage
export { 
  default as offlineStorage,
  OfflineStorage,
  initializeOfflineStorage,
  syncOfflineData
} from '@/lib/offline-storage'

export type {
  Recipe,
  Ingredient,
  NutritionFacts,
  UserNutritionLog,
  SyncQueueItem,
  NetworkInfo,
  MobileOptimizationSettings
} from '@/lib/offline-storage'