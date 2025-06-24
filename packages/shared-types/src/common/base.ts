/**
 * Base types used across the entire ecosystem
 */

/**
 * Universal entity base
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Timestamped entity
 */
export interface TimestampedEntity {
  createdAt: string;
  updatedAt: string;
}

/**
 * Soft delete support
 */
export interface SoftDeletable {
  deletedAt?: string | null;
  isDeleted?: boolean;
}

/**
 * Auditable entity
 */
export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

/**
 * Metadata support
 */
export interface WithMetadata {
  metadata: Record<string, any>;
}

/**
 * Status entity
 */
export interface StatusEntity {
  status: 'active' | 'inactive' | 'pending' | 'archived';
}

/**
 * Publishable entity
 */
export interface PublishableEntity {
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  publishedAt?: string;
  scheduledFor?: string;
}

/**
 * Taggable entity
 */
export interface TaggableEntity {
  tags: string[];
  categories: string[];
}

/**
 * Searchable entity
 */
export interface SearchableEntity {
  searchableText: string;
  searchVector?: string;
}

/**
 * Geographic entity
 */
export interface GeoEntity {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
    timezone?: string;
  };
}

/**
 * Localizable entity
 */
export interface LocalizableEntity {
  locale: string;
  translations?: Record<string, any>;
}

/**
 * Complete entity combining common interfaces
 */
export interface CompleteEntity extends
  BaseEntity,
  SoftDeletable,
  WithMetadata,
  StatusEntity,
  TaggableEntity {
}

/**
 * Pagination types
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Search and filtering
 */
export interface SearchQuery {
  q?: string;
  filters?: Record<string, any>;
  sort?: SortQuery[];
}

export interface SortQuery {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterQuery {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: any;
}

/**
 * Date range types
 */
export interface DateRange {
  from: string;
  to: string;
}

export interface DatePeriod {
  type: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  value?: DateRange;
}

/**
 * Numeric range types
 */
export interface NumericRange {
  min?: number;
  max?: number;
}

/**
 * Option types
 */
export interface Option<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
  icon?: string;
}

export interface OptionGroup<T = string> {
  label: string;
  options: Option<T>[];
}

/**
 * File types
 */
export interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  description?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ImageInfo extends FileInfo {
  dimensions: {
    width: number;
    height: number;
  };
  variants?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
}

/**
 * Address types
 */
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  formatted?: string;
}

/**
 * Contact types
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: Record<string, string>;
}

/**
 * Preferences and settings
 */
export interface BasePreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  units: 'metric' | 'imperial';
}

/**
 * Notification preferences
 */
export interface NotificationChannelPrefs {
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

export interface NotificationPreferences {
  email: NotificationChannelPrefs & {
    marketing: boolean;
    productUpdates: boolean;
    security: boolean;
  };
  push: NotificationChannelPrefs & {
    sound: boolean;
    vibration: boolean;
  };
  sms: NotificationChannelPrefs & {
    urgentOnly: boolean;
  };
  inApp: NotificationChannelPrefs;
}

/**
 * Privacy preferences
 */
export interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'private';
  searchable: boolean;
  showActivity: boolean;
  showStats: boolean;
  dataSharing: boolean;
  analyticsOptOut: boolean;
  marketingOptOut: boolean;
}

/**
 * Error types
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  traceId?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

/**
 * Result types
 */
export type Result<T, E = ErrorInfo> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = ErrorInfo> = Promise<Result<T, E>>;

/**
 * Loading states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T, E = ErrorInfo> {
  state: LoadingState;
  data?: T;
  error?: E;
  lastUpdated?: string;
}

/**
 * Common constants
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Utility types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Nullable<T> = T | null | undefined;

/**
 * Event types
 */
export interface BaseEvent {
  type: string;
  timestamp: string;
  source: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface DomainEvent<T = any> extends BaseEvent {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: T;
}

/**
 * Cache types
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage?: number;
}