import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@nutricoach/blog-preview';
import type { BlogQueryParams, CreateBlogPost } from '@nutricoach/blog-preview';

// Mock data store (in real app, this would be database)
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
  {
    id: '3',
    title: 'Meal Prep for Success',
    slug: 'meal-prep-for-success',
    excerpt: 'Discover effective meal prep strategies to maintain consistent nutrition throughout the week.',
    content: `# Meal Prep for Success

Meal preparation is a game-changer for maintaining consistent nutrition and saving time.

## Benefits of Meal Prep

- Saves time during busy weekdays
- Ensures consistent nutrition
- Reduces food waste
- Saves money on takeout

## Getting Started

### 1. Plan Your Week
- Choose 3-4 base recipes
- Include variety in proteins and vegetables
- Consider your schedule

### 2. Prep Day Strategy
- Cook grains and proteins in bulk
- Wash and chop vegetables
- Prepare grab-and-go snacks

### 3. Storage Tips
- Use glass containers for freshness
- Label everything with dates
- Freeze portions for later weeks

## Sample Meal Prep Menu

**Breakfast**: Overnight oats with berries
**Lunch**: Quinoa bowls with roasted vegetables
**Dinner**: Baked salmon with sweet potato
**Snacks**: Greek yogurt with nuts

Start small and gradually increase your prep as you get comfortable with the process.`,
    authorId: 'user-3',
    authorName: 'Chef Marcus Chen',
    publishedAt: new Date('2024-01-25'),
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-25'),
    readTime: 7,
    tags: ['meal-prep', 'planning', 'recipes', 'time-saving'],
    isPublished: true,
    featuredImage: '/api/placeholder/800/400?text=Meal+Prep',
  },
  {
    id: '4',
    title: 'Building Healthy Habits',
    slug: 'building-healthy-habits',
    excerpt: 'Learn the science behind habit formation and how to create lasting healthy eating patterns.',
    content: `# Building Healthy Habits

Creating lasting change requires understanding how habits work and implementing strategies for success.

## The Habit Loop

Every habit follows a simple pattern:
1. **Cue**: The trigger that starts the behavior
2. **Routine**: The behavior itself
3. **Reward**: The benefit you gain

## Strategies for Success

### Start Small
- Begin with tiny changes
- Focus on consistency over perfection
- Celebrate small wins

### Stack Habits
- Link new habits to existing ones
- Use environmental cues
- Create obvious triggers

### Track Progress
- Use visual reminders
- Keep a habit journal
- Share goals with others

## Common Nutrition Habits

- Drink a glass of water upon waking
- Eat a healthy breakfast daily
- Include vegetables in every meal
- Plan meals in advance
- Mindful eating practices

Remember: It takes an average of 66 days to form a new habit. Be patient with yourself and focus on progress, not perfection.`,
    authorId: 'user-4',
    authorName: 'Dr. Emily Rodriguez',
    publishedAt: new Date('2024-02-01'),
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-02-01'),
    readTime: 6,
    tags: ['habits', 'psychology', 'behavior-change', 'wellness'],
    isPublished: true,
    featuredImage: '/api/placeholder/800/400?text=Healthy+Habits',
  },
  {
    id: '5',
    title: 'Seasonal Nutrition Guide',
    slug: 'seasonal-nutrition-guide',
    excerpt: 'Discover how to eat seasonally for optimal nutrition and flavor throughout the year.',
    content: `# Seasonal Nutrition Guide

Eating seasonally provides the freshest ingredients, best flavors, and optimal nutrition while supporting local farmers.

## Spring (March - May)

### Seasonal Produce
- Asparagus, artichokes, peas
- Strawberries, apricots
- Leafy greens, radishes

### Nutrition Focus
- Detox with fresh greens
- Light, energizing meals
- Increase raw foods

## Summer (June - August)

### Seasonal Produce
- Tomatoes, corn, zucchini
- Berries, stone fruits
- Cucumbers, peppers

### Nutrition Focus
- Stay hydrated with water-rich foods
- Light, cooling meals
- Abundant fresh fruits

## Fall (September - November)

### Seasonal Produce
- Squash, pumpkins, apples
- Brussels sprouts, cauliflower
- Cranberries, pears

### Nutrition Focus
- Warming, grounding foods
- Immune-boosting nutrients
- Preparation for winter

## Winter (December - February)

### Seasonal Produce
- Citrus fruits, root vegetables
- Kale, cabbage, potatoes
- Stored apples, pears

### Nutrition Focus
- Vitamin C for immunity
- Warming, nourishing meals
- Preserved and stored foods

## Benefits of Seasonal Eating

- **Better flavor**: Produce at peak ripeness
- **Lower cost**: Abundant seasonal supply
- **Higher nutrition**: Shorter transport time
- **Environmental**: Reduced carbon footprint
- **Variety**: Natural rotation of foods

Try to make 70% of your diet seasonal for optimal benefits while allowing flexibility for favorites year-round.`,
    authorId: 'user-5',
    authorName: 'Lisa Thompson, RD',
    publishedAt: new Date('2024-02-05'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    readTime: 8,
    tags: ['seasonal-eating', 'nutrition', 'sustainability', 'local-food'],
    isPublished: true,
    featuredImage: '/api/placeholder/800/400?text=Seasonal+Nutrition',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params: BlogQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') as any || 'publishedAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      authorId: searchParams.get('authorId') || undefined,
      isPublished: searchParams.get('isPublished') ? 
        searchParams.get('isPublished') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
    };

    // Filter posts
    let filteredPosts = [...mockBlogPosts];

    // Apply filters
    if (params.authorId) {
      filteredPosts = filteredPosts.filter(post => post.authorId === params.authorId);
    }

    if (params.isPublished !== undefined) {
      filteredPosts = filteredPosts.filter(post => post.isPublished === params.isPublished);
    }

    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt?.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.authorName.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (params.tags?.length) {
      filteredPosts = filteredPosts.filter(post =>
        params.tags!.some(tag => post.tags.includes(tag))
      );
    }

    // Sort posts
    filteredPosts.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (params.sortBy) {
        case 'publishedAt':
          aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
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

      if (aValue < bValue) return params.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return params.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Calculate pagination
    const total = filteredPosts.length;
    const totalPages = Math.ceil(total / params.limit!);
    const startIndex = (params.page! - 1) * params.limit!;
    const endIndex = startIndex + params.limit!;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Convert to preview format (remove content)
    const blogPreviews = paginatedPosts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      authorName: post.authorName,
      publishedAt: post.publishedAt,
      readTime: post.readTime,
      tags: post.tags,
      featuredImage: post.featuredImage,
    }));

    const response = {
      data: blogPreviews,
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CreateBlogPost = await request.json();
    
    // Validate required fields
    if (!data.title || !data.content || !data.authorId || !data.authorName) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = data.slug || BlogService.generateSlug(data.title);
    
    // Check if slug already exists
    const existingPost = mockBlogPosts.find(post => post.slug === slug);
    if (existingPost) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Blog post with this slug already exists' },
        { status: 409 }
      );
    }

    // Calculate read time
    const readTime = data.readTime || BlogService.calculateReadTime(data.content);

    // Create new post
    const newPost = {
      id: `blog-${Date.now()}`,
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      publishedAt: data.publishedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      readTime,
      tags: data.tags || [],
      isPublished: data.isPublished || false,
      featuredImage: data.featuredImage,
    };

    // Add to mock store
    mockBlogPosts.push(newPost);

    return NextResponse.json({ data: newPost }, { status: 201 });
  } catch (error) {
    console.error('Blog creation error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}