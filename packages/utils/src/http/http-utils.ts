/**
 * HTTP and API Utilities
 * Common functions for HTTP requests, responses, and API handling
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  
  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  
  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
} as const;

/**
 * HTTP Methods
 */
export const HTTP_METHODS = [
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'
] as const;

export type HttpMethod = typeof HTTP_METHODS[number];

/**
 * Common MIME types
 */
export const MIME_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  HTML: 'text/html',
  TEXT: 'text/plain',
  CSS: 'text/css',
  JAVASCRIPT: 'application/javascript',
  PDF: 'application/pdf',
  ZIP: 'application/zip',
  GZIP: 'application/gzip',
  
  // Images
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  SVG: 'image/svg+xml',
  WEBP: 'image/webp',
  
  // Form data
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM: 'multipart/form-data',
  
  // Streams
  OCTET_STREAM: 'application/octet-stream',
  
  // Video
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  
  // Audio
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
} as const;

/**
 * Request configuration interface
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
  params?: Record<string, any>;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string;
  };
  validateStatus?: (status: number) => boolean;
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
}

/**
 * Response interface
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  request?: any;
}

/**
 * Error response interface
 */
export interface ApiError extends Error {
  response?: {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  request?: any;
  config: RequestConfig;
  code?: string;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

/**
 * Rate limiting interface
 */
export interface RateLimiter {
  requests: number;
  windowMs: number;
  remaining: number;
  resetTime: Date;
}

/**
 * URL utility functions
 */
export class URLUtils {
  /**
   * Build URL with query parameters
   */
  static buildURL(baseURL: string, path: string = '', params: Record<string, any> = {}): string {
    const url = new URL(path, baseURL);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v, index) => {
            url.searchParams.append(`${key}[${index}]`, String(v));
          });
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });
    
    return url.toString();
  }
  
  /**
   * Parse URL and extract components
   */
  static parseURL(urlString: string) {
    try {
      const url = new URL(urlString);
      return {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        params: Object.fromEntries(url.searchParams.entries()),
      };
    } catch (error) {
      throw new Error(`Invalid URL: ${urlString}`);
    }
  }
  
  /**
   * Extract query parameters from URL
   */
  static getQueryParams(urlString: string): Record<string, string> {
    try {
      const url = new URL(urlString);
      return Object.fromEntries(url.searchParams.entries());
    } catch {
      return {};
    }
  }
  
  /**
   * Validate URL
   */
  static isValidURL(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * HTTP header utilities
 */
export class HeaderUtils {
  /**
   * Parse Content-Type header
   */
  static parseContentType(contentType: string): { mediaType: string; charset?: string; boundary?: string } {
    const [mediaType, ...params] = contentType.split(';').map(s => s.trim());
    const result: any = { mediaType };
    
    params.forEach(param => {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'charset') {
        result.charset = value;
      } else if (key === 'boundary') {
        result.boundary = value;
      }
    });
    
    return result;
  }
  
  /**
   * Parse Authorization header
   */
  static parseAuthorization(authorization: string): { type: string; credentials: string } | null {
    const [type, credentials] = authorization.split(' ', 2);
    if (!type || !credentials) return null;
    
    return { type: type.toLowerCase(), credentials };
  }
  
  /**
   * Create Basic Auth header
   */
  static createBasicAuth(username: string, password: string): string {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${credentials}`;
  }
  
  /**
   * Create Bearer token header
   */
  static createBearerAuth(token: string): string {
    return `Bearer ${token}`;
  }
  
  /**
   * Normalize header names
   */
  static normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    Object.entries(headers).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase()
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
      normalized[normalizedKey] = value;
    });
    
    return normalized;
  }
}

/**
 * Request body utilities
 */
export class BodyUtils {
  /**
   * Serialize object to form data
   */
  static toFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, String(item));
          });
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return formData;
  }
  
  /**
   * Serialize object to URL-encoded string
   */
  static toURLEncoded(obj: Record<string, any>): string {
    return Object.entries(obj)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item, index) => 
            `${encodeURIComponent(`${key}[${index}]`)}=${encodeURIComponent(String(item))}`
          ).join('&');
        } else {
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        }
      })
      .join('&');
  }
  
  /**
   * Parse form data to object
   */
  static fromFormData(formData: FormData): Record<string, any> {
    const obj: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      // Handle array notation like "items[0]"
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        if (!obj[arrayKey]) obj[arrayKey] = [];
        obj[arrayKey][parseInt(index)] = value;
      } else {
        obj[key] = value;
      }
    });
    
    return obj;
  }
}

/**
 * Response utilities
 */
export class ResponseUtils {
  /**
   * Check if status code indicates success
   */
  static isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }
  
  /**
   * Check if status code indicates client error
   */
  static isClientError(status: number): boolean {
    return status >= 400 && status < 500;
  }
  
  /**
   * Check if status code indicates server error
   */
  static isServerError(status: number): boolean {
    return status >= 500 && status < 600;
  }
  
  /**
   * Get status text for status code
   */
  static getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      300: 'Multiple Choices',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    
    return statusTexts[status] || 'Unknown Status';
  }
  
  /**
   * Create standardized API response
   */
  static createResponse<T>(
    data: T,
    status: number = HTTP_STATUS.OK,
    message?: string,
    meta?: any
  ): {
    success: boolean;
    data: T;
    message?: string;
    meta?: any;
    status: number;
    timestamp: string;
  } {
    return {
      success: this.isSuccessStatus(status),
      data,
      ...(message && { message }),
      ...(meta && { meta }),
      status,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Create standardized error response
   */
  static createErrorResponse(
    message: string,
    status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code?: string,
    details?: any
  ): {
    success: false;
    error: {
      message: string;
      code?: string;
      details?: any;
    };
    status: number;
    timestamp: string;
  } {
    return {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(details && { details }),
      },
      status,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * CORS utilities
 */
export class CORSUtils {
  /**
   * Create CORS headers
   */
  static createCORSHeaders(options: {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (options.origin !== undefined) {
      if (typeof options.origin === 'boolean') {
        headers['Access-Control-Allow-Origin'] = options.origin ? '*' : '';
      } else if (typeof options.origin === 'string') {
        headers['Access-Control-Allow-Origin'] = options.origin;
      } else if (Array.isArray(options.origin)) {
        // This would need to be handled per request based on the actual origin
        headers['Access-Control-Allow-Origin'] = options.origin.join(', ');
      }
    }
    
    if (options.methods) {
      headers['Access-Control-Allow-Methods'] = options.methods.join(', ');
    }
    
    if (options.allowedHeaders) {
      headers['Access-Control-Allow-Headers'] = options.allowedHeaders.join(', ');
    }
    
    if (options.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    if (options.maxAge) {
      headers['Access-Control-Max-Age'] = String(options.maxAge);
    }
    
    return headers;
  }
  
  /**
   * Check if origin is allowed
   */
  static isOriginAllowed(origin: string, allowedOrigins: string | string[] | boolean): boolean {
    if (allowedOrigins === true) return true;
    if (allowedOrigins === false) return false;
    if (typeof allowedOrigins === 'string') return allowedOrigins === origin;
    if (Array.isArray(allowedOrigins)) return allowedOrigins.includes(origin);
    return false;
  }
}

/**
 * Cookie utilities
 */
export class CookieUtils {
  /**
   * Parse cookie string
   */
  static parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }
  
  /**
   * Serialize cookie
   */
  static serializeCookie(
    name: string,
    value: string,
    options: {
      maxAge?: number;
      expires?: Date;
      path?: string;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    } = {}
  ): string {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    
    if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`;
    }
    
    if (options.expires) {
      cookie += `; Expires=${options.expires.toUTCString()}`;
    }
    
    if (options.path) {
      cookie += `; Path=${options.path}`;
    }
    
    if (options.domain) {
      cookie += `; Domain=${options.domain}`;
    }
    
    if (options.secure) {
      cookie += '; Secure';
    }
    
    if (options.httpOnly) {
      cookie += '; HttpOnly';
    }
    
    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }
    
    return cookie;
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimitUtils {
  private static windows = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Check rate limit
   */
  static checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: Date } {
    const now = Date.now();
    const window = this.windows.get(key);
    
    if (!window || now > window.resetTime) {
      // New window
      this.windows.set(key, { count: 1, resetTime: now + windowMs });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: new Date(now + windowMs),
      };
    }
    
    if (window.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(window.resetTime),
      };
    }
    
    window.count++;
    return {
      allowed: true,
      remaining: limit - window.count,
      resetTime: new Date(window.resetTime),
    };
  }
  
  /**
   * Create rate limit headers
   */
  static createRateLimitHeaders(rateLimit: {
    limit: number;
    remaining: number;
    resetTime: Date;
  }): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime.getTime() / 1000)),
    };
  }
}

