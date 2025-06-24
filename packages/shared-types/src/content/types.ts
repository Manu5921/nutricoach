/**
 * Content management types
 */

import { BaseEntity, TaggableEntity, PublishableEntity, SearchableEntity, ImageInfo } from '../common/base.js';

/**
 * Base content interface
 */
export interface BaseContent extends BaseEntity, TaggableEntity, PublishableEntity, SearchableEntity {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  contentType: ContentType;
  authorId: string;
  featuredImage?: ImageInfo;
  seo: SEOData;
  analytics: ContentAnalytics;
  language: string;
  readingTime: number; // minutes
}

export type ContentType = 'article' | 'blog_post' | 'recipe' | 'guide' | 'news' | 'faq' | 'page' | 'tutorial';

/**
 * SEO metadata
 */
export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, any>;
}

/**
 * Content analytics
 */
export interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  shares: number;
  likes: number;
  comments: number;
  bookmarks: number;
  downloads: number;
  engagement: {
    averageTimeOnPage: number; // seconds
    bounceRate: number; // percentage
    completionRate: number; // percentage
    scrollDepth: number; // percentage
  };
  traffic: {
    organic: number;
    direct: number;
    referral: number;
    social: number;
    email: number;
    paid: number;
  };
  demographics: {
    countries: Record<string, number>;
    devices: Record<string, number>;
    browsers: Record<string, number>;
    ageGroups: Record<string, number>;
  };
}

/**
 * Article-specific content
 */
export interface Article extends BaseContent {
  contentType: 'article';
  excerpt: string;
  tableOfContents: TOCItem[];
  references: Reference[];
  relatedArticles: string[];
  factChecked: boolean;
  lastFactCheckDate?: string;
  expertise: ExpertiseLevel;
  citations: Citation[];
  updates: ContentUpdate[];
}

export interface TOCItem {
  id: string;
  title: string;
  level: number; // 1-6 for h1-h6
  anchor: string;
  children?: TOCItem[];
}

export interface Reference {
  id: string;
  title: string;
  url: string;
  authors: string[];
  publishedDate?: string;
  accessedDate: string;
  journal?: string;
  doi?: string;
  type: ReferenceType;
  reliability: 'high' | 'medium' | 'low';
}

export type ReferenceType = 'academic' | 'government' | 'medical' | 'news' | 'blog' | 'book' | 'website' | 'interview';

export interface Citation {
  id: string;
  text: string;
  referenceId: string;
  context: string;
  pageLocation: string; // paragraph, section, etc.
}

export interface ContentUpdate {
  id: string;
  date: string;
  description: string;
  author: string;
  type: 'minor' | 'major' | 'correction';
  affectedSections: string[];
}

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Blog post content
 */
export interface BlogPost extends BaseContent {
  contentType: 'blog_post';
  excerpt: string;
  series?: {
    id: string;
    name: string;
    order: number;
    total: number;
  };
  relatedPosts: string[];
  readingLevel: ReadingLevel;
  mood: ContentMood;
  callToAction?: CallToAction;
}

export type ReadingLevel = 'elementary' | 'middle_school' | 'high_school' | 'college' | 'graduate';
export type ContentMood = 'informative' | 'inspiring' | 'entertaining' | 'educational' | 'promotional' | 'personal';

export interface CallToAction {
  type: 'subscribe' | 'download' | 'purchase' | 'contact' | 'share' | 'comment' | 'custom';
  text: string;
  url?: string;
  priority: 'primary' | 'secondary';
}

/**
 * Recipe content (extends nutrition recipe)
 */
export interface RecipeContent extends BaseContent {
  contentType: 'recipe';
  recipeId: string; // Reference to nutrition recipe
  cookingTips: string[];
  variations: RecipeVariation[];
  videoUrl?: string;
  nutritionHighlights: string[];
  dietaryLabels: string[];
  seasonality: string[];
  equipment: string[];
  storageInstructions: string;
  leftoverSuggestions: string[];
}

export interface RecipeVariation {
  id: string;
  name: string;
  description: string;
  modifications: {
    ingredients?: Array<{
      action: 'add' | 'remove' | 'replace' | 'modify';
      ingredient: string;
      replacement?: string;
      amount?: number;
      unit?: string;
    }>;
    instructions?: Array<{
      step: number;
      modification: string;
    }>;
  };
  nutritionImpact?: string;
}

/**
 * Guide content
 */
export interface Guide extends BaseContent {
  contentType: 'guide';
  steps: GuideStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  prerequisites: string[];
  tools: string[];
  outcomes: string[];
  troubleshooting: TroubleshootingItem[];
}

export interface GuideStep {
  id: string;
  order: number;
  title: string;
  content: string;
  images?: ImageInfo[];
  videoUrl?: string;
  tips: string[];
  warnings: string[];
  estimatedTime?: number; // minutes
  checkpoints: string[];
}

export interface TroubleshootingItem {
  problem: string;
  solutions: string[];
  prevention: string[];
}

/**
 * FAQ content
 */
export interface FAQ extends BaseContent {
  contentType: 'faq';
  questions: FAQItem[];
  category: FAQCategory;
  popularity: number;
  lastReviewed: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  relatedQuestions: string[];
  helpfulVotes: number;
  unhelpfulVotes: number;
  tags: string[];
}

