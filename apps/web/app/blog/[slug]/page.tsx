'use client';

import React, { useEffect, useState } from 'react';
import { BlogService } from '@nutricoach/blog-preview';
import type { BlogPost } from '@nutricoach/blog-preview';
import { formatDate, formatReadTime } from '@nutricoach/blog-preview';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const [blogService] = useState(() => new BlogService('/'));
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await blogService.getBlogPostBySlug(params.slug);
        
        if (response.success && response.data) {
          setPost(response.data);
        } else {
          setError(response.message || 'Blog post not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [params.slug, blogService]);

  const handleTagClick = (tag: string) => {
    // In a real app, this would navigate to filtered blog list
    window.location.href = `/blog?tag=${encodeURIComponent(tag)}`;
  };

  const handleBackClick = () => {
    window.location.href = '/blog';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-8"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {error === 'Blog post not found' ? 'Post Not Found' : 'Error Loading Post'}
              </h1>
              <p className="text-gray-600">{error}</p>
            </div>
            <button
              onClick={handleBackClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              ← Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <button
            onClick={handleBackClick}
            className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            data-testid="back-to-blog"
          >
            ← Back to Blog
          </button>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">{post.authorName}</span>
            {post.publishedAt && (
              <>
                <span>•</span>
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
              </>
            )}
            {post.readTime && (
              <>
                <span>•</span>
                <span>{formatReadTime(post.readTime)}</span>
              </>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  data-testid={`tag-${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
              data-testid="featured-image"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-12"
          data-testid="blog-content"
          dangerouslySetInnerHTML={{ 
            __html: post.content.replace(/\n/g, '<br>').replace(/# /g, '<h1>').replace(/<\/h1><br>/g, '</h1>')
          }}
        />

        {/* Footer */}
        <footer className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">
                Published on {formatDate(post.publishedAt || post.createdAt)}
              </p>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <p className="text-sm text-gray-500">
                  Last updated on {formatDate(post.updatedAt)}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleBackClick}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                ← More Articles
              </button>
            </div>
          </div>
        </footer>
      </article>

      <style jsx global>{`
        /* Prose Styles for Content */
        .prose {
          color: #374151;
          line-height: 1.75;
        }

        .prose h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }

        .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .prose p {
          margin-bottom: 1.25rem;
        }

        .prose ul, .prose ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }

        .prose li {
          margin-bottom: 0.5rem;
        }

        .prose ul li {
          list-style-type: disc;
        }

        .prose ol li {
          list-style-type: decimal;
        }

        .prose strong {
          font-weight: 600;
          color: #111827;
        }

        .prose em {
          font-style: italic;
        }

        .prose code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #1f2937;
        }

        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #6b7280;
          font-style: italic;
        }

        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #1d4ed8;
        }

        @media (max-width: 768px) {
          .prose h1 {
            font-size: 1.75rem;
          }
          
          .prose h2 {
            font-size: 1.375rem;
          }
          
          .prose h3 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}