/**
 * Content encoding utilities
 */
export class EncodingUtils {
  /**
   * Check if content encoding is supported
   */
  static isSupportedEncoding(encoding: string): boolean {
    const supported = ['gzip', 'deflate', 'br', 'identity'];
    return supported.includes(encoding.toLowerCase());
  }
  
  /**
   * Parse Accept-Encoding header
   */
  static parseAcceptEncoding(acceptEncoding: string): string[] {
    return acceptEncoding
      .split(',')
      .map(encoding => encoding.trim().split(';')[0])
      .filter(this.isSupportedEncoding);
  }
  
  /**
   * Get best encoding from Accept-Encoding header
   */
  static getBestEncoding(acceptEncoding: string): string {
    const encodings = this.parseAcceptEncoding(acceptEncoding);
    
    // Prefer brotli, then gzip, then deflate
    if (encodings.includes('br')) return 'br';
    if (encodings.includes('gzip')) return 'gzip';
    if (encodings.includes('deflate')) return 'deflate';
    
    return 'identity';
  }
}

/**
 * Export all utilities
 */
export const httpUtils = {
  URL: URLUtils,
  Header: HeaderUtils,
  Body: BodyUtils,
  Response: ResponseUtils,
  CORS: CORSUtils,
  Cookie: CookieUtils,
  RateLimit: RateLimitUtils,
  Encoding: EncodingUtils,
  HTTP_STATUS,
  HTTP_METHODS,
  MIME_TYPES,
};