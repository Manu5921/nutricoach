/**
 * ESLint Configuration Variants
 * Extensible ESLint configurations for different project types
 */

/**
 * Base ESLint configuration
 */
export const eslintConfigBase = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    
    // General JavaScript rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Code quality
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', 100],
    'max-params': ['warn', 4],
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '*.config.js',
    '*.config.ts',
  ],
};

/**
 * React/Next.js configuration
 */
export const eslintConfigReact = {
  ...eslintConfigBase,
  extends: [
    ...eslintConfigBase.extends,
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'next/core-web-vitals',
  ],
  plugins: [
    ...eslintConfigBase.plugins,
    'react',
    'react-hooks',
    'jsx-a11y',
  ],
  parserOptions: {
    ...eslintConfigBase.parserOptions,
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    ...eslintConfigBase.env,
    browser: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    ...eslintConfigBase.rules,
    
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js
    'react/prop-types': 'off', // Using TypeScript
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-danger': 'warn',
    'react/no-deprecated': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': 'error',
    'react/no-unknown-property': 'error',
    'react/prefer-es6-class': 'error',
    'react/require-render-return': 'error',
    'react/self-closing-comp': 'error',
    'react/sort-comp': 'error',
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // JSX Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
  },
};

/**
 * Node.js server configuration
 */
export const eslintConfigNode = {
  ...eslintConfigBase,
  extends: [
    ...eslintConfigBase.extends,
    'plugin:node/recommended',
  ],
  plugins: [
    ...eslintConfigBase.plugins,
    'node',
  ],
  env: {
    node: true,
    es6: true,
    browser: false,
  },
  rules: {
    ...eslintConfigBase.rules,
    
    // Node.js specific rules
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-extraneous-import': 'error',
    'node/no-missing-require': 'error',
    'node/no-unpublished-require': 'error',
    'node/no-extraneous-require': 'error',
    'node/prefer-global/buffer': 'error',
    'node/prefer-global/console': 'error',
    'node/prefer-global/process': 'error',
    'node/prefer-global/url': 'error',
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',
    
    // Allow console in Node.js
    'no-console': 'off',
  },
};

/**
 * Library package configuration
 */
export const eslintConfigLibrary = {
  ...eslintConfigBase,
  rules: {
    ...eslintConfigBase.rules,
    
    // Stricter rules for libraries
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'complexity': ['error', 8],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 3],
    
    // Documentation requirements
    'valid-jsdoc': 'warn',
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false,
      },
    }],
  },
};

/**
 * Testing configuration
 */
