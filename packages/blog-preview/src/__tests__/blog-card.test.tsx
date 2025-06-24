import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlogCard } from '../components/blog-card';
import type { BlogPostPreview } from '../types';

const mockPost: BlogPostPreview = {
  id: '1',
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  excerpt: 'This is a test excerpt for the blog post.',
  authorName: 'John Doe',
  publishedAt: new Date('2024-01-15'),
  readTime: 5,
  tags: ['javascript', 'testing'],
  featuredImage: 'https://example.com/image.jpg',
};

describe('BlogCard', () => {
  it('should render blog post information', () => {
    render(<BlogCard post={mockPost} />);
    
    expect(screen.getByTestId('blog-card-title')).toHaveTextContent('Test Blog Post');
    expect(screen.getByTestId('blog-card-author')).toHaveTextContent('By John Doe');
    expect(screen.getByTestId('blog-card-date')).toHaveTextContent('January 15, 2024');
    expect(screen.getByTestId('blog-card-read-time')).toHaveTextContent('5 min read');
    expect(screen.getByTestId('blog-card-excerpt')).toHaveTextContent('This is a test excerpt for the blog post.');
  });

  it('should render tags when showTags is true', () => {
    render(<BlogCard post={mockPost} showTags={true} />);
    
    expect(screen.getByTestId('blog-card-tags')).toBeInTheDocument();
    expect(screen.getByTestId('blog-card-tag-javascript')).toHaveTextContent('#javascript');
    expect(screen.getByTestId('blog-card-tag-testing')).toHaveTextContent('#testing');
  });

  it('should not render tags when showTags is false', () => {
    render(<BlogCard post={mockPost} showTags={false} />);
    
    expect(screen.queryByTestId('blog-card-tags')).not.toBeInTheDocument();
  });

  it('should render featured image when showImage is true', () => {
    render(<BlogCard post={mockPost} showImage={true} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Blog Post');
  });

  it('should not render image when showImage is false', () => {
    render(<BlogCard post={mockPost} showImage={false} />);
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should not render excerpt when showExcerpt is false', () => {
    render(<BlogCard post={mockPost} showExcerpt={false} />);
    
    expect(screen.queryByTestId('blog-card-excerpt')).not.toBeInTheDocument();
  });

  it('should handle post without optional fields', () => {
    const minimalPost: BlogPostPreview = {
      id: '2',
      title: 'Minimal Post',
      slug: 'minimal-post',
      authorName: 'Jane Doe',
      tags: [],
    };

    render(<BlogCard post={minimalPost} />);
    
    expect(screen.getByTestId('blog-card-title')).toHaveTextContent('Minimal Post');
    expect(screen.getByTestId('blog-card-author')).toHaveTextContent('By Jane Doe');
    expect(screen.queryByTestId('blog-card-date')).not.toBeInTheDocument();
    expect(screen.queryByTestId('blog-card-read-time')).not.toBeInTheDocument();
    expect(screen.queryByTestId('blog-card-excerpt')).not.toBeInTheDocument();
    expect(screen.queryByTestId('blog-card-tags')).not.toBeInTheDocument();
  });

  it('should call onPostClick when card is clicked', () => {
    const onPostClick = vi.fn();
    render(<BlogCard post={mockPost} onPostClick={onPostClick} />);
    
    fireEvent.click(screen.getByTestId('blog-card'));
    
    expect(onPostClick).toHaveBeenCalledWith(mockPost);
  });

  it('should call onTagClick when tag is clicked', () => {
    const onTagClick = vi.fn();
    render(<BlogCard post={mockPost} onTagClick={onTagClick} />);
    
    fireEvent.click(screen.getByTestId('blog-card-tag-javascript'));
    
    expect(onTagClick).toHaveBeenCalledWith('javascript');
  });

  it('should prevent event bubbling when tag is clicked', () => {
    const onPostClick = vi.fn();
    const onTagClick = vi.fn();
    render(<BlogCard post={mockPost} onPostClick={onPostClick} onTagClick={onTagClick} />);
    
    fireEvent.click(screen.getByTestId('blog-card-tag-javascript'));
    
    expect(onTagClick).toHaveBeenCalledWith('javascript');
    expect(onPostClick).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    const onPostClick = vi.fn();
    render(<BlogCard post={mockPost} onPostClick={onPostClick} />);
    
    const card = screen.getByTestId('blog-card');
    
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onPostClick).toHaveBeenCalledWith(mockPost);
    
    onPostClick.mockClear();
    
    fireEvent.keyDown(card, { key: ' ' });
    expect(onPostClick).toHaveBeenCalledWith(mockPost);
  });

  it('should apply custom className', () => {
    render(<BlogCard post={mockPost} className="custom-class" />);
    
    const card = screen.getByTestId('blog-card');
    expect(card).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(<BlogCard post={mockPost} onPostClick={vi.fn()} />);
    
    const card = screen.getByTestId('blog-card');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should not have interactive attributes when no onPostClick', () => {
    render(<BlogCard post={mockPost} />);
    
    const card = screen.getByTestId('blog-card');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('should format date correctly', () => {
    const postWithDate = {
      ...mockPost,
      publishedAt: new Date('2024-12-25'),
    };
    
    render(<BlogCard post={postWithDate} />);
    
    expect(screen.getByTestId('blog-card-date')).toHaveTextContent('December 25, 2024');
  });

  it('should format read time correctly', () => {
    const postWithReadTime = {
      ...mockPost,
      readTime: 1,
    };
    
    render(<BlogCard post={postWithReadTime} />);
    
    expect(screen.getByTestId('blog-card-read-time')).toHaveTextContent('1 min read');
  });
});