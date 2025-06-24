/**
 * Universal Content Management Service
 * Extensible content management for blogs, recipes, articles, etc.
 */

export interface BaseContent {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  contentType: 'text' | 'markdown' | 'html' | 'json';
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  tags: string[];
  categories: string[];
  metadata: Record<string, any>;
  seo: SEOData;
  analytics: ContentAnalytics;
}

export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'player';
}

export interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  shares: number;
  comments: number;
  likes: number;
  readingTime: number; // in minutes
  engagement: {
    timeOnPage: number;
    bounceRate: number;
    completionRate: number;
  };
}

// Specialized content types
export interface BlogPost extends BaseContent {
  contentSubtype: 'blog';
  featuredImage?: string;
  excerpt: string;
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  series?: {
    id: string;
    name: string;
    order: number;
  };
}

export interface Recipe extends BaseContent {
  contentSubtype: 'recipe';
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  nutrition: NutritionInfo;
  cookingInfo: {
    prepTime: number;
    cookTime: number;
    totalTime: number;
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  dietaryTags: string[];
  cuisineType: string;
  mealTypes: string[];
  images: string[];
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  preparation?: string;
  optional?: boolean;
  alternatives?: string[];
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  duration?: number;
  temperature?: number;
  images?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  [key: string]: number | undefined;
}

export interface Article extends BaseContent {
  contentSubtype: 'article';
  featuredImage?: string;
  references: Reference[];
  tableOfContents: TOCItem[];
  factChecked: boolean;
  lastFactCheck?: string;
}

export interface Reference {
  id: string;
  title: string;
  url: string;
  authors: string[];
  publishedDate?: string;
  journal?: string;
  type: 'academic' | 'news' | 'blog' | 'official' | 'other';
}

export interface TOCItem {
  id: string;
  title: string;
  level: number;
  anchor: string;
  children?: TOCItem[];
}

export interface ContentFilter {
  status?: BaseContent['status'][];
  contentType?: string[];
  tags?: string[];
  categories?: string[];
  authorId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  searchQuery?: string;
}

export interface ContentSort {
  field: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'views' | 'likes';
  direction: 'asc' | 'desc';
}

export interface ContentPagination {
  page: number;
  limit: number;
  offset?: number;
}

export interface ContentSearchResult<T extends BaseContent = BaseContent> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ContentServiceConfig {
  slugGenerator?: (title: string) => string;
  readingTimeCalculator?: (content: string) => number;
  seoDefaults?: Partial<SEOData>;
  analyticsEnabled?: boolean;
  autoPublish?: boolean;
  moderationEnabled?: boolean;
}

/**
 * Universal Content Service
 */
export class ContentService<T extends BaseContent = BaseContent> {
  protected config: ContentServiceConfig;

  constructor(config: ContentServiceConfig = {}) {
    this.config = {
      slugGenerator: this.defaultSlugGenerator,
      readingTimeCalculator: this.defaultReadingTimeCalculator,
      seoDefaults: {
        keywords: [],
        twitterCard: 'summary',
      },
      analyticsEnabled: true,
      autoPublish: false,
      moderationEnabled: false,
      ...config,
    };
  }