export type FAQCategory = 
  | 'general'
  | 'nutrition'
  | 'recipes'
  | 'account'
  | 'billing'
  | 'technical'
  | 'privacy'
  | 'safety';

/**
 * Tutorial content
 */
export interface Tutorial extends BaseContent {
  contentType: 'tutorial';
  modules: TutorialModule[];
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  skills: string[];
  certificate?: {
    available: boolean;
    requirements: string[];
    template: string;
  };
  quiz?: Quiz;
}

export interface TutorialModule {
  id: string;
  order: number;
  title: string;
  content: string;
  videoUrl?: string;
  resources: Resource[];
  exercises: Exercise[];
  objectives: string[];
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'link' | 'image' | 'document';
  url: string;
  description: string;
  size?: number;
  duration?: number; // for videos/audio
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'practice' | 'assignment' | 'project' | 'quiz';
  instructions: string[];
  hints: string[];
  solution?: string;
  estimatedTime: number; // minutes
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // minutes
  maxAttempts?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

/**
 * Content versioning
 */
export interface ContentVersion extends BaseEntity {
  contentId: string;
  version: number;
  title: string;
  content: string;
  summary?: string;
  changeLog: string;
  authorId: string;
  published: boolean;
  publishedAt?: string;
  compareUrl?: string;
}

/**
 * Content workflow
 */
export interface ContentWorkflow extends BaseEntity {
  contentId: string;
  status: WorkflowStatus;
  assigneeId?: string;
  reviewerId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  comments: WorkflowComment[];
  approvals: WorkflowApproval[];
  history: WorkflowEvent[];
}

export type WorkflowStatus = 
  | 'draft'
  | 'in_review'
  | 'needs_revision'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export interface WorkflowComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface WorkflowApproval {
  id: string;
  reviewerId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: string;
}

export interface WorkflowEvent {
  id: string;
  type: string;
  description: string;
  authorId: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * Content collections and curation
 */
export interface ContentCollection extends BaseEntity, TaggableEntity {
  name: string;
  description: string;
  slug: string;
  curatorId: string;
  items: ContentCollectionItem[];
  featured: boolean;
  collaborative: boolean;
  visibility: 'public' | 'unlisted' | 'private';
  thumbnail?: ImageInfo;
}

export interface ContentCollectionItem {
  contentId: string;
  order: number;
  note?: string;
  addedAt: string;
  addedBy: string;
}

/**
 * Content search and filtering
 */
export interface ContentSearchFilters {
  contentType?: ContentType[];
  status?: PublishableEntity['status'][];
  authorId?: string;
  tags?: string[];
  categories?: string[];
  language?: string[];
  publishedAfter?: string;
  publishedBefore?: string;
  readingTime?: {
    min?: number;
    max?: number;
  };
  difficulty?: string[];
  featured?: boolean;
  hasVideo?: boolean;
  hasImages?: boolean;
}

export interface ContentSearchResult {
  content: BaseContent;
  relevanceScore: number;
  highlights: {
    title?: string[];
    content?: string[];
    summary?: string[];
  };
  matchedFilters: string[];
}

/**
 * Content analytics and reporting
 */
export interface ContentReport {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalViews: number;
    uniqueViews: number;
    averageTimeOnPage: number;
    bounceRate: number;
    shareRate: number;
    engagementRate: number;
  };
  topContent: Array<{
    contentId: string;
    title: string;
    views: number;
    engagement: number;
  }>;
  traffic: {
    sources: Record<string, number>;
    devices: Record<string, number>;
    countries: Record<string, number>;
  };
  trends: {
    viewsOverTime: Array<{
      date: string;
      views: number;
    }>;
    popularTags: Array<{
      tag: string;
      count: number;
    }>;
  };
}

/**
 * Content moderation
 */
export interface ContentModeration extends BaseEntity {
  contentId: string;
  moderatorId: string;
  action: ModerationAction;
  reason: string;
  details?: string;
  automated: boolean;
  confidence?: number; // for automated moderation
  appealed: boolean;
  appealedAt?: string;
  appealReason?: string;
  appealDecision?: 'upheld' | 'reversed';
}

export type ModerationAction = 
  | 'approved'
  | 'flagged'
  | 'hidden'
  | 'removed'
  | 'quarantined'
  | 'age_restricted'
  | 'needs_review';

/**
 * Content syndication
 */
export interface ContentSyndication extends BaseEntity {
  contentId: string;
  platform: SyndicationPlatform;
  externalId: string;
  externalUrl: string;
  status: 'pending' | 'published' | 'failed' | 'removed';
  publishedAt?: string;
  lastSyncAt?: string;
  syncSettings: {
    autoSync: boolean;
    includeImages: boolean;
    includeLinks: boolean;
    formatForPlatform: boolean;
  };
  analytics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

export type SyndicationPlatform = 
  | 'medium'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'reddit'
  | 'newsletter'
  | 'rss';

/**
 * Content personalization
 */
export interface ContentPersonalization {
  userId: string;
  preferences: {
    contentTypes: ContentType[];
    topics: string[];
    authors: string[];
    difficulty: string[];
    readingTime: {
      min: number;
      max: number;
    };
    languages: string[];
  };
  behavior: {
    readingHistory: string[];
    bookmarks: string[];
    shares: string[];
    likes: string[];
    comments: string[];
    searchQueries: string[];
  };
  recommendations: {
    contentId: string;
    score: number;
    reason: string;
    generatedAt: string;
  }[];
}