import type {
  BlogPost,
  BlogPostPreview,
  CreateBlogPost,
  UpdateBlogPost,
  BlogQueryParams,
  BlogPostListResponse,
  ApiResponse,
} from '../types';
import { BlogPostSchema, BlogPostListResponseSchema } from '../types';

export class BlogService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          message: response.statusText,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get paginated list of blog posts with filters
   */
  async getBlogPosts(params: BlogQueryParams = {}): Promise<ApiResponse<BlogPostListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.authorId) queryParams.set('authorId', params.authorId);
    if (params.isPublished !== undefined) queryParams.set('isPublished', params.isPublished.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.tags?.length) queryParams.set('tags', params.tags.join(','));

    const endpoint = `/api/blog${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await this.fetchApi<BlogPostListResponse>(endpoint);
    
    if (response.success && response.data) {
      try {
        // Validate response schema
        const validatedData = BlogPostListResponseSchema.parse(response.data);
        return {
          success: true,
          data: validatedData,
        };
      } catch (error) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid response format',
        };
      }
    }
    
    return response;
  }

  /**
   * Get a single blog post by ID
   */
  async getBlogPost(id: string): Promise<ApiResponse<BlogPost>> {
    const response = await this.fetchApi<BlogPost>(`/api/blog/${id}`);
    
    if (response.success && response.data) {
      try {
        // Validate response schema
        const validatedData = BlogPostSchema.parse(response.data);
        return {
          success: true,
          data: validatedData,
        };
      } catch (error) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid blog post format',
        };
      }
    }
    
    return response;
  }

  /**
   * Get a blog post by slug
   */
  async getBlogPostBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
    const response = await this.fetchApi<BlogPost>(`/api/blog/slug/${slug}`);
    
    if (response.success && response.data) {
      try {
        const validatedData = BlogPostSchema.parse(response.data);
        return {
          success: true,
          data: validatedData,
        };
      } catch (error) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid blog post format',
        };
      }
    }
    
    return response;
  }

  /**
   * Create a new blog post
   */
  async createBlogPost(data: CreateBlogPost): Promise<ApiResponse<BlogPost>> {
    return this.fetchApi<BlogPost>('/api/blog', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing blog post
   */
  async updateBlogPost(id: string, data: UpdateBlogPost): Promise<ApiResponse<BlogPost>> {
    return this.fetchApi<BlogPost>(`/api/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: string): Promise<ApiResponse<void>> {
    return this.fetchApi<void>(`/api/blog/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get featured blog posts
   */
  async getFeaturedPosts(limit = 5): Promise<ApiResponse<BlogPostPreview[]>> {
    return this.fetchApi<BlogPostPreview[]>(`/api/blog/featured?limit=${limit}`);
  }

  /**
   * Search blog posts
   */
  async searchBlogPosts(query: string, limit = 10): Promise<ApiResponse<BlogPostPreview[]>> {
    const encodedQuery = encodeURIComponent(query);
    return this.fetchApi<BlogPostPreview[]>(`/api/blog/search?q=${encodedQuery}&limit=${limit}`);
  }

  /**
   * Get blog posts by tag
   */
  async getBlogPostsByTag(tag: string, page = 1, limit = 10): Promise<ApiResponse<BlogPostListResponse>> {
    return this.getBlogPosts({
      tags: [tag],
      page,
      limit,
      isPublished: true,
    });
  }

  /**
   * Calculate estimated read time for content
   */
  static calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Generate slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}