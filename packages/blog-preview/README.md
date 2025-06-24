# @nutricoach/blog-preview

A comprehensive blog preview module for CI/CD pipeline testing in the NutriCoach ecosystem.

## 🎯 Purpose

This package is designed to test and validate the complete CI/CD pipeline including:

- ✅ TypeScript compilation and type checking
- ✅ ESLint rules and code quality
- ✅ Unit testing with Vitest
- ✅ Component testing with React Testing Library
- ✅ Build process validation
- ✅ Package integration
- ✅ API service patterns
- ✅ Deployment readiness

## 📦 Features

### Types & Schemas
- Comprehensive Zod schemas for blog data
- Full TypeScript type safety
- API response validation
- Input/output type definitions

### Services
- `BlogService` class for API interactions
- Built-in error handling and response validation
- Support for CRUD operations
- Query parameters and filtering
- Static utility methods

### Components
- `BlogCard` - Reusable blog post card component
- `BlogList` - Paginated blog listing with search/filters
- `BlogHero` - Featured post hero section
- Full React props type safety
- Accessibility support
- Event handling

### Utilities
- Date and time formatting
- Text truncation and excerpt generation
- Slug validation and generation
- Sorting and filtering helpers
- Pagination calculations

## 🛠 Installation

```bash
pnpm add @nutricoach/blog-preview
```

## 📋 Usage

### Basic Service Usage

```typescript
import { BlogService } from '@nutricoach/blog-preview';

const blogService = new BlogService('https://api.example.com', 'your-api-key');

// Get paginated blog posts
const response = await blogService.getBlogPosts({
  page: 1,
  limit: 10,
  isPublished: true,
});

if (response.success) {
  console.log(response.data.data); // Blog posts
  console.log(response.data.pagination); // Pagination info
}
```

### React Components

```tsx
import { BlogCard, BlogList, BlogHero } from '@nutricoach/blog-preview';

// Individual blog card
<BlogCard
  post={blogPost}
  onPostClick={(post) => router.push(`/blog/${post.slug}`)}
  onTagClick={(tag) => setSelectedTag(tag)}
/>

// Blog listing with features
<BlogList
  blogService={blogService}
  showSearch={true}
  showPagination={true}
  onPostClick={handlePostClick}
/>

// Featured post hero
<BlogHero
  featuredPost={featuredPost}
  onPostClick={handlePostClick}
/>
```

### Utility Functions

```typescript
import { formatDate, formatReadTime, extractExcerpt } from '@nutricoach/blog-preview';

const formattedDate = formatDate(new Date());
const readTime = formatReadTime(5);
const excerpt = extractExcerpt(longContent, 200);
```

## 🧪 Testing

This package includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Test Categories

- **Unit Tests**: Service methods, utility functions, type validation
- **Component Tests**: React component rendering, props, interactions
- **Integration Tests**: API service integration, error handling
- **Performance Tests**: Large dataset handling, memory usage

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run in development mode
pnpm dev

# Lint code
pnpm lint

# Type check
pnpm type-check
```

## 📊 Pipeline Validation

This package validates these CI/CD pipeline aspects:

### Build Process
- ✅ TypeScript compilation
- ✅ Dependency resolution
- ✅ Package exports
- ✅ Distribution bundle creation

### Code Quality
- ✅ ESLint rule compliance
- ✅ TypeScript strict mode
- ✅ Import/export consistency
- ✅ Naming conventions

### Testing
- ✅ Unit test execution
- ✅ Coverage thresholds (80%+)
- ✅ Component testing
- ✅ Service integration testing

### Integration
- ✅ Package installation
- ✅ Import/export functionality
- ✅ API compatibility
- ✅ Component rendering

## 🚀 CI/CD Integration

### GitHub Actions Usage

```yaml
- name: Test Blog Preview Package
  run: |
    cd packages/blog-preview
    pnpm test:coverage
    pnpm build
    pnpm type-check
```

### Deployment Validation

```typescript
// Health check endpoint
import { PACKAGE_NAME, PACKAGE_VERSION } from '@nutricoach/blog-preview';

export function GET() {
  return Response.json({
    package: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}
```

## 📈 Performance Metrics

Expected performance benchmarks:

- **Bundle Size**: < 50KB gzipped
- **Test Coverage**: > 80% all categories
- **Build Time**: < 30 seconds
- **Test Execution**: < 10 seconds

## 🔗 Dependencies

- **Runtime**: `zod` for schema validation
- **Peer**: `react`, `react-dom` for components
- **Dev**: Testing, linting, and build tools

## 🤝 Contributing

This is a testing module for pipeline validation. Contributions should focus on:

1. **Test Coverage**: Ensure comprehensive test scenarios
2. **Pipeline Validation**: Add new CI/CD validation points
3. **Performance**: Optimize build and test execution
4. **Documentation**: Keep usage examples current

## 📄 License

Part of the NutriCoach monorepo - Internal use only.