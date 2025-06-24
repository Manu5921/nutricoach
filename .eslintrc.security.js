// ESLint Security Configuration for NutriCoach
// Focuses on security-specific rules and patterns

module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:security/recommended',
    'plugin:node/recommended'
  ],
  plugins: [
    'security',
    'node',
    'no-secrets'
  ],
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Security-specific rules
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    
    // Prevent secrets in code
    'no-secrets/no-secrets': ['error', {
      'tolerance': 4.2,
      'additionalRegexes': {
        'AWS Access Key': 'AKIA[0-9A-Z]{16}',
        'AWS Secret Key': '[0-9a-zA-Z/+]{40}',
        'GitHub Token': 'ghp_[0-9a-zA-Z]{36}',
        'Stripe Key': 'sk_(test|live)_[0-9a-zA-Z]{24}',
        'OpenAI Key': 'sk-[A-Za-z0-9]{48}',
        'JWT Token': 'ey[A-Za-z0-9-_=]+\\.ey[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]*'
      }
    }],
    
    // Prevent dangerous patterns
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Input validation
    'no-prototype-builtins': 'error',
    'no-extend-native': 'error',
    
    // XSS Prevention
    'no-innerHTML': 'off', // Custom rule would be needed
    
    // CSRF Protection
    'no-unused-expressions': ['error', {
      'allowShortCircuit': false,
      'allowTernary': false
    }],
    
    // SQL Injection Prevention
    'no-template-curly-in-string': 'error',
    
    // Path Traversal Prevention
    'security/detect-non-literal-fs-filename': 'error',
    
    // Command Injection Prevention
    'security/detect-child-process': 'error',
    
    // Timing Attack Prevention
    'security/detect-possible-timing-attacks': 'error',
    
    // Buffer Security
    'security/detect-buffer-noassert': 'error',
    'security/detect-new-buffer': 'error',
    
    // Regular Expression Security
    'security/detect-unsafe-regex': 'error',
    'security/detect-non-literal-regexp': 'error',
    
    // Object Injection
    'security/detect-object-injection': 'error',
    
    // Cryptographic Security
    'security/detect-pseudoRandomBytes': 'error',
    
    // Additional TypeScript security rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Node.js specific security
    'node/no-deprecated-api': 'error',
    'node/prefer-global/buffer': ['error', 'never'],
    'node/prefer-global/console': ['error', 'always'],
    'node/prefer-global/process': ['error', 'never'],
    'node/prefer-global/url-search-params': ['error', 'always'],
    'node/prefer-global/url': ['error', 'always'],
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',
    
    // Custom security rules
    'no-console': ['warn', {
      'allow': ['warn', 'error', 'info']
    }],
    
    // Prevent debugging code
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Strict mode
    'strict': ['error', 'global'],
    
    // Variable security
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',
    'no-undef': 'error',
    'no-unused-vars': 'error',
    
    // Function security
    'no-caller': 'error',
    'no-iterator': 'error',
    'no-proto': 'error',
    
    // Error handling
    'no-empty-catch': 'error',
    'no-ex-assign': 'error',
    
    // Type security
    'valid-typeof': 'error',
    'use-isnan': 'error',
    
    // Control flow security
    'no-unreachable': 'error',
    'no-fallthrough': 'error',
    
    // Comparison security
    'eqeqeq': ['error', 'always'],
    'no-compare-neg-zero': 'error',
    
    // Object security
    'no-constructor-return': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error'
  },
  
  // Environment-specific overrides
  overrides: [
    {
      // API routes - stricter security
      files: ['**/api/**/*.ts', '**/api/**/*.js'],
      rules: {
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-child-process': 'error',
        'security/detect-eval-with-expression': 'error',
        'no-eval': 'error',
        'no-new-func': 'error'
      }
    },
    {
      // Database files - strict SQL injection prevention
      files: ['**/lib/supabase.ts', '**/lib/database/**/*.ts'],
      rules: {
        'no-template-curly-in-string': 'error',
        'security/detect-non-literal-regexp': 'error'
      }
    },
    {
      // Authentication files - maximum security
      files: ['**/auth/**/*.ts', '**/middleware.ts'],
      rules: {
        'security/detect-possible-timing-attacks': 'error',
        'security/detect-pseudoRandomBytes': 'error',
        'no-secrets/no-secrets': 'error'
      }
    },
    {
      // Client-side components - XSS prevention
      files: ['**/components/**/*.tsx', '**/app/**/*.tsx'],
      rules: {
        'react/no-danger': 'error',
        'react/no-danger-with-children': 'error'
      }
    },
    {
      // Configuration files - sensitive data protection
      files: ['**/config/**/*.ts', '**/next.config.js'],
      rules: {
        'no-secrets/no-secrets': 'error',
        'security/detect-object-injection': 'error'
      }
    },
    {
      // Test files - relaxed rules
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
      rules: {
        'no-secrets/no-secrets': 'off',
        'security/detect-object-injection': 'off'
      }
    }
  ],
  
  // Custom patterns to ignore (false positives)
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.min.js',
    'public/sw.js'
  ],
  
  // Settings for plugins
  settings: {
    'node': {
      'tryExtensions': ['.js', '.json', '.ts', '.tsx']
    }
  }
};