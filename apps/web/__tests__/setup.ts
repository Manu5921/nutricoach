import '@testing-library/jest-dom';

// Global test setup for blog preview module tests

// Mock environment variables
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock fetch for Node.js environment
if (!global.fetch) {
  // Use a proper fetch polyfill in real tests
  global.fetch = require('node-fetch');
}

// Mock window.location for client-side navigation tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock console methods for cleaner test output
const originalError = console.error;
console.error = (...args: any[]) => {
  // Suppress React error boundary errors in tests
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Error: Uncaught [Error: ')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  }),
  
  // Helper to create mock blog post
  createMockBlogPost: (overrides = {}) => ({
    id: '1',
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test excerpt',
    content: 'This is test content',
    authorId: 'author-1',
    authorName: 'Test Author',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    readTime: 5,
    tags: ['test'],
    isPublished: true,
    ...overrides,
  }),
  
  // Helper to create mock blog post preview
  createMockBlogPreview: (overrides = {}) => ({
    id: '1',
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test excerpt',
    authorName: 'Test Author',
    publishedAt: new Date('2024-01-01'),
    readTime: 5,
    tags: ['test'],
    ...overrides,
  }),
};

// Type augmentation for global utilities
declare global {
  var testUtils: {
    waitFor: (ms: number) => Promise<void>;
    mockApiResponse: (data: any, status?: number) => any;
    createMockBlogPost: (overrides?: any) => any;
    createMockBlogPreview: (overrides?: any) => any;
  };
}

export {};