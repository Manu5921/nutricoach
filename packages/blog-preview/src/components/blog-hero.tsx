import React from 'react';
import type { BlogPostPreview } from '../types';
import { formatDate, formatReadTime } from '../utils';

export interface BlogHeroProps {
  featuredPost: BlogPostPreview;
  className?: string;
  showExcerpt?: boolean;
  showImage?: boolean;
  onPostClick?: (post: BlogPostPreview) => void;
}

export const BlogHero: React.FC<BlogHeroProps> = ({
  featuredPost,
  className = '',
  showExcerpt = true,
  showImage = true,
  onPostClick,
}) => {
  const handleClick = () => {
    onPostClick?.(featuredPost);
  };

  return (
    <section
      className={`blog-hero ${className}`}
      data-testid="blog-hero"
      onClick={handleClick}
      role={onPostClick ? 'button' : undefined}
      tabIndex={onPostClick ? 0 : undefined}
      onKeyDown={onPostClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {showImage && featuredPost.featuredImage && (
        <div className="blog-hero__image-container">
          <img
            src={featuredPost.featuredImage}
            alt={featuredPost.title}
            className="blog-hero__image"
            data-testid="blog-hero-image"
          />
          <div className="blog-hero__image-overlay" />
        </div>
      )}
      
      <div className="blog-hero__content">
        <div className="blog-hero__badge" data-testid="blog-hero-badge">
          Featured Post
        </div>
        
        <header className="blog-hero__header">
          <h1 className="blog-hero__title" data-testid="blog-hero-title">
            {featuredPost.title}
          </h1>
          
          <div className="blog-hero__meta">
            <span className="blog-hero__author" data-testid="blog-hero-author">
              By {featuredPost.authorName}
            </span>
            
            {featuredPost.publishedAt && (
              <>
                <span className="blog-hero__separator">•</span>
                <time
                  className="blog-hero__date"
                  dateTime={featuredPost.publishedAt.toISOString()}
                  data-testid="blog-hero-date"
                >
                  {formatDate(featuredPost.publishedAt)}
                </time>
              </>
            )}
            
            {featuredPost.readTime && (
              <>
                <span className="blog-hero__separator">•</span>
                <span className="blog-hero__read-time" data-testid="blog-hero-read-time">
                  {formatReadTime(featuredPost.readTime)}
                </span>
              </>
            )}
          </div>
        </header>
        
        {showExcerpt && featuredPost.excerpt && (
          <p className="blog-hero__excerpt" data-testid="blog-hero-excerpt">
            {featuredPost.excerpt}
          </p>
        )}
        
        {featuredPost.tags.length > 0 && (
          <div className="blog-hero__tags" data-testid="blog-hero-tags">
            {featuredPost.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="blog-hero__tag"
                data-testid={`blog-hero-tag-${tag}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {onPostClick && (
          <div className="blog-hero__action">
            <button
              className="blog-hero__read-more"
              onClick={handleClick}
              data-testid="blog-hero-read-more"
            >
              Read Full Article
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

BlogHero.displayName = 'BlogHero';