  /**
   * Create new content
   */
  createContent(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Omit<T, 'id'> {
    const now = new Date().toISOString();
    const slug = data.slug || this.config.slugGenerator!(data.title);
    const readingTime = this.config.readingTimeCalculator!(data.content);

    return {
      ...data,
      slug,
      createdAt: now,
      updatedAt: now,
      analytics: {
        views: 0,
        uniqueViews: 0,
        shares: 0,
        comments: 0,
        likes: 0,
        readingTime,
        engagement: {
          timeOnPage: 0,
          bounceRate: 0,
          completionRate: 0,
        },
      },
      seo: {
        ...this.config.seoDefaults,
        ...data.seo,
        metaTitle: data.seo?.metaTitle || data.title,
        metaDescription: data.seo?.metaDescription || data.summary,
      },
    } as Omit<T, 'id'>;
  }

  /**
   * Update content
   */
  updateContent(
    current: T,
    updates: Partial<Omit<T, 'id' | 'createdAt' | 'analytics'>>
  ): T {
    const updatedContent = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate reading time if content changed
    if (updates.content && updates.content !== current.content) {
      updatedContent.analytics.readingTime = this.config.readingTimeCalculator!(updates.content);
    }

    // Update slug if title changed
    if (updates.title && updates.title !== current.title && !updates.slug) {
      updatedContent.slug = this.config.slugGenerator!(updates.title);
    }

    return updatedContent;
  }

  /**
   * Generate content excerpt
   */
  generateExcerpt(content: string, maxLength: number = 160): string {
    // Strip HTML/Markdown tags
    const plainText = content
      .replace(/<[^>]*>/g, '') // HTML tags
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Italic markdown
      .replace(/`([^`]+)`/g, '$1') // Code markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/#+\s/g, '') // Headers
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    // Find the last complete sentence within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSentence > maxLength * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    } else if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  }

  /**
   * Generate table of contents
   */
  generateTableOfContents(content: string): TOCItem[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const toc: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const anchor = this.generateAnchor(title);

      toc.push({
        id: Math.random().toString(36).substr(2, 9),
        title,
        level,
        anchor,
      });
    }

    return this.buildTOCHierarchy(toc);
  }

  /**
   * Build hierarchical table of contents
   */
  private buildTOCHierarchy(flatTOC: TOCItem[]): TOCItem[] {
    const result: TOCItem[] = [];
    const stack: TOCItem[] = [];

    for (const item of flatTOC) {
      // Remove items from stack that are at the same level or deeper
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
      }

      stack.push(item);
    }

    return result;
  }

  /**
   * Generate anchor from title
   */
  private generateAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Validate content
   */
  validateContent(content: Partial<T>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!content.title?.trim()) {
      errors.push('Title is required');
    }

    if (!content.content?.trim()) {
      errors.push('Content is required');
    }

    if (!content.authorId?.trim()) {
      errors.push('Author ID is required');
    }

    // Title length validation
    if (content.title && content.title.length > 200) {
      warnings.push('Title is longer than recommended (200 characters)');
    }

    // SEO validation
    if (content.seo?.metaDescription && content.seo.metaDescription.length > 160) {
      warnings.push('Meta description is longer than recommended (160 characters)');
    }

    // Content length validation
    if (content.content && content.content.length < 100) {
      warnings.push('Content is quite short (less than 100 characters)');
    }

    // Slug validation
    if (content.slug && !/^[a-z0-9-]+$/.test(content.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Search content
   */
  searchContent(
    items: T[],
    query: string,
    filters?: ContentFilter
  ): T[] {
    let results = [...items];

    // Apply filters
    if (filters) {
      if (filters.status) {
        results = results.filter(item => filters.status!.includes(item.status));
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(item =>
          filters.tags!.some(tag => item.tags.includes(tag))
        );
      }

      if (filters.categories && filters.categories.length > 0) {
        results = results.filter(item =>
          filters.categories!.some(category => item.categories.includes(category))
        );
      }

      if (filters.authorId) {
        results = results.filter(item => item.authorId === filters.authorId);
      }

      if (filters.dateRange) {
        const from = new Date(filters.dateRange.from);
        const to = new Date(filters.dateRange.to);
        results = results.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= from && itemDate <= to;
        });
      }
    }

    // Apply search query
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      results = results.filter(item => {
        const searchText = [
          item.title,
          item.summary || '',
          item.content,
          ...item.tags,
          ...item.categories,
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchText.includes(term));
      });
    }

    return results;
  }

  /**
   * Sort content
   */
  sortContent(items: T[], sort: ContentSort): T[] {
    return [...items].sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      // Handle date fields
      if (sort.field.includes('At')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  /**
   * Paginate content
   */
  paginateContent<K extends BaseContent>(
    items: K[],
    pagination: ContentPagination
  ): ContentSearchResult<K> {
    const offset = pagination.offset || (pagination.page - 1) * pagination.limit;
    const paginatedItems = items.slice(offset, offset + pagination.limit);

    return {
      items: paginatedItems,
      totalCount: items.length,
      page: pagination.page,
      limit: pagination.limit,
      hasMore: offset + pagination.limit < items.length,
    };
  }

  /**
   * Update analytics
   */
  updateAnalytics(
    content: T,
    event: 'view' | 'share' | 'like' | 'comment',
    data?: any
  ): T {
    const updatedAnalytics = { ...content.analytics };

    switch (event) {
      case 'view':
        updatedAnalytics.views += 1;
        if (data?.isUnique) {
          updatedAnalytics.uniqueViews += 1;
        }
        break;
      case 'share':
        updatedAnalytics.shares += 1;
        break;
      case 'like':
        updatedAnalytics.likes += 1;
        break;
      case 'comment':
        updatedAnalytics.comments += 1;
        break;
    }

    return {
      ...content,
      analytics: updatedAnalytics,
    };
  }

  /**
   * Default slug generator
   */
  private defaultSlugGenerator(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Default reading time calculator (words per minute: 200)
   */
  private defaultReadingTimeCalculator(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}

/**
 * Specialized content services
 */
export class BlogService extends ContentService<BlogPost> {
  generateSeriesNavigation(posts: BlogPost[], currentPostId: string): {
    previous?: BlogPost;
    next?: BlogPost;
    series?: BlogPost[];
  } {
    const currentPost = posts.find(p => p.id === currentPostId);
    if (!currentPost?.series) {
      return {};
    }

    const seriesPosts = posts
      .filter(p => p.series?.id === currentPost.series!.id)
      .sort((a, b) => (a.series!.order || 0) - (b.series!.order || 0));

    const currentIndex = seriesPosts.findIndex(p => p.id === currentPostId);

    return {
      previous: currentIndex > 0 ? seriesPosts[currentIndex - 1] : undefined,
      next: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : undefined,
      series: seriesPosts,
    };
  }
}

export class RecipeService extends ContentService<Recipe> {
  calculateNutritionPerServing(recipe: Recipe): NutritionInfo {
    const nutrition = { ...recipe.nutrition };
    const servings = recipe.cookingInfo.servings;

    Object.keys(nutrition).forEach(key => {
      if (typeof nutrition[key] === 'number') {
        nutrition[key] = Math.round((nutrition[key] / servings) * 100) / 100;
      }
    });

    return nutrition;
  }

  scaleRecipe(recipe: Recipe, newServings: number): Recipe {
    const scaleFactor = newServings / recipe.cookingInfo.servings;

    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      amount: Math.round(ingredient.amount * scaleFactor * 100) / 100,
    }));

    const scaledNutrition: NutritionInfo = {};
    Object.entries(recipe.nutrition).forEach(([key, value]) => {
      if (typeof value === 'number') {
        scaledNutrition[key] = Math.round(value * scaleFactor * 100) / 100;
      }
    });

    return {
      ...recipe,
      ingredients: scaledIngredients,
      nutrition: scaledNutrition,
      cookingInfo: {
        ...recipe.cookingInfo,
        servings: newServings,
      },
    };
  }

  filterByDietaryRestrictions(recipes: Recipe[], restrictions: string[]): Recipe[] {
    return recipes.filter(recipe =>
      restrictions.every(restriction =>
        recipe.dietaryTags.includes(restriction) ||
        !recipe.ingredients.some(ingredient =>
          ingredient.name.toLowerCase().includes(restriction.toLowerCase())
        )
      )
    );
  }
}

/**
 * Factory functions
 */
export const createContentService = <T extends BaseContent = BaseContent>(
  config?: ContentServiceConfig
) => new ContentService<T>(config);

export const createBlogService = (config?: ContentServiceConfig) =>
  new BlogService(config);

export const createRecipeService = (config?: ContentServiceConfig) =>
  new RecipeService(config);