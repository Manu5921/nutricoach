/**
 * TypeScript Configuration Variants
 * Extensible TypeScript configurations for different project types
 */

/**
 * Base TypeScript configuration
 */
export const tsConfigBase = {
  compilerOptions: {
    // Language and Environment
    target: 'ES2022',
    lib: ['DOM', 'DOM.Iterable', 'ES2022'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,

    // Module Resolution
    module: 'ESNext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    noEmitOnError: false,

    // JavaScript Support
    allowJs: true,
    checkJs: false,

    // Emit
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    outDir: './dist',
    removeComments: false,
    noEmitHelpers: false,
    importHelpers: true,

    // Type Checking
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    useUnknownInCatchVariables: true,
    alwaysStrict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    exactOptionalPropertyTypes: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedIndexedAccess: false,
    noImplicitOverride: true,
    noPropertyAccessFromIndexSignature: false,

    // Advanced Options
    incremental: true,
    composite: false,
    tsBuildInfoFile: './.tsbuildinfo',

    // JSX
    jsx: 'preserve',
    jsxFactory: 'React.createElement',
    jsxFragmentFactory: 'React.Fragment',
    jsxImportSource: 'react',

    // Path Mapping
    baseUrl: '.',
    paths: {
      '@/*': ['./src/*'],
      '@/components/*': ['./src/components/*'],
      '@/lib/*': ['./src/lib/*'],
      '@/utils/*': ['./src/utils/*'],
      '@/types/*': ['./src/types/*'],
      '@/hooks/*': ['./src/hooks/*'],
      '@/styles/*': ['./src/styles/*'],
      '@/public/*': ['./public/*'],
    },
  },
  include: [
    'src/**/*',
    'types/**/*',
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '.next/types/**/*.ts',
  ],
  exclude: [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
  'ts-node': {
    compilerOptions: {
      module: 'CommonJS',
    },
  },
};

/**
 * Next.js specific configuration
 */
export const tsConfigNextJS = {
  ...tsConfigBase,
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    plugins: [
      {
        name: 'next',
      },
    ],
    paths: {
      ...tsConfigBase.compilerOptions.paths,
      '@/*': ['./src/*'],
      '@/app/*': ['./src/app/*'],
      '@/components/*': ['./src/components/*'],
      '@/lib/*': ['./src/lib/*'],
      '@/utils/*': ['./src/utils/*'],
      '@/types/*': ['./src/types/*'],
      '@/hooks/*': ['./src/hooks/*'],
      '@/styles/*': ['./src/styles/*'],
      '@/public/*': ['./public/*'],
    },
  },
  include: [
    ...tsConfigBase.include,
    '.next/types/**/*.ts',
  ],
};

/**
 * Node.js server configuration
 */
export const tsConfigNode = {
  ...tsConfigBase,
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    target: 'ES2022',
    lib: ['ES2022'],
    module: 'CommonJS',
    moduleResolution: 'node',
    jsx: undefined,
    jsxFactory: undefined,
    jsxFragmentFactory: undefined,
    jsxImportSource: undefined,
    paths: {
      '@/*': ['./src/*'],
      '@/routes/*': ['./src/routes/*'],
      '@/middleware/*': ['./src/middleware/*'],
      '@/services/*': ['./src/services/*'],
      '@/models/*': ['./src/models/*'],
      '@/utils/*': ['./src/utils/*'],
      '@/types/*': ['./src/types/*'],
      '@/config/*': ['./src/config/*'],
    },
  },
  include: [
    'src/**/*',
    'types/**/*',
    '**/*.ts',
    '**/*.js',
  ],
  exclude: [
    'node_modules',
    'dist',
    'coverage',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],
};

/**
 * Library package configuration
 */
export const tsConfigLibrary = {
  ...tsConfigBase,
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    declaration: true,
    declarationMap: true,
    outDir: './dist',
    rootDir: './src',
    composite: true,
    incremental: true,
    jsx: 'react-jsx',
    paths: {
      '@/*': ['./src/*'],
    },
  },
  include: [
    'src/**/*',
  ],
  exclude: [
    'node_modules',
    'dist',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.stories.ts',
    '**/*.stories.tsx',
  ],
};

/**
 * Monorepo package configuration
 */
export const tsConfigMonorepo = {
  ...tsConfigBase,
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    composite: true,
    incremental: true,
    declaration: true,
    declarationMap: true,
    paths: {
      '@/*': ['./src/*'],
      '@nutricoach/shared-types': ['../shared-types/src'],
      '@nutricoach/shared-types/*': ['../shared-types/src/*'],
      '@nutricoach/utils': ['../utils/src'],
      '@nutricoach/utils/*': ['../utils/src/*'],
      '@nutricoach/core-services': ['../core-services/src'],
      '@nutricoach/core-services/*': ['../core-services/src/*'],
      '@nutricoach/ui': ['../ui/src'],
      '@nutricoach/ui/*': ['../ui/src/*'],
      '@nutricoach/database': ['../database/src'],
      '@nutricoach/database/*': ['../database/src/*'],
    },
  },
  references: [
    { path: '../shared-types' },
    { path: '../utils' },
    { path: '../core-services' },
    { path: '../ui' },
    { path: '../database' },
  ],
};

