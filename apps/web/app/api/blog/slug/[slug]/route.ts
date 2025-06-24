import { NextRequest, NextResponse } from 'next/server';

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
  {
    id: '2',
    title: 'Understanding Macronutrients',
    slug: 'understanding-macronutrients',
    excerpt: 'A comprehensive guide to proteins, carbohydrates, and fats - the building blocks of nutrition.',
    content: `# Understanding Macronutrients

Macronutrients are the main components of food that provide energy and support bodily functions.

## The Three Macronutrients

### Proteins
- Building blocks for muscles and tissues
- Recommended: 0.8-1.2g per kg body weight

### Carbohydrates
- Primary energy source
- Choose complex carbs over simple sugars

### Fats
- Essential for hormone production
- Focus on healthy unsaturated fats

## Balancing Your Macros

A balanced approach typically includes:
- 45-65% carbohydrates
- 20-35% fats
- 10-35% proteins

Remember, individual needs vary based on activity level, age, and health goals.`,
    authorId: 'user-2',
    authorName: 'Dr. Sarah Johnson',
    publishedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-20'),
    readTime: 5,
    tags: ['macronutrients', 'nutrition-science', 'education'],
    isPublished: true,
    featuredImage: '/api/placeholder/800/400?text=Macronutrients',
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    const post = mockBlogPosts.find(p => p.slug === slug);
    
    if (!post) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Only return published posts for public access
    if (!post.isPublished) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('Blog fetch by slug error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}