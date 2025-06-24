import type { BlogPost, BlogPostPreview } from '../types';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format read time for display
 */
export function formatReadTime(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
    return truncated.slice(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}

/**
 * Extract excerpt from content if not provided
 */
export function extractExcerpt(content: string, maxLength = 200): string {
  // Remove HTML tags and markdown formatting
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  
  return truncateText(plainText, maxLength);
}

/**
 * Validate blog post slug
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
}

/**
 * Get blog post URL
 */
export function getBlogPostUrl(post: BlogPost | BlogPostPreview): string {
  return `/blog/${post.slug}`;
}

/**
 * Get blog post edit URL
 */
export function getBlogPostEditUrl(postId: string): string {
  return `/admin/blog/${postId}/edit`;
}

/**
 * Sort blog posts by specified criteria
 */
export function sortBlogPosts<T extends BlogPost | BlogPostPreview>(
  posts: T[],
  sortBy: 'publishedAt' | 'createdAt' | 'title' | 'readTime' = 'publishedAt',
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...posts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'publishedAt':
        aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        break;
      case 'createdAt':
        aValue = new Date((a as BlogPost).createdAt || 0).getTime();
        bValue = new Date((b as BlogPost).createdAt || 0).getTime();
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'readTime':
        aValue = a.readTime || 0;
        bValue = b.readTime || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filter blog posts by search term
 */
export function filterBlogPostsBySearch<T extends BlogPost | BlogPostPreview>(
  posts: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return posts;

  const term = searchTerm.toLowerCase();
  
  return posts.filter(post => {
    return (
      post.title.toLowerCase().includes(term) ||
      post.excerpt?.toLowerCase().includes(term) ||
      post.authorName.toLowerCase().includes(term) ||
      post.tags.some(tag => tag.toLowerCase().includes(term)) ||
      ('content' in post && post.content.toLowerCase().includes(term))
    );
  });
}

/**
 * Filter blog posts by tags
 */
export function filterBlogPostsByTags<T extends BlogPost | BlogPostPreview>(
  posts: T[],
  tags: string[]
): T[] {
  if (!tags.length) return posts;

  return posts.filter(post =>
    tags.some(tag => post.tags.includes(tag))
  );
}

/**
 * Get unique tags from blog posts
 */
export function getUniqueTags<T extends BlogPost | BlogPostPreview>(posts: T[]): string[] {
  const allTags = posts.flatMap(post => post.tags);
  return [...new Set(allTags)].sort();
}

/**
 * Group blog posts by month
 */
export function groupBlogPostsByMonth<T extends BlogPost | BlogPostPreview>(
  posts: T[]
): Record<string, T[]> {
  return posts.reduce((groups, post) => {
    if (!post.publishedAt) return groups;
    
    const date = new Date(post.publishedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    
    groups[monthKey].push(post);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate pagination info
 */
export function calculatePagination(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  return {
    totalItems,
    currentPage,
    itemsPerPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems),
  };
}