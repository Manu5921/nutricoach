import { z } from 'zod';

// Base blog post schema
export const BlogPostSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  publishedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).default([]),
  readTime: z.number().min(1).optional(),
  isPublished: z.boolean().default(false),
  featuredImage: z.string().url().optional(),
});

// Create blog post schema (without generated fields)
export const CreateBlogPostSchema = BlogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update blog post schema (partial without id and timestamps)
export const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

// Blog post preview schema (minimal data for listing)
export const BlogPostPreviewSchema = BlogPostSchema.pick({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  authorName: true,
  publishedAt: true,
  readTime: true,
  tags: true,
  featuredImage: true,
});

// API response schemas
export const BlogPostListResponseSchema = z.object({
  data: z.array(BlogPostPreviewSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    totalPages: z.number().min(0),
  }),
});

export const BlogPostResponseSchema = z.object({
  data: BlogPostSchema,
});

// API error schema
export const BlogApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.number(),
  details: z.record(z.any()).optional(),
});

// Type exports
export type BlogPost = z.infer<typeof BlogPostSchema>;
export type CreateBlogPost = z.infer<typeof CreateBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof UpdateBlogPostSchema>;
export type BlogPostPreview = z.infer<typeof BlogPostPreviewSchema>;
export type BlogPostListResponse = z.infer<typeof BlogPostListResponseSchema>;
export type BlogPostResponse = z.infer<typeof BlogPostResponseSchema>;
export type BlogApiError = z.infer<typeof BlogApiErrorSchema>;

// Filter and sort types
export type BlogSortBy = 'publishedAt' | 'createdAt' | 'title' | 'readTime';
export type BlogSortOrder = 'asc' | 'desc';

export interface BlogFilters {
  authorId?: string;
  tags?: string[];
  isPublished?: boolean;
  search?: string;
}

export interface BlogQueryParams extends BlogFilters {
  page?: number;
  limit?: number;
  sortBy?: BlogSortBy;
  sortOrder?: BlogSortOrder;
}