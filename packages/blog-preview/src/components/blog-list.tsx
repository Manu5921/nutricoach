import React, { useState, useEffect } from 'react';
import type { BlogPostPreview, BlogQueryParams, BlogPostListResponse } from '../types';
import { BlogCard } from './blog-card';
import { BlogService } from '../services';

export interface BlogListProps {
  blogService: BlogService;
  initialParams?: BlogQueryParams;
  className?: string;
  showLoadMore?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  cardProps?: Partial<React.ComponentProps<typeof BlogCard>>;
  onPostClick?: (post: BlogPostPreview) => void;
  onTagClick?: (tag: string) => void;
  onError?: (error: string) => void;
}

export const BlogList: React.FC<BlogListProps> = ({
  blogService,
  initialParams = {},
  className = '',
  showLoadMore = false,
  showPagination = true,
  showSearch = true,
  showFilters = false,
  cardProps = {},
  onPostClick,
  onTagClick,
  onError,
}) => {
  const [posts, setPosts] = useState<BlogPostPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<BlogQueryParams>(initialParams);

  const loadPosts = async (params: BlogQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await blogService.getBlogPosts({
        ...filters,
        ...params,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        if (showLoadMore && params.page && params.page > 1) {
          setPosts(prev => [...prev, ...response.data!.data]);
        } else {
          setPosts(response.data.data);
        }
        setPagination(response.data.pagination);
      } else {
        const errorMessage = response.message || 'Failed to load blog posts';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filters, searchTerm]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadPosts({ page: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    if (showLoadMore) {
      loadPosts({ page });
    } else {
      setFilters(prev => ({ ...prev, page }));
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      handlePageChange(pagination.page + 1);
    }
  };

  const renderSearch = () => (
    <form onSubmit={handleSearch} className="blog-list__search" data-testid="blog-search-form">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search blog posts..."
        className="blog-list__search-input"
        data-testid="blog-search-input"
      />
      <button type="submit" className="blog-list__search-button" data-testid="blog-search-button">
        Search
      </button>
    </form>
  );

  const renderPagination = () => {
    if (!showPagination || pagination.totalPages <= 1) return null;

    return (
      <nav className="blog-list__pagination" data-testid="blog-pagination">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="blog-list__pagination-button"
          data-testid="blog-pagination-prev"
        >
          Previous
        </button>
        
        <span className="blog-list__pagination-info" data-testid="blog-pagination-info">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="blog-list__pagination-button"
          data-testid="blog-pagination-next"
        >
          Next
        </button>
      </nav>
    );
  };

  const renderLoadMore = () => {
    if (!showLoadMore || pagination.page >= pagination.totalPages) return null;

    return (
      <div className="blog-list__load-more" data-testid="blog-load-more">
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="blog-list__load-more-button"
          data-testid="blog-load-more-button"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      </div>
    );
  };

  const renderError = () => (
    <div className="blog-list__error" data-testid="blog-list-error">
      <p>Error: {error}</p>
      <button
        onClick={() => loadPosts()}
        className="blog-list__retry-button"
        data-testid="blog-list-retry"
      >
        Retry
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="blog-list__loading" data-testid="blog-list-loading">
      <p>Loading blog posts...</p>
    </div>
  );

  const renderEmpty = () => (
    <div className="blog-list__empty" data-testid="blog-list-empty">
      <p>No blog posts found.</p>
    </div>
  );

  const renderPosts = () => (
    <div className="blog-list__posts" data-testid="blog-list-posts">
      {posts.map((post) => (
        <BlogCard
          key={post.id}
          post={post}
          onPostClick={onPostClick}
          onTagClick={onTagClick}
          {...cardProps}
        />
      ))}
    </div>
  );

  return (
    <div className={`blog-list ${className}`} data-testid="blog-list">
      {showSearch && renderSearch()}
      
      {error && renderError()}
      
      {loading && posts.length === 0 && renderLoading()}
      
      {!loading && !error && posts.length === 0 && renderEmpty()}
      
      {posts.length > 0 && renderPosts()}
      
      {showLoadMore && renderLoadMore()}
      
      {!showLoadMore && renderPagination()}
    </div>
  );
};

BlogList.displayName = 'BlogList';