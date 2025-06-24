/**
 * Shared Configuration Package for NutriCoach ecosystem
 * Entry point for all configuration files
 */

// Import new extensible configurations
const { tsConfigs, createTsConfig } = require('./src/typescript');
const { eslintConfigs, createEslintConfig } = require('./src/eslint');
const { tailwindConfigs, createTailwindConfig } = require('./src/tailwind');

module.exports = {
  // New extensible configurations
  typescript: {
    configs: tsConfigs,
    create: createTsConfig,
  },
  eslint: {
    configs: eslintConfigs,
    create: createEslintConfig,
  },
  tailwind: {
    configs: tailwindConfigs,
    create: createTailwindConfig,
  },
  
  // Legacy configurations for backward compatibility
  legacy: {
    eslint: require('./eslint.config.js'),
    prettier: require('./prettier.config.js'),
    tailwind: require('./tailwind.config.js'),
    typescript: require('./tsconfig.base.json'),
  },
};

// Individual exports for direct imports (legacy)
module.exports.eslintConfig = require('./eslint.config.js');
module.exports.prettierConfig = require('./prettier.config.js');
module.exports.tailwindConfig = require('./tailwind.config.js');
module.exports.typescriptConfig = require('./tsconfig.base.json');

// New individual exports
module.exports.tsConfigs = tsConfigs;
module.exports.eslintConfigs = eslintConfigs;
module.exports.tailwindConfigs = tailwindConfigs;
module.exports.createTsConfig = createTsConfig;
module.exports.createEslintConfig = createEslintConfig;
module.exports.createTailwindConfig = createTailwindConfig;