export const eslintConfigTest = {
  ...eslintConfigBase,
  extends: [
    ...eslintConfigBase.extends,
    'plugin:vitest/recommended',
    'plugin:testing-library/react',
  ],
  plugins: [
    ...eslintConfigBase.plugins,
    'vitest',
    'testing-library',
  ],
  env: {
    ...eslintConfigBase.env,
    'vitest/env': true,
  },
  rules: {
    ...eslintConfigBase.rules,
    
    // Testing specific rules
    'vitest/consistent-test-it': 'error',
    'vitest/expect-expect': 'error',
    'vitest/no-disabled-tests': 'warn',
    'vitest/no-focused-tests': 'error',
    'vitest/no-identical-title': 'error',
    'vitest/prefer-to-be': 'error',
    'vitest/prefer-to-contain': 'error',
    'vitest/prefer-to-have-length': 'error',
    'vitest/valid-expect': 'error',
    
    // Testing Library rules
    'testing-library/await-async-query': 'error',
    'testing-library/no-await-sync-query': 'error',
    'testing-library/no-debugging-utils': 'warn',
    'testing-library/no-dom-import': 'error',
    'testing-library/prefer-find-by': 'error',
    'testing-library/prefer-screen-queries': 'error',
    'testing-library/render-result-naming-convention': 'error',
    
    // Relaxed rules for tests
    '@typescript-eslint/no-explicit-any': 'off',
    'max-lines-per-function': 'off',
    'complexity': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};

/**
 * Storybook configuration
 */
export const eslintConfigStorybook = {
  ...eslintConfigReact,
  extends: [
    ...eslintConfigReact.extends,
    'plugin:storybook/recommended',
  ],
  plugins: [
    ...eslintConfigReact.plugins,
    'storybook',
  ],
  rules: {
    ...eslintConfigReact.rules,
    
    // Storybook specific rules
    'storybook/await-interactions': 'error',
    'storybook/context-in-play-function': 'error',
    'storybook/default-exports': 'error',
    'storybook/hierarchy-separator': 'error',
    'storybook/no-redundant-story-name': 'error',
    'storybook/prefer-pascal-case': 'error',
    'storybook/story-exports': 'error',
    'storybook/use-storybook-expect': 'error',
    'storybook/use-storybook-testing-library': 'error',
    
    // Relaxed rules for stories
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['**/*.stories.{ts,tsx}'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
};

/**
 * Security-focused configuration
 */
export const eslintConfigSecurity = {
  ...eslintConfigBase,
  extends: [
    ...eslintConfigBase.extends,
    'plugin:security/recommended',
  ],
  plugins: [
    ...eslintConfigBase.plugins,
    'security',
  ],
  rules: {
    ...eslintConfigBase.rules,
    
    // Security rules
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
  },
};

/**
 * Performance-focused configuration
 */
export const eslintConfigPerformance = {
  ...eslintConfigBase,
  extends: [
    ...eslintConfigBase.extends,
    'plugin:perf-standard/recommended',
  ],
  plugins: [
    ...eslintConfigBase.plugins,
    'perf-standard',
  ],
  rules: {
    ...eslintConfigBase.rules,
    
    // Performance rules
    'perf-standard/check-function-inline': 'warn',
    'perf-standard/no-instanceof-guard': 'warn',
    'perf-standard/no-self-in-constructor': 'error',
    
    // Additional performance-related rules
    'prefer-const': 'error',
    'no-inner-declarations': 'error',
    'no-loop-func': 'error',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-array-constructor': 'error',
  },
};

/**
 * Function to create custom ESLint config
 */
export function createEslintConfig(
  type: 'base' | 'react' | 'node' | 'library' | 'test' | 'storybook' | 'security' | 'performance',
  customOptions?: any
) {
  const configs = {
    base: eslintConfigBase,
    react: eslintConfigReact,
    node: eslintConfigNode,
    library: eslintConfigLibrary,
    test: eslintConfigTest,
    storybook: eslintConfigStorybook,
    security: eslintConfigSecurity,
    performance: eslintConfigPerformance,
  };

  const baseConfig = configs[type];
  
  if (!customOptions) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    extends: [...(baseConfig.extends || []), ...(customOptions.extends || [])],
    plugins: [...(baseConfig.plugins || []), ...(customOptions.plugins || [])],
    rules: {
      ...baseConfig.rules,
      ...customOptions.rules,
    },
    ...customOptions,
  };
}

/**
 * Monorepo ESLint configuration
 */
export const eslintConfigMonorepo = {
  root: true,
  extends: ['@nutricoach/config/eslint/base'],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.next',
    '*.config.js',
    '*.config.ts',
  ],
  overrides: [
    {
      files: ['apps/web/**/*'],
      extends: ['@nutricoach/config/eslint/react'],
    },
    {
      files: ['packages/core-services/**/*', 'packages/database/**/*'],
      extends: ['@nutricoach/config/eslint/node'],
    },
    {
      files: ['packages/shared-types/**/*', 'packages/utils/**/*', 'packages/ui/**/*'],
      extends: ['@nutricoach/config/eslint/library'],
    },
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      extends: ['@nutricoach/config/eslint/test'],
    },
    {
      files: ['**/*.stories.{ts,tsx}'],
      extends: ['@nutricoach/config/eslint/storybook'],
    },
  ],
};

/**
 * Export all configurations
 */
export const eslintConfigs = {
  base: eslintConfigBase,
  react: eslintConfigReact,
  node: eslintConfigNode,
  library: eslintConfigLibrary,
  test: eslintConfigTest,
  storybook: eslintConfigStorybook,
  security: eslintConfigSecurity,
  performance: eslintConfigPerformance,
  monorepo: eslintConfigMonorepo,
};