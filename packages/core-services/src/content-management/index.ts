/**
 * Content Management Module
 * Universal content management for blogs, recipes, articles, etc.
 */

export {
  ContentService,
  BlogService,
  RecipeService,
  createContentService,
  createBlogService,
  createRecipeService,
  type BaseContent,
  type BlogPost,
  type Recipe,
  type Article,
  type RecipeIngredient,
  type RecipeInstruction,
  type NutritionInfo,
  type Reference,
  type TOCItem,
  type SEOData,
  type ContentAnalytics,
  type ContentFilter,
  type ContentSort,
  type ContentPagination,
  type ContentSearchResult,
  type ContentServiceConfig,
} from './content-service.js';