/**
 * Testing configuration
 */
export const tsConfigTest = {
  extends: './tsconfig.json',
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    types: ['vitest/globals', 'node', '@testing-library/jest-dom'],
    allowJs: true,
    resolveJsonModule: true,
    paths: {
      ...tsConfigBase.compilerOptions.paths,
      '@test/*': ['./test/*'],
      '@fixtures/*': ['./test/fixtures/*'],
      '@mocks/*': ['./test/mocks/*'],
    },
  },
  include: [
    'src/**/*',
    'test/**/*',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
  exclude: [
    'node_modules',
    'dist',
    'build',
    '.next',
  ],
};

/**
 * Storybook configuration
 */
export const tsConfigStorybook = {
  extends: './tsconfig.json',
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    allowJs: true,
    paths: {
      ...tsConfigBase.compilerOptions.paths,
      '@storybook/*': ['./.storybook/*'],
    },
  },
  include: [
    'src/**/*',
    'stories/**/*',
    '.storybook/**/*',
    '**/*.stories.ts',
    '**/*.stories.tsx',
  ],
  exclude: [
    'node_modules',
    'dist',
    'build',
  ],
};

/**
 * React Native configuration
 */
export const tsConfigReactNative = {
  ...tsConfigBase,
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    lib: ['ES2022'],
    module: 'ESNext',
    moduleResolution: 'node',
    jsx: 'react-native',
    allowSyntheticDefaultImports: true,
    noEmit: true,
    skipLibCheck: true,
    paths: {
      '@/*': ['./src/*'],
      '@/components/*': ['./src/components/*'],
      '@/screens/*': ['./src/screens/*'],
      '@/navigation/*': ['./src/navigation/*'],
      '@/services/*': ['./src/services/*'],
      '@/utils/*': ['./src/utils/*'],
      '@/types/*': ['./src/types/*'],
      '@/hooks/*': ['./src/hooks/*'],
      '@/constants/*': ['./src/constants/*'],
      '@/assets/*': ['./src/assets/*'],
    },
  },
  include: [
    'src/**/*',
    'types/**/*',
    '**/*.ts',
    '**/*.tsx',
  ],
  exclude: [
    'node_modules',
    'coverage',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
};

/**
 * Electron configuration
 */
export const tsConfigElectron = {
  ...tsConfigBase,
  compilerOptions: {
    ...tsConfigBase.compilerOptions,
    target: 'ES2022',
    lib: ['ES2022', 'DOM'],
    module: 'CommonJS',
    moduleResolution: 'node',
    paths: {
      '@/*': ['./src/*'],
      '@/main/*': ['./src/main/*'],
      '@/renderer/*': ['./src/renderer/*'],
      '@/preload/*': ['./src/preload/*'],
      '@/shared/*': ['./src/shared/*'],
      '@/utils/*': ['./src/utils/*'],
      '@/types/*': ['./src/types/*'],
    },
  },
  include: [
    'src/**/*',
    'types/**/*',
    '**/*.ts',
    '**/*.tsx',
  ],
  exclude: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
};

/**
 * Function to create custom TypeScript config
 */
export function createTsConfig(
  type: 'base' | 'nextjs' | 'node' | 'library' | 'monorepo' | 'test' | 'storybook' | 'react-native' | 'electron',
  customOptions?: any
) {
  const configs = {
    base: tsConfigBase,
    nextjs: tsConfigNextJS,
    node: tsConfigNode,
    library: tsConfigLibrary,
    monorepo: tsConfigMonorepo,
    test: tsConfigTest,
    storybook: tsConfigStorybook,
    'react-native': tsConfigReactNative,
    electron: tsConfigElectron,
  };

  const baseConfig = configs[type];
  
  if (!customOptions) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    compilerOptions: {
      ...baseConfig.compilerOptions,
      ...customOptions.compilerOptions,
    },
    ...customOptions,
  };
}

/**
 * Export all configurations
 */
export const tsConfigs = {
  base: tsConfigBase,
  nextjs: tsConfigNextJS,
  node: tsConfigNode,
  library: tsConfigLibrary,
  monorepo: tsConfigMonorepo,
  test: tsConfigTest,
  storybook: tsConfigStorybook,
  reactNative: tsConfigReactNative,
  electron: tsConfigElectron,
};