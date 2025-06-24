'use client';

import React, { useEffect, useState } from 'react';
import { BlogService, BlogList, BlogHero } from '@nutricoach/blog-preview';
import type { BlogPostPreview } from '@nutricoach/blog-preview';

export default function BlogPage() {
  const [blogService] = useState(() => new BlogService('/'));
  const [featuredPost, setFeaturedPost] = useState<BlogPostPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedPost = async () => {
      try {
        const response = await blogService.getBlogPosts({
          limit: 1,
          sortBy: 'publishedAt',
          sortOrder: 'desc',
          isPublished: true,
        });

        if (response.success && response.data?.data.length > 0) {
          setFeaturedPost(response.data.data[0]);
        }
      } catch (error) {
        console.error('Failed to load featured post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedPost();
  }, [blogService]);

  const handlePostClick = (post: BlogPostPreview) => {
    // In a real app, this would use Next.js router
    window.location.href = `/blog/${post.slug}`;
  };

  const handleTagClick = (tag: string) => {
    // In a real app, this would filter posts by tag
    console.log('Filter by tag:', tag);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">NutriCoach Blog</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Discover expert insights, nutrition tips, and healthy recipes to fuel your wellness journey.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Post Hero */}
        {featuredPost && (
          <section className="mb-16">
            <BlogHero
              featuredPost={featuredPost}
              onPostClick={handlePostClick}
              className="blog-hero-custom"
            />
          </section>
        )}

        {/* Blog List */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Articles</h2>
            <p className="text-gray-600">Stay up to date with the latest nutrition insights and tips.</p>
          </div>

          <BlogList
            blogService={blogService}
            initialParams={{
              limit: 6,
              isPublished: true,
              sortBy: 'publishedAt',
              sortOrder: 'desc',
            }}
            showSearch={true}
            showPagination={true}
            onPostClick={handlePostClick}
            onTagClick={handleTagClick}
            className="blog-list-custom"
            cardProps={{
              showImage: true,
              showExcerpt: true,
              showTags: true,
            }}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 NutriCoach. All rights reserved.</p>
            <p className="mt-2 text-sm">
              This is a test page for CI/CD pipeline validation.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx global>{`
        /* Hero Styles */
        .blog-hero-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 3rem;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .blog-hero-custom .blog-hero__content {
          position: relative;
          z-index: 2;
        }

        .blog-hero-custom .blog-hero__badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .blog-hero-custom .blog-hero__title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .blog-hero-custom .blog-hero__meta {
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }

        .blog-hero-custom .blog-hero__excerpt {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.95;
        }

        .blog-hero-custom .blog-hero__read-more {
          background: white;
          color: #667eea;
          padding: 0.75rem 2rem;
          border-radius: 25px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .blog-hero-custom .blog-hero__read-more:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        /* Blog List Styles */
        .blog-list-custom .blog-list__search {
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          align-items: center;
          max-width: 500px;
        }

        .blog-list-custom .blog-list__search-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }

        .blog-list-custom .blog-list__search-button {
          background: #10b981;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .blog-list-custom .blog-list__search-button:hover {
          background: #059669;
        }

        .blog-list-custom .blog-list__posts {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        /* Blog Card Styles */
        .blog-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid #f3f4f6;
        }

        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .blog-card__image {
          height: 200px;
          overflow: hidden;
        }

        .blog-card__image-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .blog-card:hover .blog-card__image-element {
          transform: scale(1.05);
        }

        .blog-card__content {
          padding: 1.5rem;
        }

        .blog-card__title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .blog-card__meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .blog-card__separator {
          opacity: 0.5;
        }

        .blog-card__excerpt {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .blog-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .blog-card__tag {
          background: #f3f4f6;
          color: #374151;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .blog-card__tag:hover {
          background: #e5e7eb;
        }

        /* Pagination Styles */
        .blog-list__pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 3rem;
        }

        .blog-list__pagination-button {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .blog-list__pagination-button:not(:disabled):hover {
          background: #f3f4f6;
        }

        .blog-list__pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .blog-list__pagination-info {
          color: #6b7280;
          font-weight: 500;
        }

        /* Loading and Error States */
        .blog-list__loading,
        .blog-list__error,
        .blog-list__empty {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .blog-list__error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
        }

        .blog-list__retry-button {
          background: #dc2626;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          margin-top: 1rem;
          cursor: pointer;
        }

        .blog-list__retry-button:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
}