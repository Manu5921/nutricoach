import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Integration tests for blog API endpoints
// These tests would typically run against a test server
describe('Blog API Integration', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  describe('GET /api/blog', () => {
    it('should return paginated blog posts', async () => {
      const response = await fetch(`${BASE_URL}/api/blog?limit=5`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
      
      // Validate pagination structure
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('totalPages');
    });

    it('should filter by search query', async () => {
      const response = await fetch(`${BASE_URL}/api/blog?search=nutrition`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.length).toBeGreaterThan(0);
      
      // Verify search results contain the search term
      const hasSearchTerm = data.data.some((post: any) =>
        post.title.toLowerCase().includes('nutrition') ||
        post.excerpt?.toLowerCase().includes('nutrition') ||
        post.tags.some((tag: string) => tag.toLowerCase().includes('nutrition'))
      );
      expect(hasSearchTerm).toBe(true);
    });

    it('should filter by tags', async () => {
      const response = await fetch(`${BASE_URL}/api/blog?tags=nutrition,health`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Verify all posts have at least one of the specified tags
      data.data.forEach((post: any) => {
        const hasTag = post.tags.some((tag: string) =>
          ['nutrition', 'health'].includes(tag)
        );
        expect(hasTag).toBe(true);
      });
    });

    it('should sort by different criteria', async () => {
      const response = await fetch(`${BASE_URL}/api/blog?sortBy=title&sortOrder=asc`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Verify sorting
      const titles = data.data.map((post: any) => post.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    it('should handle pagination correctly', async () => {
      // Get first page
      const page1Response = await fetch(`${BASE_URL}/api/blog?page=1&limit=2`);
      const page1Data = await page1Response.json();
      
      // Get second page
      const page2Response = await fetch(`${BASE_URL}/api/blog?page=2&limit=2`);
      const page2Data = await page2Response.json();
      
      expect(page1Data.data.length).toBe(2);
      expect(page2Data.data.length).toBeGreaterThan(0);
      
      // Verify different posts on different pages
      const page1Ids = page1Data.data.map((post: any) => post.id);
      const page2Ids = page2Data.data.map((post: any) => post.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('GET /api/blog/[id]', () => {
    it('should return a specific blog post', async () => {
      // First get the list to get a valid ID
      const listResponse = await fetch(`${BASE_URL}/api/blog?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.data.length > 0) {
        const postId = listData.data[0].id;
        
        const response = await fetch(`${BASE_URL}/api/blog/${postId}`);
        
        expect(response.status).toBe(200);
        
        const { data: post } = await response.json();
        expect(post).toHaveProperty('id', postId);
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('authorName');
      }
    });

    it('should return 404 for non-existent post', async () => {
      const response = await fetch(`${BASE_URL}/api/blog/non-existent-id`);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/blog/slug/[slug]', () => {
    it('should return a blog post by slug', async () => {
      const response = await fetch(`${BASE_URL}/api/blog/slug/getting-started-with-nutricoach`);
      
      expect(response.status).toBe(200);
      
      const { data: post } = await response.json();
      expect(post).toHaveProperty('slug', 'getting-started-with-nutricoach');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('content');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await fetch(`${BASE_URL}/api/blog/slug/non-existent-slug`);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/blog', () => {
    it('should create a new blog post', async () => {
      const newPost = {
        title: 'Test Integration Post',
        content: 'This is a test post created during integration testing.',
        authorId: 'test-author',
        authorName: 'Test Author',
        slug: 'test-integration-post',
        tags: ['test', 'integration'],
        isPublished: false,
      };

      const response = await fetch(`${BASE_URL}/api/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });

      expect(response.status).toBe(201);

      const { data: createdPost } = await response.json();
      expect(createdPost).toHaveProperty('id');
      expect(createdPost.title).toBe(newPost.title);
      expect(createdPost.slug).toBe(newPost.slug);
      expect(createdPost.authorName).toBe(newPost.authorName);
    });

    it('should validate required fields', async () => {
      const invalidPost = {
        title: 'Test Post',
        // Missing required fields
      };

      const response = await fetch(`${BASE_URL}/api/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPost),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/blog-preview/health', () => {
    it('should return health check information', async () => {
      const response = await fetch(`${BASE_URL}/api/blog-preview/health`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('service', 'blog-preview-integration');
      expect(data).toHaveProperty('package');
      expect(data.package).toHaveProperty('name', '@nutricoach/blog-preview');
      expect(data).toHaveProperty('features');
      expect(data).toHaveProperty('endpoints');
      expect(data).toHaveProperty('pages');
    });

    it('should support HEAD requests for health checks', async () => {
      const response = await fetch(`${BASE_URL}/api/blog-preview/health`, {
        method: 'HEAD',
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(500);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/blog?page=invalid&limit=abc`);
      
      // Should default to page 1, limit 10
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/blog?limit=10`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should handle large limit values gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/blog?limit=1000`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      // Should cap the limit to reasonable value
      expect(data.data.length).toBeLessThanOrEqual(100);
    });
  });
});