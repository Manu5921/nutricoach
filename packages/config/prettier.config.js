/**
 * Shared Prettier Configuration for NutriCoach ecosystem
 * Consistent code formatting across all projects
 */

module.exports = {
  // Print width - line length that the printer will wrap on
  printWidth: 80,

  // Tab width - number of spaces per indentation level
  tabWidth: 2,

  // Use tabs instead of spaces
  useTabs: false,

  // Semicolons - add semicolons at the end of every statement
  semi: true,

  // Single quotes - use single quotes instead of double quotes
  singleQuote: true,

  // Quote properties - only add quotes around object properties when required
  quoteProps: 'as-needed',

  // JSX quotes - use single quotes in JSX
  jsxSingleQuote: true,

  // Trailing commas - add trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: 'es5',

  // Bracket spacing - print spaces between brackets in object literals
  bracketSpacing: true,

  // JSX bracket same line - put the > of a multi-line JSX element at the end of the last line
  bracketSameLine: false,

  // Arrow function parentheses - avoid parentheses when possible
  arrowParens: 'avoid',

  // Range - format the entire file content
  rangeStart: 0,
  rangeEnd: Infinity,

  // Parser - specify which parser to use
  // (Prettier automatically infers this, but can be set explicitly)
  parser: undefined,

  // File path - specify the file path to use for config resolution
  filepath: undefined,

  // Require pragma - only format files that contain a special comment
  requirePragma: false,

  // Insert pragma - insert a special @format marker at the top of formatted files
  insertPragma: false,

  // Prose wrap - how to wrap prose (markdown)
  proseWrap: 'preserve',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Vue files script and style tags indentation
  vueIndentScriptAndStyle: false,

  // End of line - line ending style
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,

  // Override settings for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.{yaml,yml}',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
    {
      files: '*.{html,htm}',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    {
      files: '*.{js,jsx}',
      options: {
        parser: 'babel',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    {
      files: 'package.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
      },
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
  ],

  // Plugins (if needed)
  plugins: [
    // Add plugins here if needed
    // 'prettier-plugin-tailwindcss', // For Tailwind CSS class sorting
  ],
};

/**
 * Alternative configurations for different scenarios
 */

// Strict configuration with more opinionated formatting
const strictConfig = {
  ...module.exports,
  printWidth: 120,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  bracketSameLine: false,
  arrowParens: 'always',
  singleAttributePerLine: true,
};

// Compact configuration for tighter formatting
const compactConfig = {
  ...module.exports,
  printWidth: 100,
  tabWidth: 2,
  bracketSpacing: false,
  bracketSameLine: true,
  arrowParens: 'avoid',
};

// Configuration for legacy projects
const legacyConfig = {
  ...module.exports,
  printWidth: 120,
  tabWidth: 4,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: 'none',
};

module.exports.strict = strictConfig;
module.exports.compact = compactConfig;
module.exports.legacy = legacyConfig;