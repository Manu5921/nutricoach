import React from 'react';
import type { BlogPostPreview } from '../types';
import { formatDate, formatReadTime, getBlogPostUrl } from '../utils';

export interface BlogCardProps {
  post: BlogPostPreview;
  className?: string;
  showImage?: boolean;
  showExcerpt?: boolean;
  showTags?: boolean;
  onTagClick?: (tag: string) => void;
  onPostClick?: (post: BlogPostPreview) => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  post,
  className = '',
  showImage = true,
  showExcerpt = true,
  showTags = true,
  onTagClick,
  onPostClick,
}) => {
  const handlePostClick = () => {
    onPostClick?.(post);
  };

  const handleTagClick = (tag: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onTagClick?.(tag);
  };

  return (
    <article
      className={`blog-card ${className}`}
      onClick={handlePostClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePostClick();
        }
      }}
      data-testid="blog-card"
    >
      {showImage && post.featuredImage && (
        <div className="blog-card__image">
          <img
            src={post.featuredImage}
            alt={post.title}
            loading="lazy"
            className="blog-card__image-element"
          />
        </div>
      )}
      
      <div className="blog-card__content">
        <header className="blog-card__header">
          <h3 className="blog-card__title" data-testid="blog-card-title">
            {post.title}
          </h3>
          
          <div className="blog-card__meta">
            <span className="blog-card__author" data-testid="blog-card-author">
              By {post.authorName}
            </span>
            {post.publishedAt && (
              <>
                <span className="blog-card__separator">•</span>
                <time 
                  className="blog-card__date"
                  dateTime={post.publishedAt.toISOString()}
                  data-testid="blog-card-date"
                >
                  {formatDate(post.publishedAt)}
                </time>
              </>
            )}
            {post.readTime && (
              <>
                <span className="blog-card__separator">•</span>
                <span className="blog-card__read-time" data-testid="blog-card-read-time">
                  {formatReadTime(post.readTime)}
                </span>
              </>
            )}
          </div>
        </header>

        {showExcerpt && post.excerpt && (
          <p className="blog-card__excerpt" data-testid="blog-card-excerpt">
            {post.excerpt}
          </p>
        )}

        {showTags && post.tags.length > 0 && (
          <footer className="blog-card__footer">
            <div className="blog-card__tags" data-testid="blog-card-tags">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  className="blog-card__tag"
                  onClick={(e) => handleTagClick(tag, e)}
                  data-testid={`blog-card-tag-${tag}`}
                  type="button"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </footer>
        )}
      </div>
    </article>
  );
};

BlogCard.displayName = 'BlogCard';