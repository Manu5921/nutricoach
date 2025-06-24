/**
 * API-related types and interfaces
 */

import { PaginationMeta, ErrorInfo, ValidationError } from '../common/base.js';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp: string;
  traceId?: string;
  validationErrors?: ValidationError[];
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PaginationMeta;
  filters?: Record<string, any>;
  sort?: SortMeta[];
  cache?: CacheMeta;
}

export interface SortMeta {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CacheMeta {
  cached: boolean;
  cacheKey?: string;
  ttl?: number;
  createdAt?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

/**
 * API request context
 */
export interface RequestContext {
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  correlationId?: string;
  source?: string;
  version?: string;
}

/**
 * Authenticated request context
 */
export interface AuthenticatedRequestContext extends RequestContext {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
}

/**
 * Query parameters
 */
export interface ApiQueryParams {
  // Pagination
  page?: number;
  limit?: number;
  offset?: number;
  
  // Search
  q?: string;
  search?: string;
  
  // Sorting
  sort?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  orderBy?: string;
  
  // Filtering
  filter?: string;
  filters?: Record<string, any>;
  
  // Fields selection
  fields?: string;
  include?: string;
  exclude?: string;
  
  // Caching
  cache?: boolean;
  refresh?: boolean;
  
  // Misc
  format?: 'json' | 'csv' | 'xml';
  locale?: string;
  timezone?: string;
}

/**
 * API endpoints configuration
 */
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  authenticated: boolean;
  roles?: string[];
  permissions?: string[];
  rateLimit?: RateLimit;
  cache?: CacheConfig;
  validation?: ValidationConfig;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RateLimit {
  requests: number;
  window: number; // seconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  key?: string;
  tags?: string[];
  vary?: string[];
}

export interface ValidationConfig {
  body?: any; // Schema
  query?: any; // Schema
  params?: any; // Schema
  headers?: any; // Schema
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  auth?: ApiAuthConfig;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    storage?: 'memory' | 'localStorage' | 'sessionStorage';
  };
}

export interface ApiAuthConfig {
  type: 'bearer' | 'basic' | 'api_key' | 'oauth2';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  header?: string;
}

export type RequestInterceptor = (config: any) => any | Promise<any>;
export type ResponseInterceptor = (response: any) => any | Promise<any>;

/**
 * API status and health check
 */
export interface ApiHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number; // seconds
  services: ServiceHealth[];
  metrics: HealthMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number; // ms
  lastCheck: string;
  error?: string;
}

export interface HealthMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    averageResponseTime: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    percentage: number;
  };
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
  };
}

/**
 * WebSocket types
 */
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
  id?: string;
}

export interface WebSocketEvent {
  event: string;
  channel?: string;
  data: any;
  userId?: string;
  broadcast?: boolean;
}

/**
 * File upload types
 */
export interface FileUploadRequest {
  file: File | Buffer;
  filename: string;
  mimeType: string;
  size: number;
  folder?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  uploadedAt: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

/**
 * Bulk operations
 */
export interface BulkRequest<T> {
  items: T[];
  options?: {
    skipValidation?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
  };
}

export interface BulkResponse<T> {
  success: boolean;
  processed: number;
  failed: number;
  results: BulkItemResult<T>[];
  errors: BulkError[];
}

export interface BulkItemResult<T> {
  item: T;
  success: boolean;
  data?: any;
  error?: ApiError;
}

export interface BulkError {
  index: number;
  error: ApiError;
}

/**
 * API versioning
 */
export interface ApiVersion {
  version: string;
  status: 'current' | 'deprecated' | 'sunset';
  releaseDate: string;
  sunsetDate?: string;
  changelog?: string[];
  breaking?: boolean;
}

/**
 * API documentation types
 */
export interface ApiDocumentation {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

/**
 * API testing types
 */
export interface ApiTestCase {
  name: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number;
  expectedResponse?: any;
  assertions?: ApiAssertion[];
}

export interface ApiAssertion {
  type: 'status' | 'header' | 'body' | 'response_time' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value?: any;
  customValidator?: (response: any) => boolean;
}

/**
 * API monitoring types
 */
export interface ApiMetrics {
  timestamp: string;
  endpoint: string;
  method: HttpMethod;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  error?: string;
}

export interface ApiAnalytics {
  period: {
    start: string;
    end: string;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  endpoints: Array<{
    path: string;
    method: HttpMethod;
    requests: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  errors: Array<{
    code: string;
    message: string;
    count: number;
    percentage: number;
  }>;
  users: {
    total: number;
    authenticated: number;
    anonymous: number;
  };
}

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Common API error codes
 */
export const API_ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * Utility types
 */
export type ApiResponseType<T> = T extends (...args: any[]) => Promise<infer R> 
  ? R extends ApiResponse<infer U> 
    ? U 
    : never 
  : never;

export type ApiErrorType = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
export type HttpStatusType = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];