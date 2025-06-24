import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatReadTime,
  truncateText,
  extractExcerpt,
  isValidSlug,
  getBlogPostUrl,
  getBlogPostEditUrl,
  sortBlogPosts,
  filterBlogPostsBySearch,
  filterBlogPostsByTags,
  getUniqueTags,
  groupBlogPostsByMonth,
  calculatePagination,
} from '../utils/blog.utils';
import type { BlogPost, BlogPostPreview } from '../types';

describe('Blog Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBe('January 15, 2024');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toBe('January 15, 2024');
    });
  });

  describe('formatReadTime', () => {
    it('should format single minute', () => {
      expect(formatReadTime(1)).toBe('1 min read');
    });

    it('should format multiple minutes', () => {
      expect(formatReadTime(5)).toBe('5 min read');
    });

    it('should handle less than 1 minute', () => {
      expect(formatReadTime(0.5)).toBe('Less than 1 min read');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe(text);
    });

    it('should truncate at word boundary when possible', () => {
      const text = 'This is a test sentence with many words';
      const result = truncateText(text, 15);
      expect(result).toBe('This is a test...');
    });
  });

  describe('extractExcerpt', () => {
    it('should extract excerpt from plain text', () => {
      const content = 'This is a plain text content that should be excerpted properly.';
      const excerpt = extractExcerpt(content, 30);
      expect(excerpt.length).toBeLessThanOrEqual(33); // 30 + '...'
    });

    it('should remove HTML tags', () => {
      const content = '<h1>Title</h1><p>This is <strong>bold</strong> text.</p>';
      const excerpt = extractExcerpt(content);
      expect(excerpt).not.toContain('<');
      expect(excerpt).not.toContain('>');
    });

    it('should remove markdown formatting', () => {
      const content = '# Title\n\nThis is **bold** and *italic* text with [link](url).';
      const excerpt = extractExcerpt(content);
      expect(excerpt).not.toContain('#');
      expect(excerpt).not.toContain('*');
      expect(excerpt).not.toContain('[');
    });
  });

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('test-123')).toBe(true);
      expect(isValidSlug('simple')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('Hello World')).toBe(false); // spaces
      expect(isValidSlug('test_slug')).toBe(false); // underscore
      expect(isValidSlug('test@slug')).toBe(false); // special chars
      expect(isValidSlug('ab')).toBe(false); // too short
      expect(isValidSlug('')).toBe(false); // empty
    });
  });

  describe('getBlogPostUrl', () => {
    it('should generate correct URL', () => {
      const post: BlogPostPreview = {
        id: '1',
        title: 'Test',
        slug: 'test-post',
        authorName: 'Author',
        publishedAt: new Date(),
        tags: [],
      };
      expect(getBlogPostUrl(post)).toBe('/blog/test-post');
    });
  });

  describe('getBlogPostEditUrl', () => {
    it('should generate correct edit URL', () => {
      expect(getBlogPostEditUrl('123')).toBe('/admin/blog/123/edit');
    });
  });

  describe('sortBlogPosts', () => {
    const posts: BlogPostPreview[] = [
      {
        id: '1',
        title: 'B Post',
        slug: 'b-post',
        authorName: 'Author',
        publishedAt: new Date('2024-01-01'),
        readTime: 5,
        tags: [],
      },
      {
        id: '2',
        title: 'A Post',
        slug: 'a-post',
        authorName: 'Author',
        publishedAt: new Date('2024-01-02'),
        readTime: 3,
        tags: [],
      },
    ];

    it('should sort by title ascending', () => {
      const sorted = sortBlogPosts(posts, 'title', 'asc');
      expect(sorted[0].title).toBe('A Post');
      expect(sorted[1].title).toBe('B Post');
    });

    it('should sort by publishedAt descending', () => {
      const sorted = sortBlogPosts(posts, 'publishedAt', 'desc');
      expect(sorted[0].id).toBe('2'); // newer post first
    });

    it('should sort by readTime', () => {
      const sorted = sortBlogPosts(posts, 'readTime', 'asc');
      expect(sorted[0].readTime).toBe(3);
      expect(sorted[1].readTime).toBe(5);
    });
  });

  describe('filterBlogPostsBySearch', () => {
    const posts: BlogPostPreview[] = [
      {
        id: '1',
        title: 'JavaScript Tutorial',
        slug: 'js-tutorial',
        excerpt: 'Learn JavaScript basics',
        authorName: 'John Doe',
        tags: ['javascript', 'tutorial'],
        publishedAt: new Date(),
      },
      {
        id: '2',
        title: 'Python Guide',
        slug: 'python-guide',
        excerpt: 'Python programming guide',
        authorName: 'Jane Smith',
        tags: ['python', 'guide'],
        publishedAt: new Date(),
      },
    ];

    it('should filter by title', () => {
      const filtered = filterBlogPostsBySearch(posts, 'JavaScript');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('JavaScript Tutorial');
    });

    it('should filter by author', () => {
      const filtered = filterBlogPostsBySearch(posts, 'Jane');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].authorName).toBe('Jane Smith');
    });

    it('should filter by tags', () => {
      const filtered = filterBlogPostsBySearch(posts, 'tutorial');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].tags).toContain('tutorial');
    });

    it('should return all posts for empty search', () => {
      const filtered = filterBlogPostsBySearch(posts, '');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterBlogPostsByTags', () => {
    const posts: BlogPostPreview[] = [
      {
        id: '1',
        title: 'Post 1',
        slug: 'post-1',
        authorName: 'Author',
        tags: ['javascript', 'react'],
        publishedAt: new Date(),
      },
      {
        id: '2',
        title: 'Post 2',
        slug: 'post-2',
        authorName: 'Author',
        tags: ['python', 'django'],
        publishedAt: new Date(),
      },
    ];

    it('should filter by single tag', () => {
      const filtered = filterBlogPostsByTags(posts, ['javascript']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by multiple tags (OR logic)', () => {
      const filtered = filterBlogPostsByTags(posts, ['javascript', 'python']);
      expect(filtered).toHaveLength(2);
    });

    it('should return all posts for empty tags', () => {
      const filtered = filterBlogPostsByTags(posts, []);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getUniqueTags', () => {
    const posts: BlogPostPreview[] = [
      {
        id: '1',
        title: 'Post 1',
        slug: 'post-1',
        authorName: 'Author',
        tags: ['javascript', 'react', 'web'],
        publishedAt: new Date(),
      },
      {
        id: '2',
        title: 'Post 2',
        slug: 'post-2',
        authorName: 'Author',
        tags: ['javascript', 'vue', 'web'],
        publishedAt: new Date(),
      },
    ];

    it('should return unique sorted tags', () => {
      const tags = getUniqueTags(posts);
      expect(tags).toEqual(['javascript', 'react', 'vue', 'web']);
    });
  });

  describe('groupBlogPostsByMonth', () => {
    const posts: BlogPostPreview[] = [
      {
        id: '1',
        title: 'Post 1',
        slug: 'post-1',
        authorName: 'Author',
        publishedAt: new Date('2024-01-15'),
        tags: [],
      },
      {
        id: '2',
        title: 'Post 2',
        slug: 'post-2',
        authorName: 'Author',
        publishedAt: new Date('2024-01-20'),
        tags: [],
      },
      {
        id: '3',
        title: 'Post 3',
        slug: 'post-3',
        authorName: 'Author',
        publishedAt: new Date('2024-02-01'),
        tags: [],
      },
    ];

    it('should group posts by month', () => {
      const grouped = groupBlogPostsByMonth(posts);
      expect(grouped['2024-01']).toHaveLength(2);
      expect(grouped['2024-02']).toHaveLength(1);
    });

    it('should handle posts without publishedAt', () => {
      const postsWithoutDate: BlogPostPreview[] = [
        {
          id: '1',
          title: 'Post 1',
          slug: 'post-1',
          authorName: 'Author',
          tags: [],
        },
      ];
      const grouped = groupBlogPostsByMonth(postsWithoutDate);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('calculatePagination', () => {
    it('should calculate pagination correctly', () => {
      const pagination = calculatePagination(100, 3, 10);
      
      expect(pagination.totalItems).toBe(100);
      expect(pagination.currentPage).toBe(3);
      expect(pagination.itemsPerPage).toBe(10);
      expect(pagination.totalPages).toBe(10);
      expect(pagination.hasNextPage).toBe(true);
      expect(pagination.hasPrevPage).toBe(true);
      expect(pagination.startIndex).toBe(20);
      expect(pagination.endIndex).toBe(30);
    });

    it('should handle first page', () => {
      const pagination = calculatePagination(100, 1, 10);
      expect(pagination.hasPrevPage).toBe(false);
      expect(pagination.hasNextPage).toBe(true);
    });

    it('should handle last page', () => {
      const pagination = calculatePagination(100, 10, 10);
      expect(pagination.hasPrevPage).toBe(true);
      expect(pagination.hasNextPage).toBe(false);
    });

    it('should handle partial last page', () => {
      const pagination = calculatePagination(95, 10, 10);
      expect(pagination.endIndex).toBe(95);
    });
  });
});