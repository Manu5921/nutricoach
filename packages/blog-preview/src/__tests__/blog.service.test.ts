import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlogService } from '../services/blog.service';
import type { BlogPostListResponse, BlogPost } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('BlogService', () => {
  let blogService: BlogService;
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    blogService = new BlogService('https://api.example.com', 'test-key');
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with base URL and API key', () => {
      const service = new BlogService('https://api.test.com/', 'key123');
      expect(service).toBeInstanceOf(BlogService);
    });

    it('should handle trailing slash in base URL', () => {
      const service = new BlogService('https://api.test.com/');
      expect(service).toBeInstanceOf(BlogService);
    });
  });

  describe('getBlogPosts', () => {
    const mockResponse: BlogPostListResponse = {
      data: [
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          excerpt: 'Test excerpt',
          authorName: 'Test Author',
          publishedAt: new Date('2024-01-01'),
          readTime: 5,
          tags: ['test'],
          featuredImage: 'https://example.com/image.jpg',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    it('should fetch blog posts successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await blogService.getBlogPosts();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await blogService.getBlogPosts({
        page: 2,
        limit: 20,
        sortBy: 'title',
        sortOrder: 'asc',
        authorId: 'author123',
        isPublished: true,
        search: 'test query',
        tags: ['tag1', 'tag2'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog?page=2&limit=20&sortBy=title&sortOrder=asc&authorId=author123&isPublished=true&search=test%20query&tags=tag1%2Ctag2',
        expect.any(Object)
      );
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await blogService.getBlogPosts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await blogService.getBlogPosts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 404');
      expect(result.message).toBe('Not Found');
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      });

      const result = await blogService.getBlogPosts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Invalid response format');
    });
  });

  describe('getBlogPost', () => {
    const mockPost: BlogPost = {
      id: '1',
      title: 'Test Post',
      slug: 'test-post',
      excerpt: 'Test excerpt',
      content: 'Test content',
      authorId: 'author1',
      authorName: 'Test Author',
      publishedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      readTime: 5,
      tags: ['test'],
      isPublished: true,
      featuredImage: 'https://example.com/image.jpg',
    };

    it('should fetch a single blog post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      });

      const result = await blogService.getBlogPost('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog/1',
        expect.any(Object)
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPost);
    });
  });

  describe('getBlogPostBySlug', () => {
    const mockPost: BlogPost = {
      id: '1',
      title: 'Test Post',
      slug: 'test-post',
      excerpt: 'Test excerpt',
      content: 'Test content',
      authorId: 'author1',
      authorName: 'Test Author',
      publishedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      readTime: 5,
      tags: ['test'],
      isPublished: true,
    };

    it('should fetch blog post by slug', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      });

      const result = await blogService.getBlogPostBySlug('test-post');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog/slug/test-post',
        expect.any(Object)
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPost);
    });
  });

  describe('static methods', () => {
    describe('calculateReadTime', () => {
      it('should calculate read time correctly', () => {
        const content = 'word '.repeat(200); // 200 words
        const readTime = BlogService.calculateReadTime(content);
        expect(readTime).toBe(1); // 200 words / 200 wpm = 1 minute
      });

      it('should round up to nearest minute', () => {
        const content = 'word '.repeat(250); // 250 words
        const readTime = BlogService.calculateReadTime(content);
        expect(readTime).toBe(2); // 250 words / 200 wpm = 1.25, rounded up to 2
      });

      it('should handle empty content', () => {
        const readTime = BlogService.calculateReadTime('');
        expect(readTime).toBe(1); // Minimum 1 minute
      });
    });

    describe('generateSlug', () => {
      it('should generate slug from title', () => {
        const slug = BlogService.generateSlug('Hello World Test');
        expect(slug).toBe('hello-world-test');
      });

      it('should handle special characters', () => {
        const slug = BlogService.generateSlug('Hello, World! & Test?');
        expect(slug).toBe('hello-world-test');
      });

      it('should handle multiple spaces', () => {
        const slug = BlogService.generateSlug('Hello    World   Test');
        expect(slug).toBe('hello-world-test');
      });

      it('should handle leading and trailing dashes', () => {
        const slug = BlogService.generateSlug('-Hello World-');
        expect(slug).toBe('hello-world');
      });

      it('should handle empty title', () => {
        const slug = BlogService.generateSlug('');
        expect(slug).toBe('');
      });
    });
  });

  describe('createBlogPost', () => {
    it('should create a blog post', async () => {
      const newPost = {
        title: 'New Post',
        slug: 'new-post',
        content: 'Content',
        authorId: 'author1',
        authorName: 'Author',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...newPost, id: '1' }),
      });

      const result = await blogService.createBlogPost(newPost);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPost),
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('updateBlogPost', () => {
    it('should update a blog post', async () => {
      const updateData = { title: 'Updated Title' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...updateData }),
      });

      const result = await blogService.updateBlogPost('1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('deleteBlogPost', () => {
    it('should delete a blog post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await blogService.deleteBlogPost('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/blog/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result.success).toBe(true);
    });
  });
});