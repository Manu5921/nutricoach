import { NextRequest, NextResponse } from 'next/server';
import type { UpdateBlogPost } from '@nutricoach/blog-preview';

// This would typically come from a database
const mockBlogPosts = [
  {
    id: '1',
    title: 'Getting Started with NutriCoach',
    slug: 'getting-started-with-nutricoach',
    excerpt: 'Learn how to use NutriCoach to track your nutrition goals and build healthy habits.',
    content: `# Getting Started with NutriCoach

NutriCoach is your personal nutrition companion that helps you track your daily intake, set goals, and build healthy eating habits.

## Features

- Track your daily nutrition intake
- Set personalized nutrition goals
- Get recipe recommendations
- Monitor your progress over time

## Getting Started

1. Create your account
2. Set your nutrition goals
3. Start logging your meals
4. Track your progress

Let's begin your healthy journey!`,
    authorId: 'user-1',
    authorName: 'NutriCoach Team',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    readTime: 3,
    tags: ['getting-started', 'nutrition', 'health'],
    isPublished: true,
    featuredImage: '/api/placeholder/800/400?text=Getting+Started',
  },
  // Add other mock posts as needed
];

export async function GET(
  request: NextRequest,
  { params }: { params: { blogId: string } }
) {
  try {
    const { blogId } = params;
    
    const post = mockBlogPosts.find(p => p.id === blogId);
    
    if (!post) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('Blog fetch error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { blogId: string } }
) {
  try {
    const { blogId } = params;
    const updates: UpdateBlogPost = await request.json();
    
    const postIndex = mockBlogPosts.findIndex(p => p.id === blogId);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Update the post
    const existingPost = mockBlogPosts[postIndex];
    const updatedPost = {
      ...existingPost,
      ...updates,
      updatedAt: new Date(),
    };

    // If content changed, recalculate read time
    if (updates.content && updates.content !== existingPost.content) {
      const wordCount = updates.content.trim().split(/\s+/).length;
      updatedPost.readTime = Math.ceil(wordCount / 200);
    }

    mockBlogPosts[postIndex] = updatedPost;

    return NextResponse.json({ data: updatedPost });
  } catch (error) {
    console.error('Blog update error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { blogId: string } }
) {
  try {
    const { blogId } = params;
    
    const postIndex = mockBlogPosts.findIndex(p => p.id === blogId);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Remove the post
    mockBlogPosts.splice(postIndex, 1);

    return NextResponse.json({ data: null }, { status: 204 });
  } catch (error) {
    console.error('Blog deletion error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}