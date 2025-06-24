/**
 * Shared ESLint Configuration for NutriCoach ecosystem
 * Extensible base configuration for consistent code quality
 */

module.exports = {
  // Base configurations
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'next/core-web-vitals',
    'prettier',
  ],

  // Parser for TypeScript
  parser: '@typescript-eslint/parser',
  
  // Parser options
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  // Plugins
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y',
  ],

  // Environment
  env: {
    browser: true,
    node: true,
    es2023: true,
    jest: true,
  },

  // Global variables
  globals: {
    React: 'readonly',
    JSX: 'readonly',
  },

  // Rule configurations
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',

    // React specific
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import/Export
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'off', // Handled by TypeScript
    'import/named': 'off', // Handled by TypeScript
    'import/default': 'off', // Handled by TypeScript
    'import/namespace': 'off', // Handled by TypeScript

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',

    // Performance
    'no-inner-declarations': 'error',
    'no-loop-func': 'error',
    'no-new-func': 'error',
  },

  // Override rules for specific file patterns
  overrides: [
    {
      // TypeScript files
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off', // Handled by TypeScript
      },
    },
    {
      // Test files
      files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
        'vitest/globals': true,
      },
      plugins: ['vitest'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    {
      // Configuration files
      files: [
        '*.config.{js,ts}',
        '.eslintrc.{js,ts}',
        'tailwind.config.{js,ts}',
        'next.config.{js,ts}',
      ],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
    {
      // Next.js specific
      files: ['pages/**/*', 'app/**/*'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      // API routes
      files: ['pages/api/**/*', 'app/api/**/*'],
      rules: {
        'import/no-anonymous-default-export': 'off',
      },
    },
  ],

  // Settings
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },

  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'public/',
  ],
};

/**
 * Configuration variants for different project types
 */

// Base configuration for libraries
const libraryConfig = {
  ...module.exports,
  env: {
    ...module.exports.env,
    browser: false,
  },
  rules: {
    ...module.exports.rules,
    'no-console': 'error', // Stricter for libraries
  },
};

// Configuration for Node.js projects
const nodeConfig = {
  ...module.exports,
  env: {
    ...module.exports.env,
    browser: false,
    node: true,
  },
  rules: {
    ...module.exports.rules,
    'no-console': 'off', // Allow console in Node.js
  },
};

// Configuration for React libraries
const reactLibraryConfig = {
  ...module.exports,
  env: {
    ...module.exports.env,
    browser: false,
  },
  rules: {
    ...module.exports.rules,
    'no-console': 'error',
    'react/prop-types': 'error', // Enable prop-types for libraries
  },
};

module.exports.library = libraryConfig;
module.exports.node = nodeConfig;
module.exports.reactLibrary = reactLibraryConfig;